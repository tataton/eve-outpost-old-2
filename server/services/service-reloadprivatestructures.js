const axios = require('axios');
const Promise = require('bluebird');
const Op = require('sequelize').Op;
const PublicStructure = require('../services/service-database').PublicStructure;
const PrivateStructure = require('../services/service-database').PrivateStructure;
const SolarSystem = require('../services/service-database').SolarSystem;
const User = require('./service-database').User;
const UserToStructure = require('../services/service-database').UserToStructure;
const refreshCharIDToken = require('./service-refreshcharidtoken');

const reloadPrivateStructures = () => {

    Promise.all([
        // Create array of characterIDs,
        User.findAll({attributes: ['characterID']})
            .then(arrayOfUsers => arrayOfUsers.map(user => user.characterID)),
        // an array of solarSystemNames,
        SolarSystem.findAll({attributes: ['solarSystemName']})
            .then(arrayOfSystems => arrayOfSystems.map(system => system.solarSystemName)),
        // an array of public structureIDs,
        PublicStructure.findAll({attributes: ['structureID']})
            .then(arrayOfStructures => arrayOfStructures.map(structure => structure.structureID)),
        // and an array of currently entered private structureIDs.
        PrivateStructure.findAll({attributes: ['structureID']})
            .then(arrayOfStructures => arrayOfStructures.map(structure => structure.structureID))
    ])
    .then(([arrayCharIDs, arraySystemNames, arrayPublicIDs, arrayPrevPrivateIDs]) => {
        const privateStructureIDsFound = [];
        // For each registered user:
        Promise.each(arrayCharIDs, characterID => {
            const myPrivateStructureIDs = new Set();
            // Identify user's accessType (with 'read' preferred):
            return User.findOne({where: {characterID}})
                .then(user => {
                    if (user.readRefreshToken) {
                        return 'read';
                    } else if (user.writeRefreshToken) {
                        return 'write';
                    } else {
                        return Promise.reject(new Error('Error in retrieving refreshToken.'));
                    }
                })
                .then(accessType => {
                    // For each system in New Eden,
                    Promise.each(arraySystemNames, systemName => {
                        // refresh user's accessToken,
                        return refreshCharIDToken(characterID, accessType)
                            .then(accessToken => {
                                // and then retrieve all structures with the
                                // system name in the structureName.
                                return axios({
                                    method: 'get',
                                    url: `https://esi.tech.ccp.is/latest/characters/${characterID}/search/?categories=structure&datasource=tranquility&language=en-us&search=${systemName}`,
                                    headers: {
                                        'Accept': 'application/json',
                                        'Authorization': `Bearer ${accessToken}`
                                    }
                                })
                                .then(response => response.data.structure)
                                // Result will be an array of structures.
                                .then(resultArray => {
                                    // For each structure in the array,
                                    Promise.each(resultArray, foundStructureID => {
                                        if (arrayPublicIDs.includes(foundStructureID)) {
                                            // Not a private structure. Ignore it.
                                            return null;
                                        } else if (privateStructureIDsFound.includes(foundStructureID)) {
                                            // We've already hit API on this structure this scan.
                                            myPrivateStructureIDs.add(foundStructureID);
                                            return null;
                                        } else {
                                            // Private structure we haven't seen in this scan.
                                            // Let's get info.
                                            return axios({
                                                method: 'get',
                                                url: `https://esi.tech.ccp.is/latest/universe/structures/${foundStructureID}/?datasource=tranquility`,
                                                headers: {
                                                    'Accept': 'application/json',
                                                    'Authorization': `Bearer ${accessToken}`
                                                }
                                            })
                                            .then(response => response.data)
                                            .then(structureInfo => {
                                                const structureObject = {
                                                    structureID: foundStructureID,
                                                    solarSystemID: structureInfo.solar_system_id,
                                                    structureName: structureInfo.name,
                                                    typeID: structureInfo.type_id
                                                };
                                                return Promise.all([
                                                    SolarSystem.findById(structureInfo.solar_system_id),
                                                    // and we check to see if the structure is already
                                                    // in the database.
                                                    PrivateStructure.findById(foundStructureID),
                                                    structureObject
                                                ])
                                            })
                                        }
                                    })
                                })
                            })
                    })
                })
        })
    })
};
