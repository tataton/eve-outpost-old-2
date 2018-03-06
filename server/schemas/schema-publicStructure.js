const Sequelize = require('sequelize');

const publicStructureSchema = {
    structureID: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    solarSystemID: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    constellationID: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    regionID: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    stationName: {
        type: Sequelize.STRING(100),
        allowNull: false
    }
};

module.exports = publicStructureSchema;