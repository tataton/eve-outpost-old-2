// In progress. Not currently being used.

const http = require('./service-http');
const Promise = require('bluebird');
const PublicStructure = require('../services/service-database').PublicStructure;
const PrivateStructure = require('../services/service-database').PrivateStructure;
const SolarSystem = require('../services/service-database').SolarSystem;
const User = require('./service-database').User;
const UserToStructure = require('../services/service-database').UserToStructure;

const reloadPrivateStructures = () => {
    return Promise.all([
        // Get past private structure references from database, for later.
        PrivateStructure.findAll(),
        // Create array of users,
        User.findAll(),
        // relational sheet of users and private structures,
        UserToStructure.findAll(),
        // an array of solarSystem references,
        SolarSystem.findAll({attributes: ['solarSystemName', 'solarSystemID']}),
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
                return http.getAllPrivateStructuresInSystem(user, system.solarSystemName, accessType)
                    .then(foundStructureIDArray => {
                        // Result might be undefined.
                        if (foundStructureIDArray) {
                            // For each structure in the array,
                            return Promise.each(foundStructureIDArray, foundStructureID => {
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
                                    return http.getStructureInfo(user, foundStructureID, accessType)
                                        .then(structureObject => {
                                            myPrivateStructureIDs.add(foundStructureID);
                                            privateStructureIDsFound.add(foundStructureID);
                                            // Check to see if structure is already in the database.
                                            const structure = arrayPrevPrivateStructures.find(structure => (structure.structureID == foundStructureID));
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
                                        .catch(err => {console.log(err)});
                                } // end if/else if/else
                            }) // end of what to do with each structure in a system
                        } // end if
                    }) // end api call to get all structures in a system, & consequences
                    .catch(err => {console.log(err)});
            }, {concurrency: Number(process.env.PROMISE_CONCURRENCY)}) // end of what to do with each system in New Eden
            .then(() => Promise.map(userToStructureArray, connection => {
                // Remove old relational connections for this user.
                if (!myPrivateStructureIDs.has(Number(connection.structureID)) && connection.characterID == user.characterID) {
                    return connection.destroy();
                } else {
                    return null;
                }
            }))
            .then(() => Promise.map(myPrivateStructureIDs, foundStructureID => {
                // Add new relational connections for this user.
                if (!userToStructureArray.find(element => ((element.structureID == foundStructureID) && (element.characterID == user.characterID)))) {
                    return UserToStructure.create({structureID: foundStructureID, characterID: user.characterID});
                } else {
                    return null;
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