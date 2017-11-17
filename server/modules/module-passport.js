/* Module that configures passport for both read- and
write-access login, and then exports its instance. */

const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const axios = require('axios');
const AUTH_URL = 'https://login.eveonline.com/oauth/authorize';
const TOKEN_URL = 'https://login.eveonline.com/oauth/token';
const READ_AUTH_CALLBACK_URL = `${process.env.CALLBACK_PROTOCOL}://${process.env.CALLBACK_FQDN}/auth/read/callback`;
const WRITE_AUTH_CALLBACK_URL = `${process.env.CALLBACK_PROTOCOL}://${process.env.CALLBACK_FQDN}/auth/write/callback`;
const WRITE_AUTH_SCOPES = ['esi-assets.read_assets.v1', 'esi-markets.read_character_orders.v1'];
const AUTH_VERIFY_URL = 'https://login.eveonline.com/oauth/verify';

const User = require('../services/service-database').User;

passport.use('oauth2-read', new OAuth2Strategy(
    {
        authorizationURL: AUTH_URL,
        tokenURL: TOKEN_URL,
        clientID: process.env.READ_AUTH_CLIENT_ID,
        clientSecret: process.env.READ_AUTH_CLIENT_SECRET,
        callbackURL: READ_AUTH_CALLBACK_URL
    },
    (accessToken, refreshToken, profile, cb) => {
        axios({
            method: 'get',
            url: AUTH_VERIFY_URL,
            headers: {'Authorization': `Bearer ${accessToken}`},
        })
        .then(response => response.data)
        .then(character => {
            User
                .findOne({where: {characterID: character.CharacterID}})
                .then(foundUser => {
                    const userProps = {
                        accessToken, 
                        accessExpires: character.ExpiresOn, 
                        refreshToken,
                        characterID: character.CharacterID,
                        characterName: character.CharacterName,
                        characterOwnerHash: character.CharacterOwnerHash,
                        apiAccess: false
                    };
                    if (foundUser) {
                        foundUser.update(userProps,
                            {fields: ['accessToken', 'accessExpires', 'refreshToken']})
                    } else {
                        User.create(userProps)
                    }
                });
            return cb(null, {character})
        })
        .catch(err => {return cb(err)});
    }
));

passport.use('oauth2-write', new OAuth2Strategy({
    authorizationURL: AUTH_URL,
    tokenURL: TOKEN_URL,
    clientID: process.env.WRITE_AUTH_CLIENT_ID,
    clientSecret: process.env.WRITE_AUTH_CLIENT_SECRET,
    callbackURL: WRITE_AUTH_CALLBACK_URL,
    scope: WRITE_AUTH_SCOPES
},
    (accessToken, refreshToken, profile, cb) => {
        axios({
            method: 'get',
            url: AUTH_VERIFY_URL,
            headers: {'Authorization': `Bearer ${accessToken}`},
        })
        .then(response => response.data)
        .then(character => {
            User
                .findOne({where: {characterID: character.CharacterID}})
                .then(foundUser => {
                    const userProps = {
                        accessToken, 
                        accessExpires: character.ExpiresOn, 
                        refreshToken,
                        characterID: character.CharacterID,
                        characterName: character.CharacterName,
                        characterOwnerHash: character.CharacterOwnerHash,
                        apiAccess: true
                    };
                    if (foundUser) {
                        foundUser.update(userProps,
                            {fields: ['accessToken', 'accessExpires', 'refreshToken', 'apiAccess']})
                    } else {
                        User.create(userProps)
                    }
                });
            return cb(null, {character})
        })
        .catch(err => {return cb(err)});
    }
));

passport.serializeUser((user, done) => {
    /* For now, serializing entire user object. In the future,
    better to just serialize some user id property. */
    done(null, user);
});

passport.deserializeUser((user, done) => {
    /* If additional details about user account are needed
    attached to the session, incorporate database call
    here. Currently, EVE SSO server gives us all the info
    we need. */
    return done(null, user);
});

module.exports = passport;