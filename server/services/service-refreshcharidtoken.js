/* Function that checks accessToken associated with a characterID
and accessType, and if it is expired, refreshes it. Then, the function
resolves a promise, either with a new accessToken (if refreshed)
or the old one (if not). This function could be called on its
own, in service of an offline, scheduled API call; or it could be called
by the refreshSessionToken service, which then uses the returned token
to update the session info. This method only deals with database info. */

const refresh = require('passport-oauth2-refresh');
const User = require('./service-database').User;

const refreshCharIDToken = (characterID, accessType = 'read') => {
    return new Promise((resolve, reject) => {
        User.findOne({where: {characterID}})
            .then(foundUser => {
                const currentDate = new Date();
                const ageOfToken = Date.parse(currentDate) - Date.parse(foundUser[`${accessType}AccessExpires`]);
                if (ageOfToken > 900000) {
                    // (if token is more than 15 minutes old)
                    refresh.requestNewAccessToken(`oauth2-${accessType}`, 
                        foundUser[`${accessType}RefreshToken`],
                        (err, newAccessToken) => {
                            if (err) {
                                console.log(err);
                                reject(err);
                            } else {
                                foundUser[`${accessType}AccessToken`] = newAccessToken;
                                foundUser[`${accessType}AccessExpires`] = currentDate;
                                foundUser.save();
                                resolve(newAccessToken);
                            }
                        }
                    );
                } else {
                    resolve(foundUser[`${accessType}AccessToken`]);
                }
            })
    });
};

module.exports = refreshCharIDToken;