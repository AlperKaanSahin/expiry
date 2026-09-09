const multer = require('multer');
const AppError = require('../utils/AppError');
const { detectImageSignature } = require('../utils/fileSignature');

const storage = multer.memoryStorage(); // dosyayı bellekte tut, storageService diske yazacak

const fileFilter = (req, file, cb) => {
  // NOT: Bu, istemcinin gönderdiği Content-Type header'ına bakan HIZLI ve
  // ERKEN bir ön filtredir — bu header istemci tarafından kolayca
  // sahtelenebilir, tek başına güvenlik kontrolü olarak yeterli DEĞİLDİR.
  // Asıl doğrulama, dosya tamamen belleğe alındıktan sonra
  // validateImageSignature middleware'inde gerçek byte içeriğine bakılarak
  // yapılır.
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

// upload.single(...)'dan HEMEN SONRA kullanılmalı — o noktada req.file.buffer
// tamamen dolu olur. Dosyanın gerçek içeriğini (magic bytes) doğrular; sahte
// Content-Type header'ıyla yüklenmiş .html/.svg/script içerikli dosyaları
// burada yakalar. Doğrulanmış gerçek mimetype/uzantıyı req.file üzerine
// ekler — storageService diske yazarken bu doğrulanmış değere güvenir,
// istemcinin gönderdiği orijinal dosya adına veya Content-Type'a değil.
const validateImageSignature = (req, res, next) => {
  if (!req.file) return next();

  const detected = detectImageSignature(req.file.buffer);
  if (!detected) {
    return next(new AppError(
      'Dosya içeriği desteklenen bir görsel formatına (JPEG, PNG, WEBP) uymuyor',
      400
    ));
  }

  req.file.verifiedMimetype = detected.mimetype;
  req.file.verifiedExt = detected.ext;
  next();
};

module.exports = { upload, validateImageSignature };