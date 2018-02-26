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

// Initialize table or column, if it doesn't exist.
db.sync();

// Export each database model as needed.
module.exports.User = User;