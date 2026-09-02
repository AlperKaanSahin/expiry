const request = require('supertest');
const app = require('../../app');
const { sequelize, User, Notification } = require('../../models');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Notification akışı: listeleme → okundu → unread count → read all → event', () => {
  const timestamp = Date.now();
  const userEmail = `notification+${timestamp}@test.com`;

  let userToken;
  let userId;
  let notificationId;



  it('kullanıcı kayıt olur', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        email: userEmail,
        password: '123456',
        firstName: 'Notification',
        lastName: 'Test',
      });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();

    userToken = res.body.accessToken;
    userId = res.body.user.id;
  });

  it('başlangıçta okunmamış bildirim sayısı 0 olur', async () => {
    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(0);
  });

  it('kullanıcıya test bildirimi oluşturulur', async () => {
    const notification = await Notification.create({
      userId,
      type: 'TEST',
      title: 'Test Bildirimi',
      message: 'Bu bir test bildirimidir.',
      isRead: false,
    });

    expect(notification).toBeDefined();
    expect(notification.userId).toBe(userId);
    expect(notification.isRead).toBe(false);

    notificationId = notification.id;
  });

  it('kullanıcının bildirimleri listelenir', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const notification = res.body.data.find(
      (item) => item.id === notificationId
    );

    expect(notification).toBeDefined();
    expect(notification.title).toBe('Test Bildirimi');
    expect(notification.message).toBe('Bu bir test bildirimidir.');
    expect(notification.type).toBe('TEST');
    expect(notification.isRead).toBe(false);
  });

  it('unread-count 1 olur', async () => {
    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
  });

  it('bildirim okundu olarak işaretlenir', async () => {
    const res = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(notificationId);
    expect(res.body.data.isRead).toBe(true);
  });

  it('okundu işaretlendikten sonra unread-count 0 olur', async () => {
    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(0);
  });

  it('yeni okunmamış bildirimler oluşturulur', async () => {
    await Notification.bulkCreate([
      {
        userId,
        type: 'TEST',
        title: 'Test Bildirimi 2',
        message: 'İkinci test bildirimi.',
        isRead: false,
      },
      {
        userId,
        type: 'TEST',
        title: 'Test Bildirimi 3',
        message: 'Üçüncü test bildirimi.',
        isRead: false,
      },
    ]);

    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
  });

  it('tüm bildirimler okundu olarak işaretlenir', async () => {
    const res = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe(
      'Tüm bildirimler okundu olarak işaretlendi'
    );
  });

  it('read-all sonrasında unread-count 0 olur', async () => {
    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(0);
  });
  
});
describe('Notification akışı: gerçek event → otomatik bildirim', () => {
  const timestamp = Date.now();
  const shopOwnerEmail = `notifshop+${timestamp}@test.com`;

  let adminToken;
  let shopOwnerToken;
  let shopOwnerId;
  let shopId;



  it('admin ile giriş yapılır', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'admin@example.com', password: '1234' });

    expect(res.status).toBe(200);
    adminToken = res.body.accessToken;
  });

  it('market sahibi kayıt olur ve başvurur', async () => {
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        email: shopOwnerEmail,
        password: '123456',
        firstName: 'Notif',
        lastName: 'ShopOwner',
      });

    expect(registerRes.status).toBe(201);
    shopOwnerToken = registerRes.body.accessToken;
    shopOwnerId = registerRes.body.user.id;

    const applyRes = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${shopOwnerToken}`)
      .send({
        name: `Notif Test Market ${timestamp}`,
        address: 'Test Adres',
        phone: '05551234567',
        category: 'MARKET',
      });

    expect(applyRes.status).toBe(200);
    shopId = applyRes.body.shop.id;
  });

  it('market onaylanınca owner otomatik SHOP_APPROVED bildirimi alır', async () => {
    const res = await request(app)
      .put(`/api/admin/shops/${shopId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' });

    expect(res.status).toBe(200);

    await wait(150);

    const notifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${shopOwnerToken}`);

    expect(notifRes.status).toBe(200);

    const notif = notifRes.body.data.find((n) => n.type === 'SHOP_APPROVED');

    expect(notif).toBeDefined();
    expect(notif.title).toBe('Market Başvurusu Onaylandı');
    expect(notif.message).toContain(`Notif Test Market ${timestamp}`);
    expect(notif.isRead).toBe(false);
  });

  it('market reddedilince owner otomatik SHOP_REJECTED bildirimi alır', async () => {
    const rejectOwnerEmail = `notifreject+${timestamp}@test.com`;

    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        email: rejectOwnerEmail,
        password: '123456',
        firstName: 'Reject',
        lastName: 'Owner',
      });

    const rejectToken = registerRes.body.accessToken;

    const applyRes = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${rejectToken}`)
      .send({
        name: `Notif Reject Market ${timestamp}`,
        address: 'Reject Adres',
        phone: '05559998877',
        category: 'MARKET',
      });

    const rejectShopId = applyRes.body.shop.id;

    const statusRes = await request(app)
      .put(`/api/admin/shops/${rejectShopId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected' });

    expect(statusRes.status).toBe(200);

    await wait(150);

    const notifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${rejectToken}`);

    expect(notifRes.status).toBe(200);

    const notif = notifRes.body.data.find((n) => n.type === 'SHOP_REJECTED');

    expect(notif).toBeDefined();
    expect(notif.title).toBe('Market Başvurusu Reddedildi');
  });
});

afterAll(async () => {
  await sequelize.close();
});