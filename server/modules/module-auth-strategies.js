// DRY, curried approach to generating OAuth strategies for both
// Passport and 

const OAuth2Strategy = require('passport-oauth2');
const axios = require('axios');
const AUTH_URL = 'https://login.eveonline.com/oauth/authorize';
const TOKEN_URL = 'https://login.eveonline.com/oauth/token';
const AUTH_VERIFY_URL = 'https://login.eveonline.com/oauth/verify';

const callbackURLString = (authType) =>
    `${process.env.CALLBACK_PROTOCOL}://${process.env.CALLBACK_FQDN}/auth/${authType}/callback`;

const authScopes = {
    read: [
        'esi-search.search_structures.v1',
        'esi-universe.read_structures.v1',
        'esi-markets.structure_markets.v1'
    ]
};
authScopes.write = [...authScopes.read,
    'esi-assets.read_assets.v1',
    'esi-markets.read_character_orders.v1'
];

const User = require('../services/service-database').User;

// Callback for OAuthStrategy definitions, curried w/ string that
// determines whether character is logging in with read or write access.
const updateAuth = (tokenType) => ((accessToken, refreshToken, profile, cb) => {
    axios({
        method: 'get',
        url: AUTH_VERIFY_URL,
        headers: {'Authorization': `Bearer ${accessToken}`},
    })
    .then(response => response.data)
    // EVE Auth server responds to verify query w/ character object.
    .then(character => {
        User
            // First, search User database for characterID.
            .findOne({where: {characterID: character.CharacterID}})
            .then(foundUser => {
                const userProps = { 
                    characterID: character.CharacterID,
                    characterName: character.CharacterName,
                    characterOwnerHash: character.CharacterOwnerHash
                };
                userProps[`${tokenType}AccessToken`] = accessToken;
                userProps[`${tokenType}RefreshToken`] = refreshToken;
                userProps[`${tokenType}AccessExpires`] = character.ExpiresOn;

                if (foundUser) {
                    // Update database user with token info.
                    foundUser.update(userProps, {fields:
                        [`${tokenType}AccessToken`,
                            `${tokenType}RefreshToken`,
                            `${tokenType}AccessExpires`]
                    })
                } else {
                    // Sequelize.Model.findOne resolves promise even if no
                    // result is found; in this case, foundUser = null.
                    // (Promise is rejected only if there is an error
                    // accessing the database.) In this case, create new
                    // user with character object.
                    User.create(userProps)
                }
            });
        return cb(null, {character})
        // Currently, we're returning the entire character object to
        // be serialized. This is that we don't have to go back to the
        // database for any of this info. We could, however, return
        // much less (like, say, a unique user.id).
    })
    .catch(err => {return cb(err)});
});

// Curried function for generating OAuth2Strategies:
const strategy = (authType) => (new OAuth2Strategy(
    {
        authorizationURL: AUTH_URL,
        tokenURL: TOKEN_URL,
        clientID: process.env[`${authType.toUpperCase()}_AUTH_CLIENT_ID`],
        clientSecret: process.env[`${authType.toUpperCase()}_AUTH_CLIENT_SECRET`],
        callbackURL: callbackURLString(authType),
        scope: authScopes[authType]
    },
    updateAuth(authType)
));

module.exports.readStrategy = strategy('read');
module.exports.writeStrategy = strategy('write');