const express = require('express');
const { authenticate, } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const contactController = require('../controllers/contact.controller');

const router = express.Router();

// Public contact-us form; if logged in we attach userId when token present (optional)
router.post('/', (req, res, next) => {
  const hasToken = req.headers.authorization || req.cookies?.accessToken;
  if (!hasToken) return contactController.create(req, res, next);
  return authenticate(req, res, (err) => {
    if (err) return contactController.create(req, res, next);
    return contactController.create(req, res, next);
  });
});
router.get('/mine', authenticate, authorize('customer', 'artisan'), contactController.listMine);
router.post('/tickets', authenticate, authorize('customer', 'artisan'), contactController.createTicket);
router.post('/:id/replies', authenticate, authorize('customer', 'artisan', 'admin'), contactController.reply);

module.exports = router;
