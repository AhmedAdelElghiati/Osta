const express = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const jobController = require('../controllers/job.controller');

const router = express.Router();
const chat = require('../controllers/chat.controller');

router.use(authenticate, authorize('customer', 'artisan'));
router.get('/me', jobController.listMine);
router.get('/:id/messages', chat.list);
router.post('/:id/messages', chat.send);
router.get('/:id', jobController.getOne);
router.patch('/:id/status', jobController.updateStatus);

module.exports = router;
