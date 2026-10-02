const express = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const reviewController = require('../controllers/review.controller');

const router = express.Router();

// Customer submits a rating for one of their requests
router.post('/requests/:id/review', authenticate, authorize('customer'), reviewController.createForRequest);
// Public artisan reviews
router.get('/artisans/:id/reviews', reviewController.listForArtisan);

module.exports = router;
