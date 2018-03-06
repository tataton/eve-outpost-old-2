/* Checks accessToken associated with an authenticated session character (passed
as an argument to this function), and if it is expired, refreshes it. 
Then, resolves a promise either with new accessToken (if refreshed)
or old one (if not). Usually, this would be done as a precursor to a
logged-in user accessing an authed EVE API. */

const refreshSessionToken = (session) => {

};

module.exports = refreshSessionToken;