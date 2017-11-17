const redisURLparse = (URLstring) => {
    const parsedArray = URLstring.match(/[A-Za-z0-9.-]+/g);
    return {
        host: parsedArray[4],
        port: parseInt(parsedArray[5], 10),
        pass: parsedArray[3]
    }
};

module.exports = redisURLparse;




