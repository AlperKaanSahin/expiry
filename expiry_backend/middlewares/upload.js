const multer = require('multer');

const storage = multer.memoryStorage(); // dosyayı bellekte tut, storageService diske yazacak

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sadece JPEG, PNG veya WEBP formatında görsel yükleyebilirsiniz'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB sınır
});

module.exports = upload;