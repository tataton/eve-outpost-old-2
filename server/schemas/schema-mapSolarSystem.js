const Sequelize = require('sequelize');

const mapSolarSystemSchema = {
    solarSystemID: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    constellationID: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    regionID: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    solarSystemName: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    security: {
        type: Sequelize.INTEGER
    }
};

module.exports = mapSolarSystemSchema;