jest.mock('../../models', () => ({
  Order: { findOne: jest.fn(), create: jest.fn() },
  OrderPackage: { findAll: jest.fn(), create: jest.fn() },
  PackageUnit: { findAll: jest.fn(), count: jest.fn() },
  Package: { update: jest.fn(), findOne: jest.fn() },
  PackageProduct: { findAll: jest.fn() },
  ShopProduct: {},
  Shop: { findOne: jest.fn() },
  User: {},
  sequelize: { transaction: jest.fn() },
}));

jest.mock('../../events/eventBus', () => ({ emit: jest.fn() }));

const {
  Order, OrderPackage, PackageUnit, Package, PackageProduct, Shop, sequelize,
} = require('../../models');
const eventBus = require('../../events/eventBus');
const ORDER_EVENTS = require('../../events/order.events');
const {
  reserveStock, createOrder, confirmByQRCode, changeStatus, assertPackageProductsNotExpired,
} = require('../../services/orderService');
const AppError = require('../../utils/AppError');

function mockTransaction() {
  const t = {
    LOCK: { UPDATE: 'UPDATE' },
    commit: jest.fn().mockResolvedValue(true),
    rollback: jest.fn().mockResolvedValue(true),
  };
  sequelize.transaction.mockResolvedValue(t);
  return t;
}

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

describe('reserveStock', () => {
  const fakeTransaction = { LOCK: { UPDATE: 'UPDATE' } };
  const fakeOrder = { id: 1 };

  beforeEach(() => jest.clearAllMocks());

  it('stok yeterliyse üniteleri isSold=true yapıp Package.quantity günceller', async () => {
    OrderPackage.findAll.mockResolvedValue([{ packageId: 10, quantity: 2 }]);
    const mockUnit1 = { id: 100, isSold: false, save: jest.fn().mockResolvedValue(true) };
    const mockUnit2 = { id: 101, isSold: false, save: jest.fn().mockResolvedValue(true) };
    PackageUnit.findAll.mockResolvedValue([mockUnit1, mockUnit2]);
    PackageUnit.count.mockResolvedValue(5);

    await reserveStock(fakeOrder, fakeTransaction);

    expect(mockUnit1.isSold).toBe(true);
    expect(Package.update).toHaveBeenCalledWith(
      { quantity: 5 },
      { where: { id: 10 }, transaction: fakeTransaction }
    );
  });

  it('stok yetersizse AppError(409) fırlatır ve hiçbir üniteyi güncellemez', async () => {
    OrderPackage.findAll.mockResolvedValue([{ packageId: 10, quantity: 3 }]);
    const mockUnit1 = { id: 100, isSold: false, save: jest.fn() };
    PackageUnit.findAll.mockResolvedValue([mockUnit1]);

    await expect(reserveStock(fakeOrder, fakeTransaction)).rejects.toMatchObject({ statusCode: 409 });
    expect(mockUnit1.save).not.toHaveBeenCalled();
  });

  it('PackageUnit.findAll çağrısına doğru lock ve order parametrelerini geçirir (race condition koruması)', async () => {
    OrderPackage.findAll.mockResolvedValue([{ packageId: 10, quantity: 1 }]);
    PackageUnit.findAll.mockResolvedValue([{ id: 100, isSold: false, save: jest.fn() }]);
    PackageUnit.count.mockResolvedValue(0);

    await reserveStock(fakeOrder, fakeTransaction);

    expect(PackageUnit.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ lock: 'UPDATE', order: [['id', 'ASC']] })
    );
  });
});

