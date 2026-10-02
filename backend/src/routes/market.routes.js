const express = require('express');
const marketController = require('../controllers/market.controller');

const router = express.Router();

// Public — jobs-market page + home stats
router.get('/', marketController.list);
router.get('/stats', marketController.stats);

module.exports = router;
