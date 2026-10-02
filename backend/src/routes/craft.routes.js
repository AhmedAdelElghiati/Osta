const express = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const craftController = require('../controllers/craft.controller');

const router = express.Router();

// Public list — used by home / new-request dropdown / craftsmen-guide filters
router.get('/', craftController.list);
// Admin-only creation
router.post('/', authenticate, authorize('admin'), craftController.create);

module.exports = router;
