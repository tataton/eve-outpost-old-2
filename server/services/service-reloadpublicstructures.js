/* Loads list of public structures, and then data about those
structures, into the remote database. The service runs periodically
under the control of server.js. */

const Promise = require('bluebird');
const http = require('./service-http');
const PublicStructure = require('../services/service-database').PublicStructure;
const SolarSystem = require('../services/service-database').SolarSystem;
const User = require('./service-database').User;

const reloadPublicStructures = () => 
    Promise.all([
        // Get past public structure references from database, for later.
        PublicStructure.findAll(),
        // Get admin user record for all auth.
        User.findOne({where: {characterID: process.env.ADMIN_CHARID}})
    ])
    .then(([arrayPrevPublicStructures, admin]) => {
        http.getAllPublicStructures()
        .then(structureIDArray => 
            Promise.map(structureIDArray, foundStructureID => 
                // Then, for each structureID in the array,
                http.getStructureInfo(admin, foundStructureID)
                    .then(structureObject => {
                        // Is this structure already in the database?
                        const structure = arrayPrevPublicStructures.find(structure => structure.structureID == foundStructureID)
                        if (!structure) {
                            // if we don't find the structure, we create it.
                            return PublicStructure.create(structureObject);
                        } else if ((structure.structureName !== structureObject.structureName) || (structure.hasMarket !== structureObject.hasMarket)) {
                            // otherwise, if something changed, we update it
                            return structure.update(structureObject, {fields:
                                ['structureName', 'hasMarket']});
                        }
                    })
                    .catch(err => {console.log(err)})
            , {concurrency: Number(process.env.PROMISE_CONCURRENCY)})

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
    });

module.exports = reloadPublicStructures;