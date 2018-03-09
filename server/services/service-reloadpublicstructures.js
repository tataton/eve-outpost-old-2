/* Loads list of public structures, and then data about those
structures, into the remote database. The service runs periodically
under the control of server.js. */

const axios = require('axios');
const Promise = require('bluebird');
const Op = require('sequelize').Op;
const PublicStructure = require('../services/service-database').PublicStructure;
const SolarSystem = require('../services/service-database').SolarSystem;
const refreshCharIDToken = require('./service-refreshcharidtoken');

const reloadPublicStructures = () => {
    // Get past public structures from database, for later.
    const arrayPrevPublicStructures = PublicStructure.findAll();
    // Get array of all current public structureIDs from CCP.
    return axios({
            method: 'get',
            url: 'https://esi.tech.ccp.is/latest/universe/structures/?datasource=tranquility',
            headers: {'Accept': 'application/json'}
    })
    .then(response => response.data)
    .then(structureIDArray => 
        Promise.each(structureIDArray, (structureID) => {
            // Then, for each structureID in the array,
            return refreshCharIDToken(process.env.ADMIN_CHARID)
            // make sure admin accessToken is updated,
            .then(accessToken => {
                // and use it to get data on the current structureID.
                return axios({
                    method: 'get',
                    url: `https://esi.tech.ccp.is/latest/universe/structures/${structureID}/?datasource=tranquility`,
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    }
                })
            })
            .then(response => response.data)
            .then(structureInfo => {
                // The data gets packaged into an object,
                const structureObject = {
                    structureID,
                    solarSystemID: structureInfo.solar_system_id,
                    structureName: structureInfo.name,
                    typeID: structureInfo.type_id
                };
                return Promise.all([
                    SolarSystem.findById(structureInfo.solar_system_id),
                    // and we check to see if the structure is already
                    // in the database.
                    PublicStructure.findById(structureID),
                    structureObject
                ])
            })
            .then(([system, structure, structureObject]) => {
                // We include regionID in the update object.
                structureObject.regionID = system ? system.regionID : null;
                // Next, we'll check to see if our structure has a market,
                // and add the hasMarket flag to structureObject.
                const axiosWithErrCheck = axios.create();
                axiosWithErrCheck.interceptors.response.use(response => {
                    structureObject.hasMarket = true;
                    return response;
                }, error => {
                    if (error.response.status = 403) {
                        structureObject.hasMarket = false;
                        // Introduce a delay to deal with CCP error
                        // throttling.
                        return Promise.delay(1000)
                            .then(() => {return null});
                    } else {
                        return Promise.reject(error);
                    }
                });
                return refreshCharIDToken(process.env.ADMIN_CHARID)
                    .then(accessToken => axiosWithErrCheck({
                        method: 'get',
                        url: `https://esi.tech.ccp.is/latest/markets/structures/${structureID}/?datasource=tranquility`,
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${accessToken}`
                        }
                    }))
                    .then(() => {
                        // If we found the structure in the database already,
                        if (structure) {
                            // we just update its name and hasMarket (because
                            // that's all that can change);
                            return structure.update(structureObject, {fields:
                                ['structureName', 'hasMarket']
                            });
                        } else {
                            // if we don't find it, we create it.
                            return PublicStructure.create(structureObject);
                        }
                    })
            })
            .catch(err => {console.log(err)})
        })
        .then(() => {
            // Then, if there are any structures in the public database
            // that weren't in the list of public structures, we delete
            // them. (They may have become private, in which case they will
            // need to be found again.)
            arrayPrevPublicStructures.forEach(structure => {
                if (!structureIDArray.includes(structure.structureID)) {
                    structure.destroy()
                }
            })
        })
    )
    .catch(err => {console.log(err)});
};

module.exports = reloadPublicStructures;