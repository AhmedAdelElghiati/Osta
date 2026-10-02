const express = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const walletController = require('../controllers/wallet.controller');

const router = express.Router();

router.use(authenticate, authorize('customer', 'artisan'));
router.get('/', walletController.summary);
router.post('/deposit', walletController.deposit);
router.post('/withdraw', walletController.withdraw);

module.exports = router;
