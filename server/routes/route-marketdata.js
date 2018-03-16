// In progress. Not currently being used.


const express = require('express');
const router = express.Router();
// const refresh = require('../modules/module-token-refresh');
const User = require('../services/service-database').User;
const refreshSessionToken = require('../services/service-refreshsessiontoken');

router.get('/single/:id', (req, res) => {
    // Route returns market data for a single market, indicated by its
    // station/structure ID (req.params.id). This single route is
    // designed to serve both authed and non-authed users; it only needs
    // auth info if target is a private structure. 

    // Include code to check this.
    
    
    // If user is authed AND target is private,
    // it checks to make sure accessToken is fresh and refreshes if
    // necessary.
    if (req.isAuthenticated()) {
        
        const accessType = req.session.passport.user.character.accessType;
        const accessTokenDate = new Date(req.session.passport.user.character.ExpiresOn);

        // 1. Check session ExpiresOn value for expiration.
        if (Date.now() - accessTokenDate > 900000) {
            // (if token is more than 15 minutes old)
            User.findOne({where: {characterID: character.CharacterID}})
                .then(foundUser => {
                    refresh.requestNewAccessToken(`oauth2-${accessType}`, foundUser[`${accessType}RefreshToken`], (err, accessToken) => {
                        // You have a new access token, store it in the user object,
                        // or use it to make a new request.
                        // `refreshToken` may or may not exist, depending on the strategy you are using.
                        // You probably don't need it anyway, as according to the OAuth 2.0 spec,
                        // it should be the same as the initial refresh token.
                      
                      });
                })

        }
        // 2a. If not expired, get accessToken from DB and use.
        // 2b. If expired, get refreshToken from DB.
        // 2c. Then, use refreshToken to get accessToken.
        // 2d. Update session and database time and data.
        // 3. Use accessToken to get one page of data.
        // 4. If X-Pages header indicates multiple pages, create array
        //    of request promises to fulfill.
        // 5. Analyze data to create array for display.
        // 6. Get trade hub data for each item on sale.
        // 7. Incorporate this data into array.
        // 8. Send data back to client.





        // After setting new session value,
        // req.session.save(function(err) {console.log(err);}
    } else {
        res.sendStatus(403);
    }
});