const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const name = (file.originalname || '').toLowerCase();
    const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
    const hasAllowedExt = allowedExt.some(ext => name.endsWith(ext));
    const isImageMime = file.mimetype && file.mimetype.startsWith('image/');

    if (isImageMime || hasAllowedExt) {
        return cb(null, true);
    }
    return cb(new Error('Only image files are allowed'));
};

const dailyLogUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 8 * 1024 * 1024 }
}).single('image');

module.exports = { dailyLogUpload };
