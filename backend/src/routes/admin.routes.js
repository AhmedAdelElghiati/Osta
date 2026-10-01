const express = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

const router = express.Router();

router.get('/test', authenticate, authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin route access granted',
    data: { role: req.user.role },
  });
});

module.exports = router;
