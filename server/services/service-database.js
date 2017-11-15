/* Contains all database models. All models go through this
one file so that all database methods only need to go through
one sequelize instance ("db"). */

const db = require('../modules/module-sequelize');

const userSchema = require('../schemas/schema-user');
const mapRegionSchema = require('../schemas/schema-mapRegion');
const mapSolarSystemSchema = require('../schemas/schema-mapSolarSystem');

const User = db.define('user', userSchema);
const mapRegion = db.define('mapRegion', mapRegionSchema, {timestamps: false});
const mapSolarSystem = db.define('mapSolarSystem', mapSolarSystemSchema, {timestamps: false});

db.sync();

module.exports.User = User;