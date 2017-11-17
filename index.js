const express = require('express');
const path = require('path');
const app = express();
const helmet = require('helmet');
const axios = require('axios');
const passport = require('passport');
const session = require('express-session');
const redis = require('redis');
const redisStore = require('connect-redis')(session);

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const redisClientObject = {};
if (process.env.REDIS_URL) {
    redisClientObject.url = process.env.REDIS_URL
} else {
    redisClientObject.host = process.env.REDIS_HOST;
    redisClientObject.port = process.env.REDIS_PORT;
    if (process.env.REDIS_PASSWORD) {
        redisClientObject.password = process.env.REDIS_PASSWORD
    }
}

const redisClient = redis.createClient(redisClientObject);

const sessionObject = {
    secret: process.env.SESSION_SECRET,
    name: process.env.COOKIE_NAME,
    store: new redisStore({client: redisClient}),
    saveUninitialized: false,
    resave: false,
    cookie: {
        httpOnly: true,
        maxAge: (24 * 60 * 60 * 1000)
    }
};

if (process.env.NODE_ENV == 'production') {
    app.set('trust proxy', 1);
    sessionObject.proxy = true;
    sessionObject.cookie.secure = true
} else if (process.env.NODE_ENV == 'development') {
    // Not sure if we need this. Create-React-App dev server
    // does set up a proxy, but it's not clear whether it impacts
    // Express.
    app.set('trust proxy', 1);
    sessionObject.proxy = true
}
// Otherwise, if process.env.NODE_ENV == 'staging', we do nothing.

app.use(helmet());
app.use(session(sessionObject));
app.use(passport.initialize());
app.use(passport.session());

/** ---------- ROUTES ---------- **/
const auth = require('./server/routes/route-auth');
app.use('/auth', auth);

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