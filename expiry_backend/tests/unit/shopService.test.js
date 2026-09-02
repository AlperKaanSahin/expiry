jest.mock('../../models', () => ({
  Shop: { findOne: jest.fn(), findByPk: jest.fn() },
  User: { findOne: jest.fn() },
  Order: { findOne: jest.fn() },
  ShopRating: { findOne: jest.fn(), create: jest.fn() },
}));

jest.mock('../../services/notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../services/iyzicoService', () => ({
  createOrUpdateSubMerchant: jest.fn(),
}));
jest.mock('../../events/eventBus', () => ({ emit: jest.fn() }));

const { Shop, User, Order, ShopRating } = require('../../models');
const iyzicoService = require('../../services/iyzicoService');
const shopService = require('../../services/shopService');
const eventBus = require('../../events/eventBus');

describe('shopService.applyShop', () => {
  beforeEach(() => jest.clearAllMocks());

  it('eksik bilgi ile başvurulursa AppError(400) fırlatır', async () => {
    await expect(shopService.applyShop(42, { name: '', address: '', phone: '' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it('ilk başvuruda shop oluşturur ve SHOP_CREATED audit event yayınlar', async () => {
    Shop.findOne.mockResolvedValue(null);
    Shop.create = jest.fn().mockResolvedValue({ id: 1, name: 'Yeni Market', address: 'Adres', phone: '000' });
    User.findOne.mockResolvedValue({ id: 99 }); // admin

    await shopService.applyShop(42, { name: 'Yeni Market', address: 'Adres', phone: '000', category: 'MARKET' });

    expect(Shop.create).toHaveBeenCalled();
    expect(eventBus.emit).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ actorId: 42, shop: expect.objectContaining({ id: 1 }) })
    );
  });

  it('aktif shopu olan kullanıcı tekrar başvuramaz (AppError 409)', async () => {
    Shop.findOne.mockResolvedValue({ status: 'active' });

    await expect(
      shopService.applyShop(42, { name: 'X', address: 'Y', phone: 'Z', category: 'MARKET' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('reddedilmiş shop sahibi tekrar başvurunca reapplied: true ile audit event yayınlar', async () => {
    const mockShop = {
      id: 1, status: 'rejected', name: 'Eski', address: 'Eski', phone: '000',
      save: jest.fn().mockResolvedValue(true),
    };
    Shop.findOne.mockResolvedValue(mockShop);
    User.findOne.mockResolvedValue({ id: 99 });

    await shopService.applyShop(42, { name: 'Yeni İsim', address: 'Yeni Adres', phone: '111', category: 'MARKET' });

    expect(mockShop.status).toBe('pending');
    expect(eventBus.emit).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ reapplied: true })
    );
  });
});

describe('shopService.getMyShopProfile — ownership', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sadece kendi ownerId\'sine ait shop\'u sorgular', async () => {
    Shop.findOne.mockResolvedValue({ id: 5, ownerId: 42, name: 'Test Market' });

    await shopService.getMyShopProfile(42);

    expect(Shop.findOne).toHaveBeenCalledWith({ where: { ownerId: 42 } });
  });

  it('shop bulunamazsa null döner (başka birinin shop\'una sızmaz)', async () => {
    Shop.findOne.mockResolvedValue(null);

    const result = await shopService.getMyShopProfile(999);

    expect(result).toBeNull();
  });
});

describe('shopService.updateShopProfile — ownership', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shop bulunamazsa AppError(404) fırlatır, güncelleme denemez', async () => {
    Shop.findOne.mockResolvedValue(null);

    await expect(
      shopService.updateShopProfile(999, { name: 'Hacklenmiş İsim' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('sadece userId ile eşleşen shop\'u günceller', async () => {
    const mockShop = { name: 'Eski İsim', address: 'Eski Adres', phone: '000', save: jest.fn().mockResolvedValue(true) };
    Shop.findOne.mockResolvedValue(mockShop);

    await shopService.updateShopProfile(42, { name: 'Yeni İsim', address: 'Yeni Adres', phone: '111' });

    expect(Shop.findOne).toHaveBeenCalledWith({ where: { ownerId: 42 } });
    expect(mockShop.name).toBe('Yeni İsim');
    expect(mockShop.save).toHaveBeenCalled();
  });
});

describe('shopService.updatePaymentSettings — ownership ve iş kuralları', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shop bulunamazsa AppError(404) fırlatır', async () => {
    Shop.findOne.mockResolvedValue(null);

    await expect(
      shopService.updatePaymentSettings(999, { subMerchantType: 'PERSONAL', iban: 'TR..', email: 'a@b.com', identityNumber: '123' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('shop onaylı değilse (status !== active) AppError(403) fırlatır', async () => {
    Shop.findOne.mockResolvedValue({ id: 1, status: 'pending', owner: {} });

    await expect(
      shopService.updatePaymentSettings(42, { subMerchantType: 'PERSONAL', iban: 'TR..', email: 'a@b.com', identityNumber: '123' })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('PERSONAL tipte identityNumber eksikse AppError(400) fırlatır', async () => {
    Shop.findOne.mockResolvedValue({ id: 1, status: 'active', owner: { firstName: 'A', lastName: 'B' } });

    await expect(
      shopService.updatePaymentSettings(42, { subMerchantType: 'PERSONAL', iban: 'TR..', email: 'a@b.com' })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(iyzicoService.createOrUpdateSubMerchant).not.toHaveBeenCalled();
  });

  it('LIMITED_OR_JOINT_STOCK_COMPANY tipte vergi bilgileri eksikse AppError(400) fırlatır', async () => {
    Shop.findOne.mockResolvedValue({ id: 1, status: 'active', owner: {} });

    await expect(
      shopService.updatePaymentSettings(42, { subMerchantType: 'LIMITED_OR_JOINT_STOCK_COMPANY', iban: 'TR..', email: 'a@b.com' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('Iyzico başarısız dönerse subMerchantStatus=failed olur ve AppError(502) fırlatır', async () => {
    const mockShop = {
      id: 1, status: 'active', owner: { firstName: 'A', lastName: 'B' },
      save: jest.fn().mockResolvedValue(true),
    };
    Shop.findOne.mockResolvedValue(mockShop);
    iyzicoService.createOrUpdateSubMerchant.mockResolvedValue({ status: 'failure', errorMessage: 'IBAN hatalı' });

    await expect(
      shopService.updatePaymentSettings(42, { subMerchantType: 'PERSONAL', iban: 'TR..', email: 'a@b.com', identityNumber: '123' })
    ).rejects.toMatchObject({ statusCode: 502 });

    expect(mockShop.subMerchantStatus).toBe('failed');
    expect(mockShop.save).toHaveBeenCalled();
  });

  it('Iyzico başarılı dönerse subMerchantStatus=active olur ve subMerchantKey kaydedilir', async () => {
    const mockShop = {
      id: 1, status: 'active', owner: { firstName: 'A', lastName: 'B' },
      save: jest.fn().mockResolvedValue(true),
    };
    Shop.findOne.mockResolvedValue(mockShop);
    iyzicoService.createOrUpdateSubMerchant.mockResolvedValue({ status: 'success', subMerchantKey: 'key-123' });

    const result = await shopService.updatePaymentSettings(42, {
      subMerchantType: 'PERSONAL', iban: 'TR..', email: 'a@b.com', identityNumber: '123',
    });

    expect(result.subMerchantStatus).toBe('active');
    expect(mockShop.subMerchantKey).toBe('key-123');
  });
});

describe('shopService.rateShop — iş kuralları', () => {
  beforeEach(() => jest.clearAllMocks());

  it('geçersiz puan (0 veya >5) AppError(400) fırlatır', async () => {
    await expect(shopService.rateShop(1, 2, 0, 3)).rejects.toMatchObject({ statusCode: 400 });
    await expect(shopService.rateShop(1, 2, 6, 3)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('shop bulunamazsa AppError(404) fırlatır', async () => {
    Shop.findByPk.mockResolvedValue(null);

    await expect(shopService.rateShop(1, 999, 5, 3)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('kullanıcının bu shop için tamamlanmış siparişi yoksa AppError(404) fırlatır', async () => {
    Shop.findByPk.mockResolvedValue({ id: 2, ratingCount: 0, ratingAverage: 0 });
    Order.findOne.mockResolvedValue(null);

    await expect(shopService.rateShop(1, 2, 5, 3)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('aynı sipariş için tekrar puan verilmeye çalışılırsa AppError(409) fırlatır', async () => {
    Shop.findByPk.mockResolvedValue({ id: 2, ratingCount: 0, ratingAverage: 0 });
    Order.findOne.mockResolvedValue({ id: 3 });
    ShopRating.findOne.mockResolvedValue({ id: 10 }); // zaten var

    await expect(shopService.rateShop(1, 2, 5, 3)).rejects.toMatchObject({ statusCode: 409 });
  });

it('geçerli puan verilince ratingAverage doğru hesaplanır', async () => {
  const mockShop = {
    id: 2,
    ratingCount: 1,
    ratingAverage: 4,
    update: jest.fn(function (values) {
      Object.assign(this, values); // gerçek Sequelize gibi instance'ı da güncelle
      return Promise.resolve(this);
    }),
  };
  Shop.findByPk.mockResolvedValue(mockShop);
  Order.findOne.mockResolvedValue({ id: 3 });
  ShopRating.findOne.mockResolvedValue(null);
  ShopRating.create.mockResolvedValue({});

  const result = await shopService.rateShop(1, 2, 5, 3);

  expect(result.ratingAverage).toBe(4.5);
  expect(mockShop.update).toHaveBeenCalledWith({ ratingCount: 2, ratingAverage: 4.5 });
});
});