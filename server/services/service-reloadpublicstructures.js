/* Loads list of public structures, and then data about those
structures, into the remote database. The service runs periodically
under the control of server.js. */

const axios = require('axios');
const Promise = require('bluebird');
const PublicStructure = require('../services/service-database').PublicStructure;
const refreshCharIDToken = require('./service-refreshcharidtoken');

const reloadPublicStructures = () => {
    // First, get list of all public structureIDs and refresh admin accesstoken.
    Promise.all([
        // 1st Promise in series
        axios({
            method: 'get',
            url: 'https://esi.tech.ccp.is/latest/universe/structures/?datasource=tranquility',
            headers: {'accept': 'application/json'}
        }).then(response => response.data),
        // 2nd Promise is series
        refreshCharIDToken(process.env.ADMIN_CHARID)
    ])
    .then(([structureIDArray, accessToken]) => 
        Promise.map(structureIDArray, (structureID) => {
            return axios({
                method: 'get',
                url: `https://esi.tech.ccp.is/latest/universe/structures/${structureID}/?datasource=tranquility`,
                headers: {
                    'accept': 'application/json',
                    'authorization': `Bearer ${accessToken}`
                }
            })
            .then(response => response.data)
            .then(structureInfo => {
                console.log(structureInfo)
            })
        }, {concurrency: Number(process.env.PROMISE_CONCURRENCY)})
    )
    .catch(err => {console.log(err)});
};

module.exports = reloadPublicStructures;