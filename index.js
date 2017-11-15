const express = require('express');
const path = require('path');
const app = express();
const helmet = require('helmet');
const axios = require('axios');
const passport = require('passport');
const session = require('express-session');
const redis = require('redis');
const redisClient = redis.createClient();
const redisStore = require('connect-redis')(session);

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const redisStoreObject = process.env.REDIS_URL
    ?   {
            url: process.env.REDIS_URL,
            client: redisClient,
            ttl: (24 * 60 * 60)  // 24 hours
        }
    :   {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT, 10),
            client: redisClient,
            ttl: (24 * 60 * 60)  // 24 hours
        };

const sessionObject = {
    secret: process.env.SESSION_SECRET,
    name: process.env.COOKIE_NAME,
    store: new redisStore(redisStoreObject),
    saveUninitialized: false,
    resave: false,
    unset: 'destroy',
    cookie: {
        httpOnly: true,
        maxAge: (24 * 60 * 60 * 1000)  // 24 hours
    }
};

if (process.env.NODE_ENV == 'production') {
    app.set('trust proxy', 1);
    sessionObject.proxy = true,
    sessionObject.cookie.secure = true
}

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