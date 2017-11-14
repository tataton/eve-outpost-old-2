const Sequelize = require('sequelize');

const userSchema = {
    characterID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true
    },
    characterOwnerHash: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    characterName:{
        type: Sequelize.STRING,
        allowNull: false
    },
    apiAccess: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    accessToken: {
        type: Sequelize.STRING,
        allowNull: false
    },
    accessExpires: {
        type: Sequelize.DATE,
        allowNull: false,
        validate: {isDate: true}
    },
    refreshToken: {
        type: Sequelize.STRING,
        allowNull: true
    }
};

module.exports = userSchema;