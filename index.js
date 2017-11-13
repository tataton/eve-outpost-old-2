const express = require('express');
const path = require('path');
const app = express();
const axios = require('axios');

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

app.get('/api/factions', (req, res) => {
    axios('https://esi.tech.ccp.is/latest/universe/factions')
        .then(response => response.data)
        .then(results => {
            const factionArray = results.map(object => object.name)
            res.send({"results": factionArray});
        })
        .catch(err => {
            res.send(err);
        });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/client/build/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT);

console.log(`Server listening on ${PORT}`);