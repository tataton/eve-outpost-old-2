const express = require('express');
const path = require('path');
const app = express();
const helmet = require('helmet');
const axios = require('axios');
const passport = require('passport');
const session = require('express-session');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const sessionStore = require('./server/services/service-database').SessionStore;

const sessionObject = {
    secret: process.env.SESSION_SECRET,
    name: process.env.COOKIE_NAME,
    store: sessionStore,
    saveUninitialized: false,
    resave: false,
    cookie: {}
};

/* Need to figure out how to use this correctly:
if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy
    sessionObject.cookie.secure = true // serve secure cookies
}
*/

app.use(helmet());
app.use(session(sessionObject));
app.use(passport.initialize());
app.use(passport.session());

/** ---------- ROUTES ---------- **/
const auth = require('./server/routes/route-auth');
app.use('/auth', auth);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

app.get('/api/factions', (req, res) => {
    axios('https://esi.tech.ccp.is/latest/universe/factions')
        .then(response => response.data)
        .then(results => {
            const factionArray = results.map(object => object.name)
            res.send({"results": factionArray});
        })
        .catch(err => {
            res.send(err);
        });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/client/build/index.html'));
});

app.listen(process.env.PORT);
console.log(`Server listening on port ${process.env.PORT}.`);