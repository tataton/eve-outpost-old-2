const Sequelize = require('sequelize');
const sqlURLparse = require('../services/service-sqlurlparse');

const sqlizeObject = process.env.DATABASE_URL
    ? sqlURLparse(process.env.DATABASE_URL)
    :   {
            database: process.env.DB_NAME,
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            dialect: 'postgres',
            logging: false,
            operatorsAliases: false,
            dialectOptions: {
                ssl: true
            }
        };

const sequelize = new Sequelize(sqlizeObject);

module.exports = sequelize;