const express = require('express');
const { authenticate } = require('../middlewares/authenticate');
const userController = require('../controllers/user.controller');

const router = express.Router();

router.use(authenticate);
router.patch('/me', userController.updateMe);
router.delete('/me', userController.deleteMe);

module.exports = router;
