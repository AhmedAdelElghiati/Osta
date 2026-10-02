const express = require('express');
const { authenticate } = require('../middlewares/authenticate');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', notificationController.listMine);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
