const redisURLparse = (URLstring) => {
    const parsedArray = URLstring.match(/[A-Za-z0-9.-]+/g);
    return {
        host: parsedArray[3],
        port: parseInt(parsedArray[4], 10),
        pass: parsedArray[2]
    }
};

module.exports = redisURLparse;




