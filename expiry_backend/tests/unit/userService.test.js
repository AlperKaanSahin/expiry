jest.mock('../../models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  RefreshToken: {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'fake-jwt-token'),
  verify: jest.fn(),
}));

jest.mock('../../services/emailService', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
}));

const { User, RefreshToken } = require('../../models');
const jwt = require('jsonwebtoken');
const userService = require('../../services/userService');

describe('userService.login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('doğru email/şifre ile access ve refresh token döner', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      role: 'user',
      validPassword: jest.fn().mockReturnValue(true),
      toJSON: jest.fn().mockReturnValue({ id: 1, email: 'test@example.com', password: 'hashed' }),
    };
    User.findOne.mockResolvedValue(mockUser);
    RefreshToken.create.mockResolvedValue({});

    const result = await userService.login('test@example.com', 'correct-password');

    expect(result.accessToken).toBe('fake-jwt-token');
    expect(result.refreshToken).toBe('fake-jwt-token');
    expect(result.user.password).toBeUndefined();
  });

  it('kullanıcı bulunamazsa AppError(401) fırlatır', async () => {
    User.findOne.mockResolvedValue(null);
    await expect(userService.login('yok@example.com', 'sifre')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('şifre yanlışsa AppError(401) fırlatır', async () => {
    const mockUser = { validPassword: jest.fn().mockReturnValue(false) };
    User.findOne.mockResolvedValue(mockUser);
    await expect(userService.login('test@example.com', 'yanlis-sifre')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('kullanıcı bulunsa bile hata mesajı aynıdır (email enumeration koruması)', async () => {
    User.findOne.mockResolvedValue(null);
    let errorWhenNotFound;
    try {
      await userService.login('yok@example.com', 'sifre');
    } catch (err) {
      errorWhenNotFound = err.message;
    }

    const mockUser = { validPassword: jest.fn().mockReturnValue(false) };
    User.findOne.mockResolvedValue(mockUser);
    let errorWhenWrongPassword;
    try {
      await userService.login('test@example.com', 'yanlis-sifre');
    } catch (err) {
      errorWhenWrongPassword = err.message;
    }

    expect(errorWhenNotFound).toBe(errorWhenWrongPassword);
  });
});

describe('userService.register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('email zaten kayıtlıysa AppError(409) fırlatır', async () => {
    User.findOne.mockResolvedValue({ id: 1, email: 'var@example.com' });

    await expect(
      userService.register({ email: 'var@example.com', password: '123456', firstName: 'A', lastName: 'B' })
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(User.create).not.toHaveBeenCalled();
  });

  it('yeni email ile kullanıcı oluşturur, şifreyi response\'tan çıkarır', async () => {
    User.findOne.mockResolvedValue(null);
    const mockUser = {
      id: 2,
      email: 'yeni@example.com',
      firstName: 'Yeni',
      toJSON: jest.fn().mockReturnValue({ id: 2, email: 'yeni@example.com', password: 'hashed' }),
    };
    User.create.mockResolvedValue(mockUser);
    RefreshToken.create.mockResolvedValue({});

    const result = await userService.register({
      email: 'yeni@example.com',
      password: '123456',
      firstName: 'Yeni',
      lastName: 'Kullanıcı',
    });

    expect(result.user.password).toBeUndefined();
    expect(result.accessToken).toBe('fake-jwt-token');
  });
});

describe('userService.refreshAccessToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_REFRESH_SECRET = 'test-secret';
  });

  it('refresh token verilmezse AppError(400) fırlatır', async () => {
    await expect(userService.refreshAccessToken(null)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('jwt.verify hata fırlatırsa AppError(401) fırlatır', async () => {
    jwt.verify.mockImplementation(() => { throw new Error('invalid signature'); });

    await expect(userService.refreshAccessToken('gecersiz-token')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('token DB\'de yoksa ya da iptal edilmişse AppError(401) fırlatır', async () => {
    jwt.verify.mockReturnValue({ id: 1 });
    RefreshToken.findOne.mockResolvedValue({ revoked: true, expiresAt: new Date(Date.now() + 10000) });

    await expect(userService.refreshAccessToken('iptal-edilmis-token')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('token süresi dolmuşsa AppError(401) fırlatır', async () => {
    jwt.verify.mockReturnValue({ id: 1 });
    RefreshToken.findOne.mockResolvedValue({ revoked: false, expiresAt: new Date(Date.now() - 10000) });

    await expect(userService.refreshAccessToken('suresi-dolmus-token')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('her şey geçerliyse yeni access token döner', async () => {
    jwt.verify.mockReturnValue({ id: 1 });
    RefreshToken.findOne.mockResolvedValue({ revoked: false, expiresAt: new Date(Date.now() + 10000) });
    User.findByPk.mockResolvedValue({ id: 1, role: 'user' });

    const result = await userService.refreshAccessToken('gecerli-token');

    expect(result.accessToken).toBe('fake-jwt-token');
  });
});

describe('userService.changePassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('kullanıcı bulunamazsa AppError(404) fırlatır', async () => {
    User.findByPk.mockResolvedValue(null);

    await expect(userService.changePassword(1, 'eski', 'yeni')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('mevcut şifre yanlışsa AppError(401) fırlatır', async () => {
    const mockUser = { validPassword: jest.fn().mockReturnValue(false) };
    User.findByPk.mockResolvedValue(mockUser);

    await expect(userService.changePassword(1, 'yanlis-sifre', 'yeni')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('şifre değişince tüm refresh token\'ları iptal eder (revokeAllUserTokens çağrılır)', async () => {
    const mockUser = { validPassword: jest.fn().mockReturnValue(true), save: jest.fn().mockResolvedValue(true) };
    User.findByPk.mockResolvedValue(mockUser);
    RefreshToken.update.mockResolvedValue([1]);

    await userService.changePassword(1, 'dogru-sifre', 'yeni-sifre');

    expect(mockUser.save).toHaveBeenCalled();
    expect(RefreshToken.update).toHaveBeenCalledWith(
      { revoked: true },
      { where: { userId: 1 } }
    );
  });
});