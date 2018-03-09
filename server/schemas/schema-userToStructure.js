const Sequelize = require('sequelize');

const userToStructureSchema = {
    characterID: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    structureID: {
        type: Sequelize.BIGINT,
        allowNull: false
    }
};

module.exports = userToStructureSchema;