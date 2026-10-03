const express = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const artisanController = require('../controllers/artisan.controller');
const { uploadImage, saveImage } = require('../middlewares/imageUpload');

const router = express.Router();

// Artisan updates own professional profile (must be before /:id)
router.patch('/me/profile', authenticate, authorize('artisan'), artisanController.updateMe);
router.get('/me/profile', authenticate, authorize('artisan'), artisanController.getMine);
router.post('/me/portfolio-image', authenticate, authorize('artisan'), uploadImage, saveImage);
// Public discovery — craftsmen-guide page
router.get('/', artisanController.list);
router.get('/:id', artisanController.getById);

module.exports = router;
