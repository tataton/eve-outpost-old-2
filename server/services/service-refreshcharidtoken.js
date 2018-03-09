/* Function that checks accessToken associated with a characterID
and accessType, and if it is expired, refreshes it. Then, the function
resolves a promise, either with a new accessToken (if refreshed)
or the old one (if not). This function could be called on its
own, in service of an offline, scheduled API call; or it could be called
by the refreshSessionToken service, which then uses the returned token
to update the session info. This method only deals with database info. */

const Promise = require('bluebird');
const requestNewAccessToken = Promise.promisify(require('passport-oauth2-refresh').requestNewAccessToken);
const User = require('./service-database').User;

const refreshCharIDToken = (characterID, accessType = 'read') => 

    User.findOne({where: {characterID}})
        .then(foundUser => {
            const timeToExpiration = Date.parse(foundUser[`${accessType}AccessExpires`]) - Date.now();
            if (timeToExpiration < 150000) {
                // Less than 2.5 minutes left, or expired.
                return requestNewAccessToken(`oauth2-${accessType}`, 
                            foundUser[`${accessType}RefreshToken`])
                        .then(newAccessToken => {
                            foundUser[`${accessType}AccessToken`] = newAccessToken;
                            foundUser[`${accessType}AccessExpires`] = new Date(Date.now() + 1200000);
                            foundUser.save();
                            return newAccessToken;
                        })
            } else {
                return foundUser[`${accessType}AccessToken`];
            }
        });

module.exports = refreshCharIDToken;