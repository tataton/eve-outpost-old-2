const express = require('express');
const router = express.Router();
const User = require('../services/service-database').User;

router.get('/get', (req, res) => {
    if (req.isAuthenticated()) {
        User.findOne({where: {characterID: req.user.character.CharacterID}})
            .then((character) => {
                res.send({
                    chosenLocation: character.chosenLocation
                })
            });
    } else {
        res.sendStatus(403);
    }
});

router.post('/set', (req, res) => {
    if (req.isAuthenticated()) {
        User.findOne({where: {characterID: req.user.character.CharacterID}})
            .then((character) => {
                character.update({chosenLocation: req.body.newLocation});
                req.session.passport.user.character.chosenLocation= req.body.newLocation;
                req.session.save(function(err) {console.log(err);});
                res.sendStatus(200);
            });
    } else {
        res.sendStatus(403);
    }
});

module.exports = router;