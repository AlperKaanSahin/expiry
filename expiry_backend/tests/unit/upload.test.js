const { validateImageSignature } = require('../../middlewares/upload');

describe('validateImageSignature middleware', () => {
  it('req.file yoksa (dosya opsiyonelse) direkt next() çağırır', () => {
    const next = jest.fn();

    validateImageSignature({}, {}, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('gerçek içerik geçerli bir JPEG ise req.file üzerine doğrulanmış mimetype/ext ekler ve next() çağırır', () => {
    const req = { file: { buffer: Buffer.from([0xff, 0xd8, 0xff, 0x00]) } };
    const next = jest.fn();

    validateImageSignature(req, {}, next);

    expect(req.file.verifiedMimetype).toBe('image/jpeg');
    expect(req.file.verifiedExt).toBe('.jpg');
    expect(next).toHaveBeenCalledWith();
  });

  it('istemci "image/jpeg" dese bile gerçek içerik script/HTML ise 400 AppError ile reddeder', () => {
    const req = { file: { buffer: Buffer.from('<script>alert(1)</script>', 'utf-8') } };
    const next = jest.fn();

    validateImageSignature(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    expect(req.file.verifiedMimetype).toBeUndefined();
  });
});