/* Loads list of public structures, and then data about those
structures, into the remote database. The service runs periodically
under the control of server.js. */

const axios = require('axios');
const Promise = require('bluebird');
const PublicStructure = require('../services/service-database').PublicStructure;
const SolarSystem = require('../services/service-database').SolarSystem;
const User = require('./service-database').User;
const refreshUserToken = require('./service-refreshusertoken');

const reloadPublicStructures = () => {
    return Promise.all([
        // Get past public structure references from database, for later.
        PublicStructure.findAll(),
        // Relationship between solar systems and regions.
        SolarSystem.findAll({attributes: ['solarSystemID', 'regionID']}),
        // Get admin user record for all auth.
        User.findOne({where: {characterID: process.env.ADMIN_CHARID}})
    ])
    .then(([arrayPrevPublicStructures, solarSystems, admin]) => {
        return axios({
            method: 'get',
            url: 'https://esi.tech.ccp.is/latest/universe/structures/?datasource=tranquility',
            headers: {'Accept': 'application/json'}
        })
        .then(response => response.data)
        .then(structureIDArray => 
            Promise.map(structureIDArray, (structureID) => {
                console.log("Checking ", structureID);
                // Then, for each structureID in the array,
                return refreshUserToken(admin)
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
                    // We include regionID in the update object.
                    const system = solarSystems.find(system => (system.solarSystemID == structureInfo.solar_system_id));
                    structureObject.regionID = system ? system.regionID : null;
                    const structure = arrayPrevPublicStructures.find(structure => (structure.structureID == structureID));
                    // Next, we'll check to see if our structure has a market,
                    // and add the hasMarket flag to structureObject.
                    const axiosWithErrCheck = axios.create();
                    axiosWithErrCheck.interceptors.response.use(response => {
                        structureObject.hasMarket = true;
                        return response;
                    }, error => {
                        if (error.response.status = 403) {
                            console.log("Error limit: ", error.response.headers['x-esi-error-limit-remain'])
                            structureObject.hasMarket = false;
                            // Introduce a delay to deal with CCP error
                            // throttling.                            
                            if (error.response.headers['x-esi-error-limit-remain'] < (2 * Number(process.env.PROMISE_CONCURRENCY))) {
                                console.log ("Reported delay time required: ", error.response.headers['x-esi-error-limit-reset'])
                                return Promise.delay((1000 * error.response.headers['x-esi-error-limit-reset']) + 2000)
                                .then(() => {return null});
                            } else {
                                return Promise.resolve();
                            }
                        } else {
                            return Promise.reject(error);
                        }
                    });
                    return refreshUserToken(admin)
                        .then(accessToken => axiosWithErrCheck({
                            method: 'get',
                            url: `https://esi.tech.ccp.is/latest/markets/structures/${structureID}/?datasource=tranquility`,
                            headers: {
                                'Accept': 'application/json',
                                'Authorization': `Bearer ${accessToken}`
                            }
                        }))
                        .then(() => {
                            if (!structure) {
                                // if we don't find the structure, we create it.
                                return PublicStructure.create(structureObject);
                            } else if ((structure.structureName !== structureObject.structureName) || (structure.hasMarket !== structureObject.hasMarket)) {
                                // otherwise, if something changed, we update it
                                return structure.update(structureObject, {fields:
                                    ['structureName', 'hasMarket']});
                            }
                        })
                })
                .catch(err => {console.log(err)})
            }, {concurrency: Number(process.env.PROMISE_CONCURRENCY)})
            .then(() => {
                // Then, if there are any structures in the public database
                // that weren't in the list of public structures, we delete
                // them. (They may have become private, in which case they will
                // need to be found again.)
                arrayPrevPublicStructures.forEach(structure => {
                    if (!structureIDArray.includes(Number(structure.structureID))) {
                        structure.destroy()
                    }
                })
            })
        )
        .catch(err => {console.log(err)});
    })
};

module.exports = reloadPublicStructures;