const express = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const jobController = require('../controllers/job.controller');

const router = express.Router();

router.use(authenticate, authorize('customer', 'artisan'));
router.get('/me', jobController.listMine);
router.post('/:id/dispute', authorize('customer'), require('../controllers/dispute.controller').open);
router.get('/:id', jobController.getOne);
router.patch('/:id/status', jobController.updateStatus);

module.exports = router;
