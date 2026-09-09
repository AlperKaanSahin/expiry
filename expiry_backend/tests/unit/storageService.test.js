jest.mock('fs', () => ({
  promises: {
    access: jest.fn().mockResolvedValue(true),
    mkdir: jest.fn().mockResolvedValue(true),
    writeFile: jest.fn().mockResolvedValue(true),
    unlink: jest.fn().mockResolvedValue(true),
  },
}));

const fs = require('fs').promises;
const storageService = require('../../services/storageService');

describe('storageService.uploadFile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('bilinen bir mimetype için doğru uzantıyla dosya adı üretir ve diske yazar', async () => {
    const buffer = Buffer.from('fake-image-bytes');

    const url = await storageService.uploadFile(buffer, 'image/png');

    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    const [writtenPath, writtenBuffer] = fs.writeFile.mock.calls[0];
    expect(writtenPath).toMatch(/\.png$/);
    expect(writtenBuffer).toBe(buffer);
    expect(url).toMatch(/\.png$/);
  });

  it('desteklenmeyen/bilinmeyen bir mimetype için hata fırlatır ve diske hiçbir şey yazmaz (fail-closed)', async () => {
    const buffer = Buffer.from('data');

    await expect(storageService.uploadFile(buffer, 'text/html')).rejects.toThrow();
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('her çağrıda benzersiz bir dosya adı üretir (UUID tabanlı)', async () => {
    const buffer = Buffer.from('data');

    const url1 = await storageService.uploadFile(buffer, 'image/jpeg');
    const url2 = await storageService.uploadFile(buffer, 'image/jpeg');

    expect(url1).not.toBe(url2);
  });
});