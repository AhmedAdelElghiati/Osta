const express = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const artisanController = require('../controllers/artisan.controller');

const router = express.Router();

// Artisan updates own professional profile (must be before /:id)
router.patch('/me/profile', authenticate, authorize('artisan'), artisanController.updateMe);
// Public discovery — craftsmen-guide page
router.get('/', artisanController.list);
router.get('/:id', artisanController.getById);

module.exports = router;
