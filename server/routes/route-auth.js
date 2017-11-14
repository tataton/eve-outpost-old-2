/* Handles authentication requests for login, logout,
and identification, to endpoint '/auth..'. */

const express = require('express');
const router = express.Router();
const passport = require('../modules/module-passport');

router.get('/read/login', passport.authenticate('oauth2-read'));
router.get('/write/login', passport.authenticate('oauth2-write'));

router.get('/read/callback', passport.authenticate('oauth2-read', {failureRedirect: '/'}), (req, res) => {
    // May or may not fill this in with params info to pass to React.
    // req.session.passport.user will now contain character info.
    res.redirect('/');
});

router.get('/write/callback', passport.authenticate('oauth2-write', {failureRedirect: '/'}), (req, res) => {
    // May or may not fill this in with params info to pass to React.
    // req.session.passport.user will now contain character info.
    res.redirect('/');
});

router.get('/getuserinfo', (req, res) => {
    if (req.isAuthenticated()) {
        console.log('req.session.passport.user', req.session.passport.user);
        res.send(
            {
                characterID: req.session.passport.user.character.CharacterID,
                characterName: req.session.passport.user.character.CharacterName
            }
        );
    } else {
        res.sendStatus(403);
    }
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

module.exports = router;