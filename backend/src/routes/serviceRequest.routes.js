const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const controller = require('../controllers/serviceRequest.controller');

const router = express.Router();
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error('نوع الصورة غير مسموح. استخدم JPG أو PNG أو WebP.');
      error.statusCode = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});
const customerOnly = [authenticate, authorize('customer')];

router.use(...customerOnly);
router.post('/', controller.create);
router.get('/me', controller.list);
router.get('/:id/timeline', controller.timeline);
router.post('/:id/schedule', controller.schedule);
router.post('/:id/publish', controller.publish);
router.post('/:id/cancel', controller.cancel);
router.post('/:id/republish', controller.republish);
router.post('/:id/images', upload.array('images', 10), controller.images);
router.delete('/:id/images/:imageId', controller.deleteImage);
router.get('/:id', controller.get);
router.patch('/:id', controller.update);

module.exports = router;
