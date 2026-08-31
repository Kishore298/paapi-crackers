const multer = require('multer');

// Use memory storage - files stored in buffer, then uploaded to cloud
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else if (file.mimetype.includes('spreadsheetml') || file.mimetype.includes('excel') || file.mimetype.includes('csv') || file.originalname.match(/\.(xlsx|xls|csv)$/)) {
    cb(null, true);
  } else {
    cb(new Error('Only image and excel files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

module.exports = upload;
