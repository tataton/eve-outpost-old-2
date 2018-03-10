const axios = require('axios');
const Promise = require('bluebird');
const Op = require('sequelize').Op;
const PublicStructure = require('../services/service-database').PublicStructure;
const PrivateStructure = require('../services/service-database').PrivateStructure;
const SolarSystem = require('../services/service-database').SolarSystem;
const User = require('./service-database').User;
const UserToStructure = require('../services/service-database').UserToStructure;
const refreshUserToken = require('./service-refreshusertoken');

const reloadPrivateStructures = () => {
    return Promise.all([
        // Get past private structure references from database, for later.
        PrivateStructure.findAll(),
        // Create array of users,
        User.findAll(),
        // relational sheet of users and private structures,
        UserToStructure.findAll(),
        // an array of solarSystems,
        SolarSystem.findAll({attributes: ['solarSystemName', 'solarSystemID', 'regionID']}),
        // and an array of public structureIDs for reference.
        PublicStructure.findAll({attributes: ['structureID']})
            .then(arrayOfStructures => arrayOfStructures.map(structure => Number(structure.structureID)))
    ])
    .then(([arrayPrevPrivateStructures, arrayUsers, userToStructureArray, solarSystems, arrayPublicIDs]) => {
        const privateStructureIDsFound = new Set();
        // For each registered user:
        return Promise.each(arrayUsers, user => {
            const myPrivateStructureIDs = new Set();
            // Identify user's accessType (with 'read' preferred):
            const accessType = user.readRefreshToken ? 'read' : 'write';
            // For each system in New Eden,
            return Promise.map(solarSystems, system => {
                // refresh user's accessToken,
                return refreshUserToken(user, accessType)
                    .then(accessToken => {
                        // and then retrieve all structures with the
                        // system name in the structureName.
                        return axios({
                            method: 'get',
                            url: `https://esi.tech.ccp.is/latest/characters/${user.characterID}/search/?categories=structure&datasource=tranquility&language=en-us&search=${system.solarSystemName}`,
                            headers: {
                                'Accept': 'application/json',
                                'Authorization': `Bearer ${accessToken}`
                            }
                        })
                        .then(response => response.data)
                        // Result may contain an array of structures.
                        .then(data => {
                            if (data.structure) {
                                const resultArray = data.structure;
                                // For each structure in the array,
                                return Promise.each(resultArray, foundStructureID => {
                                    if (arrayPublicIDs.includes(foundStructureID)) {
                                        // Not a private structure. Ignore it completely.
                                        return null;
                                    } else if (privateStructureIDsFound.has(foundStructureID)) {
                                        // We've already hit API on this structure this scan; we have
                                        // its data already. Just add it to user's connections.
                                        myPrivateStructureIDs.add(foundStructureID);
                                        return null;
                                    } else {
                                        // Private structure we haven't seen in this scan.
                                        // Let's get info and update/add it.
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
                                            myPrivateStructureIDs.add(foundStructureID);
                                            privateStructureIDsFound.add(foundStructureID);
                                            const structureObject = {
                                                structureID: foundStructureID,
                                                solarSystemID: structureInfo.solar_system_id,
                                                structureName: structureInfo.name,
                                                typeID: structureInfo.type_id
                                            };
                                            const system = solarSystems.find(system => (system.solarSystemID === structureInfo.solar_system_id));
                                            structureObject.regionID = system ? system.regionID : null;
                                            // Check to see if structure is already in the database.
                                            const structure = arrayPrevPrivateStructures.find(structure => (structure.structureID == foundStructureID));
                                            // See if our structure has a market, and add the hasMarket flag
                                            // to structureObject.
                                            const axiosWithErrCheck = axios.create();
                                            axiosWithErrCheck.interceptors.response.use(response => {
                                                    structureObject.hasMarket = true;
                                                    return response;
                                                }, error => {
                                                    if (error.response.status = 403) {
                                                        structureObject.hasMarket = false;
                                                        // Introduce a delay to deal with CCP error
                                                        // throttling.                            
                                                        if (error.response.headers['x-esi-error-limit-remain'] < (2 * Number(process.env.PROMISE_CONCURRENCY))) {
                                                            return Promise.delay((1000 * error.response.headers['x-esi-error-limit-reset']) + 2000)
                                                            .then(() => {return null});
                                                        } else {
                                                            return Promise.resolve(null);
                                                        }
                                                    } else {
                                                        return Promise.reject(error);
                                                    }
                                            });
                                            return refreshUserToken(user)
                                                .then(accessToken => axiosWithErrCheck({
                                                    method: 'get',
                                                    url: `https://esi.tech.ccp.is/latest/markets/structures/${foundStructureID}/?datasource=tranquility`,
                                                    headers: {
                                                        'Accept': 'application/json',
                                                        'Authorization': `Bearer ${accessToken}`
                                                    }
                                                }))
                                                .then(() => {
                                                    if (!structure) {
                                                        // If the structure wasn't previously found in
                                                        // the database, we create it.
                                                        return PrivateStructure.create(structureObject);
                                                    } else if ((structure.structureName !== structureObject.structureName) || (structure.hasMarket !== structureObject.hasMarket)) {
                                                        // Otherwise, if anything changed, we just update the existing structure.
                                                        return structure.update(structureObject, {fields:
                                                            ['structureName', 'hasMarket']});
                                                    }
                                                })
                                        }) // end adding new structure to database
                                    } // end if/else if/else
                                }) // end of what to do with each structure in a system
                            } else {
                                console.log("No structures found in this system.")
                                return Promise.resolve();
                            }
                        }) // end api call to get all structures in a system, & consequences
                    }) // end then scope after token renewal
            }, {concurrency: Number(process.env.PROMISE_CONCURRENCY)}) // end of what to do with each system in New Eden
            .then(() => Promise.map(userToStructureArray, connection => {
                // Remove old relational connections for this user.
                if (!myPrivateStructureIDs.has(Number(connection.structureID))) {
                    return connection.destroy();
                } else {
                    return Promise.resolve();
                }
            }))
            .then(() => Promise.map(myPrivateStructureIDs, foundStructureID => {
                // Add new relational connections for this user.
                if (!userToStructureArray.find(element => ((element.structureID == foundStructureID) && (element.characterID == user.characterID)))) {
                    return UserToStructure.create({structureID: foundStructureID, characterID: user.characterID});
                } else {
                    return Promise.resolve();
                }
            }))
        }) // end of what to do with each user
        .then(() => {
            // Delete un-found private structures, and private structures
            // that now appear public, from private database.
            arrayPrevPrivateStructures.forEach(structure => {
                if ((!privateStructureIDsFound.has(Number(structure.structureID))) || (arrayPublicIDs.includes(Number(structure.structureID)))) {
                    structure.destroy()
                }
            });
        })
    })
};

module.exports = reloadPrivateStructures;