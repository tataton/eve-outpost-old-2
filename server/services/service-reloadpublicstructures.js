/* Loads list of public structures, and then data about those
structures, into the remote database. The service runs periodically
under the control of server.js. */

const axios = require('axios');
const PublicStructure = require('../services/service-database').PublicStructure;
const refreshCharIDToken = require('./service-refreshcharidtoken');

const reloadPublicStructures = () => {
    // First, get list of all public structureIDs.
    axios({
        method: 'get',
        url: 'https://esi.tech.ccp.is/latest/universe/structures/?datasource=tranquility',
        headers: {'accept': 'application/json'}
    })
    .then(response => response.data)
    .then(structureIDArray => {
        refreshCharIDToken(process.env.ADMIN_CHARID)
        .then(accessToken => {
            axios({
                method: 'get',
                url: `https://esi.tech.ccp.is/latest/universe/structures/${structureIDArray[0]}/?datasource=tranquility`,
                headers: {
                    'accept': 'application/json',
                    'authorization': `Bearer ${accessToken}`
                }
            })
            .then(response => response.data)
            .then(object => {console.log(object)})
        })
    })
    .catch(err => {return cb(err)});
};

module.exports = reloadPublicStructures;