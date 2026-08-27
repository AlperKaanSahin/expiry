const request = require('supertest');
const app = require('../../app');
const {
  sequelize,
  User,
  Shop,
  Order,
  ShopRating,
} = require('../../models');

describe('Rating akışı: tamamlanmış sipariş → puan verme → tekrar puanlama', () => {
  const timestamp = Date.now();

  const userEmail = `rating-user+${timestamp}@test.com`;
  const shopOwnerEmail = `rating-shop+${timestamp}@test.com`;

  let userToken;
  let userId;
  let shopOwnerId;
  let shopId;
  let orderId;

  afterAll(async () => {
    await sequelize.close();
  });

  it('puan verecek kullanıcı kayıt olur', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        email: userEmail,
        password: '123456',
        firstName: 'Rating',
        lastName: 'User',
      });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user).toBeDefined();

    userToken = res.body.accessToken;
    userId = res.body.user.id;
  });

  it('market sahibi kullanıcı kayıt olur', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        email: shopOwnerEmail,
        password: '123456',
        firstName: 'Rating',
        lastName: 'Shop',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();

    shopOwnerId = res.body.user.id;
  });

  it('aktif test marketi oluşturulur', async () => {
    const shop = await Shop.create({
      name: `Rating Test Market ${timestamp}`,
      address: 'Test Adres',
      phone: '05551234567',
      ownerId: shopOwnerId,
      status: 'active',
      ratingAverage: 0,
      ratingCount: 0,
    });

    expect(shop).toBeDefined();
    expect(shop.status).toBe('active');

    shopId = shop.id;
  });

  it('tamamlanmamış sipariş oluşturulur', async () => {
    const order = await Order.create({
      userId,
      shopId,
      totalPrice: 100,
      status: 'paid',
    });

    expect(order).toBeDefined();
    expect(order.status).toBe('paid');

    orderId = order.id;
  });

  it('tamamlanmamış siparişi olan kullanıcı puan veremez', async () => {
    const res = await request(app)
      .get(`/api/shops/${shopId}/can-rate`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.canRate).toBe(false);
    expect(res.body.reason).toBe(
      'Henüz tamamlanmış siparişiniz yok'
    );
  });

  it('tamamlanmamış sipariş ile puan vermeye çalışınca reddedilir', async () => {
    const res = await request(app)
      .post('/api/shops/rate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        shopId,
        orderId,
        rating: 5,
      });

    expect(res.status).toBe(404);
expect(res.body.error).toBe('Geçersiz sipariş');
  });

  it('sipariş tamamlanmış duruma geçirilir', async () => {
    const order = await Order.findByPk(orderId);

    expect(order).toBeDefined();

    await order.update({
      status: 'confirmed',
    });

    expect(order.status).toBe('confirmed');
  });

  it('tamamlanmış siparişi olan kullanıcı puan verebilir', async () => {
    const res = await request(app)
      .get(`/api/shops/${shopId}/can-rate`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.canRate).toBe(true);
    expect(res.body.orderId).toBe(orderId);
  });

  it('kullanıcı tamamlanmış sipariş üzerinden markete puan verir', async () => {
    const res = await request(app)
      .post('/api/shops/rate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        shopId,
        orderId,
        rating: 5,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.ratingCount).toBe(1);
    expect(res.body.ratingAverage).toBe(5);
  });

  it('market puan bilgileri güncellenmiştir', async () => {
    const shop = await Shop.findByPk(shopId);

    expect(shop).toBeDefined();
    expect(shop.ratingCount).toBe(1);
    expect(shop.ratingAverage).toBe(5);
  });

  it('ShopRating kaydı oluşturulmuştur', async () => {
    const rating = await ShopRating.findOne({
      where: {
        userId,
        shopId,
        orderId,
      },
    });

    expect(rating).toBeDefined();
    expect(rating.rating).toBe(5);
  });

  it('aynı sipariş için tekrar puan verilemez', async () => {
    const res = await request(app)
      .post('/api/shops/rate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        shopId,
        orderId,
        rating: 4,
      });

    expect(res.status).toBe(409);
expect(res.body.error).toBe(
  'Bu sipariş için zaten puan verdiniz'
);
  });

  it('puan verdikten sonra can-rate false döner', async () => {
    const res = await request(app)
      .get(`/api/shops/${shopId}/can-rate`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.canRate).toBe(false);
    expect(res.body.reason).toBe(
      'Bu sipariş için zaten puan verdiniz'
    );
  });

  it('1-5 aralığı dışındaki puan kabul edilmez', async () => {
    const res = await request(app)
      .post('/api/shops/rate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        shopId,
        orderId,
        rating: 6,
      });

    expect(res.status).toBe(400);
expect(res.body.error).toBe('Puan 1 ile 5 arasında olmalı');
  });
});