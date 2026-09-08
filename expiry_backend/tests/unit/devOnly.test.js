const devOnly = require('../../middlewares/devOnly');

describe('devOnly middleware', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('production ortamında 403 ile bloklar (next\'e AppError geçirir)', () => {
    process.env.NODE_ENV = 'production';
    const next = jest.fn();

    devOnly({}, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 })
    );
  });

  it('test ortamında engellemeden geçirir', () => {
    process.env.NODE_ENV = 'test';
    const next = jest.fn();

    devOnly({}, {}, next);

    expect(next).toHaveBeenCalledWith(); // argümansız çağrı = devam et
  });

  it('development ortamında engellemeden geçirir', () => {
    process.env.NODE_ENV = 'development';
    const next = jest.fn();

    devOnly({}, {}, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('NODE_ENV tanımsızsa (staging vb. beklenmeyen ortam) güvenli tarafta kalıp bloklar', () => {
    delete process.env.NODE_ENV;
    const next = jest.fn();

    devOnly({}, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 })
    );
  });
});