describe('assertPackageProductsNotExpired — SKT (son kullanma tarihi) kontrolü', () => {
  const fakeTransaction = {};

  beforeEach(() => jest.clearAllMocks());

  it('SKT dünse (geçmişse) AppError(409) fırlatır', async () => {
    PackageProduct.findAll.mockResolvedValue([
      { ShopProduct: { name: 'Bayat Ekmek', expiryDate: daysFromNow(-1) } },
    ]);

    await expect(assertPackageProductsNotExpired(1, fakeTransaction)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('hata mesajında ilgili ürünün adı geçer', async () => {
    PackageProduct.findAll.mockResolvedValue([
      { ShopProduct: { name: 'Bayat Poğaça', expiryDate: daysFromNow(-1) } },
    ]);

    await expect(assertPackageProductsNotExpired(1, fakeTransaction)).rejects.toThrow('Bayat Poğaça');
  });

  it('SKT bugünse izin verir (mevzuata göre son tüketim günü hâlâ satılabilir)', async () => {
    PackageProduct.findAll.mockResolvedValue([
      { ShopProduct: { name: 'Taze Simit', expiryDate: daysFromNow(0) } },
    ]);

    await expect(assertPackageProductsNotExpired(1, fakeTransaction)).resolves.toBeUndefined();
  });

  it('SKT gelecekteyse izin verir', async () => {
    PackageProduct.findAll.mockResolvedValue([
      { ShopProduct: { name: 'Konserve', expiryDate: daysFromNow(7) } },
    ]);

    await expect(assertPackageProductsNotExpired(1, fakeTransaction)).resolves.toBeUndefined();
  });

  it('expiryDate tanımlı olmayan (null) ürünleri görmezden gelir', async () => {
    PackageProduct.findAll.mockResolvedValue([
      { ShopProduct: { name: 'SKT Girilmemiş Ürün', expiryDate: null } },
    ]);

    await expect(assertPackageProductsNotExpired(1, fakeTransaction)).resolves.toBeUndefined();
  });

  it('birden fazla üründen biri bile SKT geçmişse tüm paketi reddeder', async () => {
    PackageProduct.findAll.mockResolvedValue([
      { ShopProduct: { name: 'Taze Ürün', expiryDate: daysFromNow(7) } },
      { ShopProduct: { name: 'Bayat Ürün', expiryDate: daysFromNow(-1) } },
    ]);

    await expect(assertPackageProductsNotExpired(1, fakeTransaction)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('hiç ürün yoksa (boş dizi) sorun çıkarmaz', async () => {
    PackageProduct.findAll.mockResolvedValue([]);

    await expect(assertPackageProductsNotExpired(1, fakeTransaction)).resolves.toBeUndefined();
  });
});

describe('createOrder', () => {
  beforeEach(() => jest.clearAllMocks());

  it('geçersiz bir paket (başka shop\'a ait) verilirse AppError(400) fırlatır ve rollback yapar', async () => {
    const t = mockTransaction();
    Package.findOne.mockResolvedValue(null); // shopId filtresiyle bulunamadı

    await expect(
      createOrder(5, { shopId: 1, packages: [{ packageId: 99, quantity: 1 }] })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(t.rollback).toHaveBeenCalled();
    expect(t.commit).not.toHaveBeenCalled();
    expect(Order.create).not.toHaveBeenCalled();
    // Paket zaten bulunamadığı için SKT kontrolüne hiç gidilmemeli.
    expect(PackageProduct.findAll).not.toHaveBeenCalled();
  });

  it('stok yetersizse AppError(409) fırlatır', async () => {
    const t = mockTransaction();
    Package.findOne.mockResolvedValue({ id: 1, price: 10 });
    PackageProduct.findAll.mockResolvedValue([]); // SKT kontrolünden geçsin, asıl test stok için
    PackageUnit.count.mockResolvedValue(0);

    await expect(
      createOrder(5, { shopId: 1, packages: [{ packageId: 1, quantity: 2 }] })
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(t.rollback).toHaveBeenCalled();
  });

  it('geçerli veriyle siparişi doğru toplam fiyatla oluşturur', async () => {
    const t = mockTransaction();
    Package.findOne.mockResolvedValue({ id: 1, price: 15 });
    PackageProduct.findAll.mockResolvedValue([]); // SKT kontrolünden geçsin
    PackageUnit.count.mockResolvedValue(10);
    Order.create.mockResolvedValue({ id: 100 });
    OrderPackage.create.mockResolvedValue({});

    const result = await createOrder(5, { shopId: 1, packages: [{ packageId: 1, quantity: 2 }] });

    expect(Order.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 5, shopId: 1, totalPrice: 30, status: 'pending' }),
      { transaction: t }
    );
    expect(OrderPackage.create).toHaveBeenCalledWith(
      { orderId: 100, packageId: 1, quantity: 2, price: 15 },
      { transaction: t }
    );
    expect(t.commit).toHaveBeenCalled();
    expect(result).toEqual({ id: 100 });
  });

  it('SKT geçmiş ürün içeren paket satın alınamaz (409), Order.create çağrılmaz, rollback yapılır', async () => {
    const t = mockTransaction();
    Package.findOne.mockResolvedValue({ id: 1, price: 10 });
    PackageProduct.findAll.mockResolvedValue([
      { ShopProduct: { name: 'Bayat Ekmek', expiryDate: daysFromNow(-1) } },
    ]);

    await expect(
      createOrder(5, { shopId: 1, packages: [{ packageId: 1, quantity: 1 }] })
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(Order.create).not.toHaveBeenCalled();
    expect(t.rollback).toHaveBeenCalled();
  });

  it('SKT kontrolü stok kontrolünden önce çalışır — geçersizse stok sorgusuna hiç gidilmez', async () => {
    mockTransaction();
    Package.findOne.mockResolvedValue({ id: 1, price: 10 });
    PackageProduct.findAll.mockResolvedValue([
      { ShopProduct: { name: 'Bayat Ekmek', expiryDate: daysFromNow(-1) } },
    ]);

    await expect(
      createOrder(5, { shopId: 1, packages: [{ packageId: 1, quantity: 1 }] })
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(PackageUnit.count).not.toHaveBeenCalled();
  });

  it('SKT bugün olan ürün içeren paket satın alınabilir (mevzuata göre hâlâ geçerli)', async () => {
    const t = mockTransaction();
    Package.findOne.mockResolvedValue({ id: 1, price: 10 });
    PackageProduct.findAll.mockResolvedValue([
      { ShopProduct: { name: 'Taze Simit', expiryDate: daysFromNow(0) } },
    ]);
    PackageUnit.count.mockResolvedValue(5);
    Order.create.mockResolvedValue({ id: 200 });
    OrderPackage.create.mockResolvedValue({});

    const result = await createOrder(5, { shopId: 1, packages: [{ packageId: 1, quantity: 1 }] });

    expect(Order.create).toHaveBeenCalled();
    expect(t.commit).toHaveBeenCalled();
    expect(result).toEqual({ id: 200 });
  });
});

describe('confirmByQRCode', () => {
  beforeEach(() => jest.clearAllMocks());

  it('geçersiz/süresi dolmuş QR kodda AppError(404) fırlatır', async () => {
    const t = mockTransaction();
    Order.findOne.mockResolvedValue(null);

    await expect(confirmByQRCode(1, 'gecersiz-token')).rejects.toMatchObject({ statusCode: 404 });
    expect(t.rollback).toHaveBeenCalled();
  });

  it('sipariş bulunsa bile market siparişin sahibi değilse AppError(403) fırlatır', async () => {
    const t = mockTransaction();
    Order.findOne.mockResolvedValue({ id: 1, shopId: 7, status: 'delivered' });
    Shop.findOne.mockResolvedValue(null); // ownerId: marketUserId ile eşleşmedi

    await expect(confirmByQRCode(999, 'gecerli-token')).rejects.toMatchObject({ statusCode: 403 });
    expect(t.rollback).toHaveBeenCalled();
  });

  it('geçerli sahiplik ve durum ile siparişi confirmed yapar', async () => {
    const t = mockTransaction();
    const mockOrder = {
      id: 1, shopId: 7, status: 'delivered',
      save: jest.fn().mockResolvedValue(true),
    };
    Order.findOne.mockResolvedValue(mockOrder);
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });

    const result = await confirmByQRCode(42, 'gecerli-token');

    expect(mockOrder.status).toBe('confirmed');
    expect(eventBus.emit).toHaveBeenCalledWith(
      ORDER_EVENTS.CONFIRMED,
      expect.objectContaining({ orderId: 1, shopId: 7 })
    );
    expect(t.commit).toHaveBeenCalled();
    expect(result).toBe(mockOrder);
  });
});

describe('changeStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sipariş bulunamazsa AppError(404) fırlatır', async () => {
    const t = mockTransaction();
    Order.findOne.mockResolvedValue(null);

    await expect(changeStatus(1, 'paid', 'user', 5)).rejects.toMatchObject({ statusCode: 404 });
    expect(t.rollback).toHaveBeenCalled();
  });

  it('actor=user, sipariş başka bir kullanıcıya aitse AppError(403) fırlatır', async () => {
    const t = mockTransaction();
    Order.findOne.mockResolvedValue({ id: 1, userId: 999, status: 'pending' });

    await expect(changeStatus(1, 'paid', 'user', 5)).rejects.toMatchObject({ statusCode: 403 });
    expect(t.rollback).toHaveBeenCalled();
  });

  it('actor=market, shop kullanıcıya ait değilse AppError(403) fırlatır', async () => {
    const t = mockTransaction();
    Order.findOne.mockResolvedValue({ id: 1, shopId: 7, status: 'paid' });
    Shop.findOne.mockResolvedValue(null);

    await expect(changeStatus(1, 'delivered', 'market', 999)).rejects.toMatchObject({ statusCode: 403 });
    expect(t.rollback).toHaveBeenCalled();
  });

  it('geçersiz durum geçişi (pending -> confirmed) AppError(409) fırlatır', async () => {
    const t = mockTransaction();
    Order.findOne.mockResolvedValue({ id: 1, userId: 5, status: 'pending' });

    await expect(changeStatus(1, 'confirmed', 'user', 5)).rejects.toMatchObject({ statusCode: 409 });
    expect(t.rollback).toHaveBeenCalled();
  });

  it('actor=admin sahiplik kontrolünden muaf tutulur, geçerli geçişte başarılı olur', async () => {
    const t = mockTransaction();
    const mockOrder = {
      id: 1, shopId: 7, status: 'paid',
      save: jest.fn().mockResolvedValue(true),
    };
    Order.findOne.mockResolvedValue(mockOrder);

    const result = await changeStatus(1, 'delivered', 'admin', 999);

    expect(Shop.findOne).not.toHaveBeenCalled(); // admin için shop kontrolü hiç yapılmamalı
    expect(mockOrder.status).toBe('delivered');
    expect(eventBus.emit).toHaveBeenCalledWith(
      ORDER_EVENTS.DELIVERED,
      expect.objectContaining({ orderId: 1 })
    );
    expect(t.commit).toHaveBeenCalled();
    expect(result).toBe(mockOrder);
  });

  it('actor=market, doğru sahiplikle paid -> delivered geçişini başarıyla yapar', async () => {
    const t = mockTransaction();
    const mockOrder = {
      id: 1, shopId: 7, status: 'paid',
      save: jest.fn().mockResolvedValue(true),
    };
    Order.findOne.mockResolvedValue(mockOrder);
    Shop.findOne.mockResolvedValue({ id: 7, ownerId: 42 });

    await changeStatus(1, 'delivered', 'market', 42);

    expect(mockOrder.status).toBe('delivered');
    expect(t.commit).toHaveBeenCalled();
  });

  // --- Actor bazlı yetkilendirme: bir geçiş state olarak "var" olsa bile
  // (ör. delivered -> confirmed transitions map'inde tanımlı), o geçişi
  // TALEP EDEN actor izinli değilse 403 dönmeli, 200 değil. Bu testler,
  // müşterinin kendi siparişini QR olmadan "confirmed" yapabildiği
  // güvenlik açığının kapandığını doğrular.

  it('actor=user kendi siparişini delivered -> confirmed yapamaz (self-confirm bypass kapalı, 403)', async () => {
    const t = mockTransaction();
    const mockOrder = {
      id: 1, userId: 5, shopId: 7, status: 'delivered',
      save: jest.fn().mockResolvedValue(true),
    };
    Order.findOne.mockResolvedValue(mockOrder);

    await expect(changeStatus(1, 'confirmed', 'user', 5)).rejects.toMatchObject({ statusCode: 403 });

    expect(mockOrder.save).not.toHaveBeenCalled();
    expect(mockOrder.status).toBe('delivered'); // değişmemiş olmalı
    expect(t.rollback).toHaveBeenCalled();
    expect(t.commit).not.toHaveBeenCalled();
  });

  it('actor=user kendi siparişini paid -> delivered yapamaz (403)', async () => {
    const t = mockTransaction();
    const mockOrder = { id: 1, userId: 5, shopId: 7, status: 'paid' };
    Order.findOne.mockResolvedValue(mockOrder);

    await expect(changeStatus(1, 'delivered', 'user', 5)).rejects.toMatchObject({ statusCode: 403 });
    expect(t.rollback).toHaveBeenCalled();
  });

  it('actor=admin, delivered -> confirmed geçişini override olarak yapabilir', async () => {
    const t = mockTransaction();
    const mockOrder = {
      id: 1, shopId: 7, status: 'delivered',
      save: jest.fn().mockResolvedValue(true),
    };
    Order.findOne.mockResolvedValue(mockOrder);

    const result = await changeStatus(1, 'confirmed', 'admin', 999);

    expect(Shop.findOne).not.toHaveBeenCalled();
    expect(mockOrder.status).toBe('confirmed');
    expect(t.commit).toHaveBeenCalled();
    expect(result).toBe(mockOrder);
  });
});