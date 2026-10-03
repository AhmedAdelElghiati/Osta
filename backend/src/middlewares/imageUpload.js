const multer = require('multer');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { sendResponse } = require('../utils/apiResponse');
const User = require('../models/User');

const uploadDirectory = path.resolve(__dirname, '../../uploads');
const uploadImage = multer({ storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: 5 * 1024 * 1024 } }).single('image');

const saveImage = async (req, res, next) => {
  try {
    const bytes = req.file?.buffer;
    let extension;
    if (bytes?.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) extension = 'jpg';
    else if (bytes?.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) extension = 'png';
    else if (bytes?.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') extension = 'webp';
    if (!extension) return sendResponse(res, 400, false, 'اختار صورة JPG أو PNG أو WebP صحيحة.');
    await fs.mkdir(uploadDirectory, { recursive: true });
    const filename = `${crypto.randomUUID()}.${extension}`;
    await fs.writeFile(path.join(uploadDirectory, filename), bytes);
    const url = `/uploads/${filename}`;
    if (req.baseUrl === '/api/users') await User.findByIdAndUpdate(req.user.id, { profileImage: url });
    return sendResponse(res, 201, true, 'تم رفع الصورة.', { url });
  } catch (error) { next(error); }
};

module.exports = { uploadImage, saveImage, uploadDirectory };
