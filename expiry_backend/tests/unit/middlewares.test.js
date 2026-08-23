jest.mock('../../models', () => ({
  User: { findByPk: jest.fn() },
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const auth = require('../../middlewares/auth');
const isAdmin = require('../../middlewares/isAdmin');
const onlyMarket = require('../../middlewares/onlyMarket');

function mockReqRes(headers = {}) {
  return {
    req: { header: jest.fn((name) => headers[name]) },
    res: {},
    next: jest.fn(),
  };
}

describe('auth middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('Authorization header yoksa AppError(401) ile next çağrılır', async () => {
    const { req, res, next } = mockReqRes({});

    await auth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  it('token geçersizse AppError(401) ile next çağrılır, DB\'ye hiç gidilmez', async () => {
    const { req, res, next } = mockReqRes({ Authorization: 'Bearer gecersiz-token' });
    jwt.verify.mockImplementation(() => { throw new Error('invalid signature'); });

    await auth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    expect(User.findByPk).not.toHaveBeenCalled();
  });

  it('token geçerli ama kullanıcı DB\'de yoksa (silinmiş hesap) AppError(401) ile next çağrılır', async () => {
    const { req, res, next } = mockReqRes({ Authorization: 'Bearer gecerli-token' });
    jwt.verify.mockReturnValue({ id: 999, role: 'user' });
    User.findByPk.mockResolvedValue(null);

    await auth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('geçerli token ve mevcut kullanıcıyla req.user set edilir, next() hatasız çağrılır', async () => {
    const { req, res, next } = mockReqRes({ Authorization: 'Bearer gecerli-token' });
    jwt.verify.mockReturnValue({ id: 1, role: 'user' });
    User.findByPk.mockResolvedValue({ id: 1, email: 'a@b.com' });

    await auth(req, res, next);

    expect(req.user).toEqual({ id: 1, role: 'user' });
    expect(next).toHaveBeenCalledWith(); // argümansız çağrıldı, yani hata yok
  });

  it('"Bearer " prefix\'i olmadan gelen token da doğru parse edilir', async () => {
    const { req, res, next } = mockReqRes({ Authorization: 'sadece-token' });
    jwt.verify.mockReturnValue({ id: 1, role: 'user' });
    User.findByPk.mockResolvedValue({ id: 1 });

    await auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('sadece-token', process.env.JWT_SECRET);
  });
});

describe('isAdmin middleware', () => {
  it('req.user.role === "admin" ise next() hatasız çağrılır', () => {
    const req = { user: { role: 'admin' } };
    const next = jest.fn();

    isAdmin(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('req.user yoksa AppError(403) ile next çağrılır (çökmez)', () => {
    const req = {}; // req.user tanımsız
    const next = jest.fn();

    isAdmin(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('role admin değilse AppError(403) ile next çağrılır', () => {
    const req = { user: { role: 'user' } };
    const next = jest.fn();

    isAdmin(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});

describe('onlyMarket middleware', () => {
  it('req.user yoksa çökmeden AppError(403) ile next çağrılır', () => {
    const req = {};
    const next = jest.fn();

    onlyMarket(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('role market değilse AppError(403) ile next çağrılır', () => {
    const req = { user: { role: 'admin' } };
    const next = jest.fn();

    onlyMarket(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('role market ise next() hatasız çağrılır', () => {
    const req = { user: { role: 'market' } };
    const next = jest.fn();

    onlyMarket(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });
});