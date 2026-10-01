const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const uploadDirectory = path.join(__dirname, '..', '..', 'uploads', 'requests');

const saveImage = async (file) => {
  await fs.mkdir(uploadDirectory, { recursive: true });
  const extension = path.extname(file.originalname).toLowerCase();
  const filename = `${crypto.randomUUID()}${extension}`;
  await fs.writeFile(path.join(uploadDirectory, filename), file.buffer);
  return { url: `/uploads/requests/${filename}`, publicId: filename };
};

const removeImage = async (publicId) => {
  if (!publicId) return;
  await fs.rm(path.join(uploadDirectory, path.basename(publicId)), { force: true });
};

module.exports = { saveImage, removeImage };
