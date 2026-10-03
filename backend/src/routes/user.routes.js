const express = require('express');
const { authenticate } = require('../middlewares/authenticate');
const userController = require('../controllers/user.controller');
const { uploadImage, saveImage } = require('../middlewares/imageUpload');

const router = express.Router();

router.use(authenticate);
router.post('/me/image', uploadImage, saveImage);
router.get('/me/settings', userController.getSettings);
router.patch('/me/settings', userController.updateSettings);
router.patch('/me', userController.updateMe);
router.delete('/me', userController.deleteMe);

module.exports = router;
