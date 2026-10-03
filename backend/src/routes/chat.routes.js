const express = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const chatController = require('../controllers/chat.controller');

const router = express.Router();

router.use(authenticate, authorize('customer', 'artisan'));
router.post('/direct', chatController.startDirect);
router.get('/direct', chatController.listDirect);
router.get('/jobs/:id/messages', chatController.listMessages);
router.post('/jobs/:id/messages', chatController.sendMessage);

module.exports = router;
