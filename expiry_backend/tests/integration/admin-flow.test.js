const request = require('supertest');
const app = require('../../app');
const { sequelize, User } = require('../../models');

describe('Admin akışı', () => {
  const timestamp = Date.now();

  const userEmail = `admintest+${timestamp}@test.com`;
  const shopOwnerEmailA = `shopownerA+${timestamp}@test.com`;
  const shopOwnerEmailB = `shopownerB+${timestamp}@test.com`;
  const shopOwnerEmailC = `shopownerC+${timestamp}@test.com`;
  const deletableUserEmail = `deletable+${timestamp}@test.com`;

  let adminToken;
  let adminId;
  let userToken;
  let userId;

  let shopOwnerTokenA, shopOwnerIdA, shopIdA;
  let shopOwnerTokenB, shopOwnerIdB, shopIdB;
  let shopOwnerTokenC, shopIdC;

  let deletableUserId;

  afterAll(async () => {
    await sequelize.close();
  });

  // ---------- Setup ----------

  it('seed edilmiş admin hesabıyla giriş yapılır', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'admin@example.com', password: '1234' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.role).toBe('admin');

    adminToken = res.body.accessToken;
    adminId = res.body.user.id;
  });

  it('normal kullanıcı kayıt olur', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        email: userEmail,
        password: '123456',
        firstName: 'Admin',
        lastName: 'Test',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('user');

    userToken = res.body.accessToken;
    userId = res.body.user.id;
  });

  // ---------- Yetkilendirme ----------

  it('normal kullanıcı /admin/users endpointine erişemez', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('normal kullanıcı /admin/shops endpointine erişemez', async () => {
    const res = await request(app)
      .get('/api/admin/shops')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  // ---------- Kullanıcı listeleme / detay ----------

  it('admin tüm kullanıcıları listeleyebilir', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.total).toBeDefined();
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(10);
  });

  it('admin ikinci sayfayı farklı limit ile isteyebilir', async () => {
    const res = await request(app)
      .get('/api/admin/users?page=2&limit=1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(1);
    expect(res.body.users.length).toBeLessThanOrEqual(1);
  });

  it('admin kullanıcı detayını görüntüleyebilir', async () => {
    const res = await request(app)
      .get(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(userId);
    expect(res.body.email).toBe(userEmail);
    expect(res.body.password).toBeUndefined();
  });

  it('var olmayan kullanıcı detayı 404 döner', async () => {
    const res = await request(app)
      .get('/api/admin/users/999999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  // ---------- Rol değiştirme ----------

  it('admin kullanıcının rolünü değiştirebilir', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${userId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'market' });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(userId);
    expect(res.body.role).toBe('market');
  });

  it('admin geçersiz rol atayamaz', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${userId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'invalid-role' });

    expect(res.status).toBe(400);
  });

  it('var olmayan kullanıcıya rol atanamaz', async () => {
    const res = await request(app)
      .put('/api/admin/users/999999999/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'market' });

    expect(res.status).toBe(404);
  });

  // ---------- Kullanıcı silme ----------

  it('silinecek kullanıcı kayıt olur', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        email: deletableUserEmail,
        password: '123456',
        firstName: 'Delete',
        lastName: 'Me',
      });

    expect(res.status).toBe(201);
    deletableUserId = res.body.user.id;
  });

it('admin bir kullanıcıyı gerçekten silebilir', async () => {
  const res = await request(app)
    .delete(`/api/admin/users/${deletableUserId}`)
    .set('Authorization', `Bearer ${adminToken}`);

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);

  // Normal (paranoid) sorguda artık bulunamamalı
  const normalLookup = await User.findByPk(deletableUserId);
  expect(normalLookup).toBeNull();

  // paranoid: false ile bakınca hâlâ orada olmalı, deletedAt dolu olmalı
  const softDeleted = await User.findByPk(deletableUserId, { paranoid: false });
  expect(softDeleted).toBeDefined();
  expect(softDeleted.deletedAt).not.toBeNull();
});

  it('var olmayan kullanıcı silinemez', async () => {
    const res = await request(app)
      .delete('/api/admin/users/999999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('admin kendi hesabını silemez', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  // ---------- Shop setup (3 ayrı market, farklı geçiş senaryoları için) ----------

  it('market sahibi A kayıt olur ve başvurur', async () => {
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        email: shopOwnerEmailA,
        password: '123456',
        firstName: 'Shop',
        lastName: 'OwnerA',
      });

    expect(registerRes.status).toBe(201);
    shopOwnerTokenA = registerRes.body.accessToken;
    shopOwnerIdA = registerRes.body.user.id;

    const applyRes = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${shopOwnerTokenA}`)
      .send({
        name: `Admin Test Market A ${timestamp}`,
        address: 'Test Adres A',
        phone: '05551234567',
        category: 'MARKET',
      });

    expect(applyRes.status).toBe(200);
    expect(applyRes.body.shop.status).toBe('pending');
    shopIdA = applyRes.body.shop.id;
  });

  it('market sahibi B kayıt olur ve başvurur', async () => {
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        email: shopOwnerEmailB,
        password: '123456',
        firstName: 'Shop',
        lastName: 'OwnerB',
      });

    expect(registerRes.status).toBe(201);
    shopOwnerTokenB = registerRes.body.accessToken;
    shopOwnerIdB = registerRes.body.user.id;

    const applyRes = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${shopOwnerTokenB}`)
      .send({
        name: `Admin Test Market B ${timestamp}`,
        address: 'Test Adres B',
        phone: '05551234568',
        category: 'MARKET',
      });

    expect(applyRes.status).toBe(200);
    shopIdB = applyRes.body.shop.id;
  });

  it('market sahibi C kayıt olur ve başvurur', async () => {
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        email: shopOwnerEmailC,
        password: '123456',
        firstName: 'Shop',
        lastName: 'OwnerC',
      });

    expect(registerRes.status).toBe(201);
    shopOwnerTokenC = registerRes.body.accessToken;

    const applyRes = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${shopOwnerTokenC}`)
      .send({
        name: `Admin Test Market C ${timestamp}`,
        address: 'Test Adres C',
        phone: '05551234569',
        category: 'MARKET',
      });

    expect(applyRes.status).toBe(200);
    shopIdC = applyRes.body.shop.id;
  });

  // ---------- Shop listeleme / güncelleme ----------

  it('admin tüm marketleri listeleyebilir', async () => {
    const res = await request(app)
      .get('/api/admin/shops')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.shops)).toBe(true);
    expect(res.body.total).toBeDefined();
  });

  it('admin market bilgilerini güncelleyebilir', async () => {
    const res = await request(app)
      .put(`/api/admin/shops/${shopIdA}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Updated Market A ${timestamp}`,
        address: 'Updated Address A',
        phone: '05559876543',
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe(`Updated Market A ${timestamp}`);
    expect(res.body.address).toBe('Updated Address A');
    expect(res.body.phone).toBe('05559876543');
  });

  it('market güncellenirken isim boş gönderilirse reddedilir', async () => {
  const res = await request(app)
    .put(`/api/admin/shops/${shopIdB}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: '', address: 'Adres', phone: '05551112233' });

  expect(res.status).toBe(400);
});

