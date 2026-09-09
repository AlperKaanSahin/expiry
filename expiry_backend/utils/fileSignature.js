// Bilinen görsel formatlarının magic byte (dosya imzası) tanımları.
//
// İstemcinin form-data ile gönderdiği Content-Type/mimetype alanı tamamen
// istemci tarafından belirlenir ve kolayca sahtelenebilir — biri
// "evil.html" içeriğinde bir dosyayı "image/jpeg" diyerek yükleyebilir.
// Bu yüzden gerçek güvenlik kontrolü, dosyanın ilk byte'larına (gerçek
// içeriğine) bakılarak burada yapılır.
const SIGNATURES = [
  {
    mimetype: 'image/jpeg',
    ext: '.jpg',
    check: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  },
  {
    mimetype: 'image/png',
    ext: '.png',
    check: (buf) =>
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a,
  },
  {
    mimetype: 'image/webp',
    ext: '.webp',
    check: (buf) =>
      buf.length >= 12 &&
      buf.slice(0, 4).toString('ascii') === 'RIFF' &&
      buf.slice(8, 12).toString('ascii') === 'WEBP',
  },
];

/**
 * Buffer'ın gerçek içeriğine bakarak desteklenen görsel tiplerinden birine
 * uyup uymadığını kontrol eder.
 * @param {Buffer} buffer
 * @returns {{mimetype: string, ext: string} | null} Eşleşme varsa gerçek
 *   mimetype/uzantı, yoksa null.
 */
function detectImageSignature(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;

  for (const sig of SIGNATURES) {
    if (sig.check(buffer)) {
      return { mimetype: sig.mimetype, ext: sig.ext };
    }
  }
  return null;
}

module.exports = { detectImageSignature };