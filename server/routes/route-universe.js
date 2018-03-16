const express = require('express');
const router = express.Router();

router.get('/systems/:id', (req, res) => {
    
    if (req.isAuthenticated()) {

    } else {
        
    }
});

module.exports = router;