/* Contains all database models. All models go through this
one file so that all database methods only need to go through
one sequelize instance ("db"). */

const session = require('express-session');
const db = require('../modules/module-sequelize');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const userSchema = require('../schemas/schema-user');
const sessionSchema = require('../schemas/schema-session');
const mapRegionSchema = require('../schemas/schema-mapRegion');
const mapSolarSystemSchema = require('../schemas/schema-mapSolarSystem');

const User = db.define('user', userSchema);
const Session = db.define('session', sessionSchema);
const mapRegion = db.define('mapRegion', mapRegionSchema, {timestamps: false});
const mapSolarSystem = db.define('mapSolarSystem', mapSolarSystemSchema, {timestamps: false});

db.sync();

const SessionStore = new SequelizeStore({
    db,
    table: 'session'
});

module.exports.User = User;
module.exports.SessionStore = SessionStore;