it('market güncellenirken geçersiz telefon reddedilir', async () => {
  const res = await request(app)
    .put(`/api/admin/shops/${shopIdB}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Test', address: 'Adres', phone: 'abc' });

  expect(res.status).toBe(400);
});

it('market güncellenirken aynı isim kullanılırsa 409 döner', async () => {
  const res = await request(app)
    .put(`/api/admin/shops/${shopIdB}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: `Updated Market A ${timestamp}`, // A'nın adıyla çakıştırıyoruz
      address: 'Adres',
      phone: '05551112233',
    });

  expect(res.status).toBe(409);
  expect(res.body.error).toBe('Bu market adı zaten kullanılıyor');
});

  it('var olmayan market güncellenemez', async () => {
    const res = await request(app)
      .put('/api/admin/shops/999999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'X', address: 'Y', phone: '05550000000' });

    expect(res.status).toBe(404);
  });

  // ---------- Status state machine: Market A (pending → active → inactive → active) ----------

  it('market A: pending → active geçişi ve owner rolü market olur', async () => {
    const res = await request(app)
      .put(`/api/admin/shops/${shopIdA}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' });

    expect(res.status).toBe(200);
    expect(res.body.shop.status).toBe('active');

    const owner = await User.findByPk(shopOwnerIdA);
    expect(owner.role).toBe('market');
  });

  it('market A: active → rejected geçişi reddedilir', async () => {
    const res = await request(app)
      .put(`/api/admin/shops/${shopIdA}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected' });

    expect(res.status).toBe(400);
  });

  it('market A: active → inactive geçişi', async () => {
    const res = await request(app)
      .put(`/api/admin/shops/${shopIdA}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'inactive' });

    expect(res.status).toBe(200);
    expect(res.body.shop.status).toBe('inactive');
  });

  it('market A: inactive → active geçişi ve owner tekrar market olur', async () => {
    const res = await request(app)
      .put(`/api/admin/shops/${shopIdA}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' });

    expect(res.status).toBe(200);
    expect(res.body.shop.status).toBe('active');

    const owner = await User.findByPk(shopOwnerIdA);
    expect(owner.role).toBe('market');
  });

  // ---------- Status state machine: Market B (pending → rejected) ----------

  it('market B: pending → rejected geçişi ve owner rolü user olur', async () => {
    const res = await request(app)
      .put(`/api/admin/shops/${shopIdB}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected' });

    expect(res.status).toBe(200);
    expect(res.body.shop.status).toBe('rejected');

    const owner = await User.findByPk(shopOwnerIdB);
    expect(owner.role).toBe('user');
  });

  it('market B: rejected durumundan hiçbir geçiş yapılamaz', async () => {
    const res = await request(app)
      .put(`/api/admin/shops/${shopIdB}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' });

    expect(res.status).toBe(400);
  });

  // ---------- Status validasyonu: Market C ----------

  it('geçersiz status değeri reddedilir', async () => {
    const res = await request(app)
      .put(`/api/admin/shops/${shopIdC}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'not-a-real-status' });

    expect(res.status).toBe(400);
  });

  it('status alanı boş gönderilirse reddedilir', async () => {
    const res = await request(app)
      .put(`/api/admin/shops/${shopIdC}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  // ---------- Shop silme ----------

  it('admin marketi silebilir', async () => {
    const res = await request(app)
      .delete(`/api/admin/shops/${shopIdC}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('var olmayan market silinemez', async () => {
    const res = await request(app)
      .delete('/api/admin/shops/999999999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});