const Sequelize = require('sequelize');

const sessionSchema = {
    sid: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    userId: Sequelize.STRING,
    expires: Sequelize.DATE,
    data: Sequelize.STRING(50000)
};

module.exports = sessionSchema;