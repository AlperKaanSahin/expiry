const { detectImageSignature } = require('../../utils/fileSignature');

describe('detectImageSignature', () => {
  it('geçerli bir JPEG imzasını (FF D8 FF) doğru tespit eder', () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(detectImageSignature(buf)).toEqual({ mimetype: 'image/jpeg', ext: '.jpg' });
  });

  it('geçerli bir PNG imzasını doğru tespit eder', () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    expect(detectImageSignature(buf)).toEqual({ mimetype: 'image/png', ext: '.png' });
  });

  it('geçerli bir WEBP imzasını doğru tespit eder', () => {
    const buf = Buffer.concat([
      Buffer.from('RIFF', 'ascii'),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from('WEBP', 'ascii'),
    ]);
    expect(detectImageSignature(buf)).toEqual({ mimetype: 'image/webp', ext: '.webp' });
  });

  it('sahte Content-Type ile gönderilmiş ama gerçek içeriği HTML/script olan dosyayı reddeder (stored XSS senaryosu)', () => {
    const htmlPayload = Buffer.from('<html><script>alert(1)</script></html>', 'utf-8');
    expect(detectImageSignature(htmlPayload)).toBeNull();
  });

  it('boş veya çok kısa buffer için null döner', () => {
    expect(detectImageSignature(Buffer.from([]))).toBeNull();
    expect(detectImageSignature(Buffer.from([0xff]))).toBeNull();
  });

  it('Buffer olmayan bir girdi için savunma amaçlı null döner', () => {
    expect(detectImageSignature('not-a-buffer')).toBeNull();
    expect(detectImageSignature(null)).toBeNull();
    expect(detectImageSignature(undefined)).toBeNull();
  });
});