const express = require('express');
const path = require('path');
const app = express();
const helmet = require('helmet');
const passport = require('passport');
const session = require('express-session');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const sessionConfig = require('./server/config/config-session');

if ((process.env.NODE_ENV == 'production') ||
    (process.env.NODE_ENV == 'development')) {
    app.set('trust proxy', 1);
}
// Otherwise, process.env.NODE_ENV == 'staging', so no proxy used.

app.use(helmet());
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

/** ---------- ROUTES ---------- **/
const auth = require('./server/routes/route-auth');
app.use('/auth', auth);
const popup = require('./server/routes/route-popup');
app.use('/popup', popup);
/*
const market = require('./server/routes/route-market');
app.use('/market', market);
*/

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

/* May need to add query flag to below, in order to allow query
routes to reach React Router and not get caught by '*'. */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/client/build/index.html'));
});

// The "catchall" handler: for any initial request that doesn't
// match one above, send back to home route.
app.get('*', (req, res) => {
    res.redirect('/');
});

app.listen(process.env.PORT);
console.log(`Server listening on port ${process.env.PORT}.`);

//** ------ SCHEDULED PROCESSES ------ **/

const reloadPublicStructures = require('./server/services/service-reloadpublicstructures');
// reloadPublicStructures();
// let timerId = setInterval(reloadPublicStructures, 86400000);
const reloadPrivateStructures = require('./server/services/service-reloadprivatestructures');
reloadPrivateStructures();