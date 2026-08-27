const request = require('supertest');
const app = require('../../app');
const { sequelize } = require('../../models');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Audit log akışı', () => {
  const timestamp = Date.now();

  const userEmail = `audituser+${timestamp}@test.com`;
  const shopOwnerEmail = `auditshop+${timestamp}@test.com`;

  let adminToken;
  let userToken;
  let userId;

  let shopOwnerToken;
  let shopOwnerId;
  let shopId;

  afterAll(async () => {
    await sequelize.close();
  });

  // ---------- Setup ----------

  it('admin ile giriş yapılır', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'admin@example.com', password: '1234' });

    expect(res.status).toBe(200);
    adminToken = res.body.accessToken;
  });

  it('normal kullanıcı kayıt olur', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        email: userEmail,
        password: '123456',
        firstName: 'Audit',
        lastName: 'User',
      });

    expect(res.status).toBe(201);
    userToken = res.body.accessToken;
    userId = res.body.user.id;
  });

  // ---------- Yetkilendirme ----------

  it('admin olmayan kullanıcı audit-logs endpointine erişemez', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  // ---------- Pagination / temel format ----------

  it('admin audit loglarını listeleyebilir', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.logs)).toBe(true);
    expect(res.body.total).toBeDefined();
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(20);
  });

  it('admin ikinci sayfayı farklı limit ile isteyebilir', async () => {
    const res = await request(app)
      .get('/api/audit-logs?page=2&limit=1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(1);
    expect(res.body.logs.length).toBeLessThanOrEqual(1);
  });

  // ---------- ROLE_CHANGED ----------

  it('rol değiştirme işlemi ROLE_CHANGED logu oluşturur', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${userId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'market' });

    expect(res.status).toBe(200);

    await wait(150);

    const logsRes = await request(app)
      .get('/api/audit-logs?limit=50')
      .set('Authorization', `Bearer ${adminToken}`);

    const log = logsRes.body.logs.find(
      (l) => l.action === 'ROLE_CHANGED' && l.entityId === userId
    );

    expect(log).toBeDefined();
    expect(log.entityType).toBe('USER');
    expect(log.metadata.oldRole).toBe('user');
    expect(log.metadata.newRole).toBe('market');
  });

  // ---------- Shop setup ----------

  it('market sahibi kayıt olur ve başvurur', async () => {
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        email: shopOwnerEmail,
        password: '123456',
        firstName: 'Audit',
        lastName: 'ShopOwner',
      });

    expect(registerRes.status).toBe(201);
    shopOwnerToken = registerRes.body.accessToken;
    shopOwnerId = registerRes.body.user.id;

    const applyRes = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${shopOwnerToken}`)
      .send({
        name: `Audit Test Market ${timestamp}`,
        address: 'Test Adres',
        phone: '05551234567',
      });

    expect(applyRes.status).toBe(200);
    shopId = applyRes.body.shop.id;
  });

  // ---------- SHOP_APPROVED (status: pending -> active) ----------

  it('market onaylanınca SHOP_APPROVED logu oluşturur', async () => {
    const res = await request(app)
      .put(`/api/admin/shops/${shopId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' });

    expect(res.status).toBe(200);

    await wait(150);

    const logsRes = await request(app)
      .get('/api/audit-logs?limit=50')
      .set('Authorization', `Bearer ${adminToken}`);

    const log = logsRes.body.logs.find(
      (l) => l.action === 'SHOP_APPROVED' && l.entityId === shopId
    );

    expect(log).toBeDefined();
    expect(log.entityType).toBe('SHOP');
    expect(log.metadata.to).toBe('active');
    expect(log.metadata.from).toBe('pending');
  });

  // ---------- SHOP_UPDATED ----------

  it('market güncellenince SHOP_UPDATED logu oluşturur', async () => {
    const res = await request(app)
      .put(`/api/admin/shops/${shopId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Updated Audit Market ${timestamp}`,
        address: 'Updated Adres',
        phone: '05559998877',
      });

    expect(res.status).toBe(200);

    await wait(150);

    const logsRes = await request(app)
      .get('/api/audit-logs?limit=50')
      .set('Authorization', `Bearer ${adminToken}`);

    const log = logsRes.body.logs.find(
      (l) => l.action === 'SHOP_UPDATED' && l.entityId === shopId
    );

    expect(log).toBeDefined();
    expect(log.entityType).toBe('SHOP');
    expect(log.metadata.newShop.name).toBe(`Updated Audit Market ${timestamp}`);
  });

  // ---------- SHOP_DEACTIVATED (status: active -> inactive) ----------

  it('market pasifleştirilince SHOP_DEACTIVATED logu oluşturur', async () => {
    const res = await request(app)
      .put(`/api/admin/shops/${shopId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'inactive' });

    expect(res.status).toBe(200);

    await wait(150);

    const logsRes = await request(app)
      .get('/api/audit-logs?limit=50')
      .set('Authorization', `Bearer ${adminToken}`);

    const log = logsRes.body.logs.find(
      (l) => l.action === 'SHOP_DEACTIVATED' && l.entityId === shopId
    );

    expect(log).toBeDefined();
    expect(log.metadata.from).toBe('active');
    expect(log.metadata.to).toBe('inactive');
  });

  // ---------- SHOP_REJECTED (ayrı bir market ile: pending -> rejected) ----------

  it('yeni market başvurusu reddedilince SHOP_REJECTED logu oluşturur', async () => {
    const rejectOwnerEmail = `auditreject+${timestamp}@test.com`;

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
        name: `Reject Market ${timestamp}`,
        address: 'Reject Adres',
        phone: '05551112233',
      });

    const rejectShopId = applyRes.body.shop.id;

    const statusRes = await request(app)
      .put(`/api/admin/shops/${rejectShopId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected' });

    expect(statusRes.status).toBe(200);

    await wait(150);

    const logsRes = await request(app)
      .get('/api/audit-logs?limit=50')
      .set('Authorization', `Bearer ${adminToken}`);

    const log = logsRes.body.logs.find(
      (l) => l.action === 'SHOP_REJECTED' && l.entityId === rejectShopId
    );

    expect(log).toBeDefined();
    expect(log.metadata.to).toBe('rejected');
  });

  // ---------- SHOP_DELETED ----------

  it('market silinince SHOP_DELETED logu oluşturur', async () => {
    const res = await request(app)
      .delete(`/api/admin/shops/${shopId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    await wait(150);

    const logsRes = await request(app)
      .get('/api/audit-logs?limit=50')
      .set('Authorization', `Bearer ${adminToken}`);

    const log = logsRes.body.logs.find(
      (l) => l.action === 'SHOP_DELETED' && l.entityId === shopId
    );

    expect(log).toBeDefined();
    expect(log.entityType).toBe('SHOP');
  });

  // ---------- USER_DELETED ----------

  it('kullanıcı silinince USER_DELETED logu oluşturur', async () => {
    const deletableEmail = `auditdelete+${timestamp}@test.com`;

    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        email: deletableEmail,
        password: '123456',
        firstName: 'Delete',
        lastName: 'Target',
      });

    const deletableId = registerRes.body.user.id;

    const deleteRes = await request(app)
      .delete(`/api/admin/users/${deletableId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);

    await wait(150);

    const logsRes = await request(app)
      .get('/api/audit-logs?limit=50')
      .set('Authorization', `Bearer ${adminToken}`);

    const log = logsRes.body.logs.find(
      (l) => l.action === 'USER_DELETED' && l.entityId === deletableId
    );

    expect(log).toBeDefined();
    expect(log.entityType).toBe('USER');
  });
});