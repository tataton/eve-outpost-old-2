const sqlURLparse = (URLstring) => {
    const parsedArray = URLstring.match(/[A-Za-z0-9.-]+/g);
    return {
        database: parsedArray[5],
        username: parsedArray[1],
        password: parsedArray[2],
        host: parsedArray[3],
        port: parseInt(parsedArray[4], 10),
        dialect: parsedArray[0],
        logging: false,
        operatorsAliases: false,
        dialectOptions: {
            ssl: true
        }
    }
};

module.exports = sqlURLparse;