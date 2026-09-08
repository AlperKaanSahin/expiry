const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const MIME_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

// Uygulama ilk açıldığında uploads klasörü yoksa oluştur
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}
ensureUploadDir();

exports.uploadFile = async (buffer, mimetype) => {
  const ext = MIME_EXTENSIONS[mimetype];

  // Bilinmeyen/whitelist dışı bir mimetype'la buraya hiç gelinmemeli —
  // çağıran taraf (validateImageSignature) bunu zaten filtrelemiş olmalı.
  // Yine de burada fail-closed davranıyoruz: originalName'den tahmin
  // etmek yerine, tanımadığımız bir tip için hata fırlatıp diske hiçbir
  // şey yazmıyoruz.
  if (!ext) {
    throw new Error(`Desteklenmeyen mimetype: ${mimetype}`);
  }

  const filename = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  await fs.writeFile(filePath, buffer);

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/uploads/${filename}`;
};

exports.deleteFile = async (fileUrl) => {
  if (!fileUrl) return;
  try {
    const filename = fileUrl.split('/uploads/')[1];
    if (!filename) return;
    await fs.unlink(path.join(UPLOAD_DIR, filename));
  } catch (err) {
    console.error('Dosya silinemedi:', err.message);
    // Dosya zaten yoksa ya da silinemezse sessizce devam et — kritik değil
  }
};