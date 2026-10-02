const express = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const offerController = require('../controllers/offer.controller');

const router = express.Router();

router.use(authenticate);

// Customer views all offers across own requests (dashboard offers tab)
router.get('/mine', authorize('customer'), offerController.listMine);
// Artisan views own sent offers
router.get('/sent', authorize('artisan'), offerController.listSent);
// Artisan sends an offer on a published request
router.post('/', authorize('artisan'), offerController.create);
// Customer accepts / rejects a specific offer
router.post('/:id/accept', authorize('customer'), offerController.accept);
router.post('/:id/reject', authorize('customer'), offerController.reject);
// Artisan withdraws own pending offer
router.post('/:id/withdraw', authorize('artisan'), offerController.withdraw);

module.exports = router;
