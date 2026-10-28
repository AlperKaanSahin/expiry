const request = require('supertest');
const app = require('../../app');
const { sequelize, Shop } = require('../../models');

// Herkese açık (kimlik doğrulamasız) market endpoint'leri Shop kaydını döner. Shop modelinde
// IBAN, kimlik/vergi numarası ve Iyzico subMerchantKey gibi hassas alanlar var; bunlar
// müşteri yüzündeki hiçbir yanıtta yer almamalı. Kontrol hem alan adıyla hem DEĞERLE yapılır
// (alan yeniden adlandırılsa bile sentinel değer yanıtta görünürse test kırılır).
describe('Herkese açık market endpoint\'leri hassas ödeme alanlarını sızdırmaz', () => {
  const timestamp = Date.now();
  const ownerEmail = `leak-owner+${timestamp}@test.com`;

  const secrets = {
    iban: `TR00LEAKTEST${timestamp}`,
    identityNumber: `ID${timestamp}`,
    taxNumber: `TX${timestamp}`,
    taxOffice: `Gizli Vergi Dairesi ${timestamp}`,
    legalCompanyTitle: `Gizli Unvan ${timestamp}`,
    subMerchantKey: `SMK-${timestamp}`,
  };

  const SENSITIVE_KEYS = [
    'iban', 'identityNumber', 'taxNumber', 'taxOffice', 'legalCompanyTitle',
    'subMerchantKey', 'subMerchantType', 'subMerchantStatus', 'ownerId', 'coverImagePendingUrl',
  ];

  let adminToken, ownerToken, shopId;

  afterAll(async () => {
    await sequelize.close();
  });

  function expectNoSensitiveData(shopObj) {
    expect(shopObj).toBeDefined();
    for (const key of SENSITIVE_KEYS) {
      expect(shopObj).not.toHaveProperty(key);
    }
    const serialized = JSON.stringify(shopObj);
    for (const value of Object.values(secrets)) {
      expect(serialized).not.toContain(value);
    }
    // Aşırı kısıtlama kontrolü: müşteri yüzü için gereken alanlar hâlâ geliyor.
    expect(shopObj.name).toBe(`Leak Market ${timestamp}`);
    expect(shopObj.category).toBe('MARKET');
  }

  it('admin hesabıyla giriş yapılır', async () => {
    const res = await request(app).post('/api/users/login').send({ email: 'admin@example.com', password: '1234' });
    expect(res.status).toBe(200);
    adminToken = res.body.accessToken;
  });

  it('market başvurur, onaylanır ve ödeme alanları doğrudan DB\'de doldurulur', async () => {
    const registerRes = await request(app).post('/api/users/register').send({
      email: ownerEmail, password: '123456', firstName: 'Leak', lastName: 'Owner',
    });
    expect(registerRes.status).toBe(201);

    const applyRes = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
      .send({ name: `Leak Market ${timestamp}`, address: 'Adres', phone: '05550000000', category: 'MARKET' });
    expect(applyRes.status).toBe(200);
    shopId = applyRes.body.shop.id;

    const approveRes = await request(app)
      .put(`/api/admin/shops/${shopId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' });
    expect(approveRes.status).toBe(200);

    // Iyzico'ya gitmeden, ödeme alanlarını doğrudan modele yazıyoruz.
    await Shop.update(
      { ...secrets, subMerchantType: 'PERSONAL', subMerchantStatus: 'active' },
      { where: { id: shopId } }
    );

    const loginRes = await request(app).post('/api/users/login').send({ email: ownerEmail, password: '123456' });
    expect(loginRes.status).toBe(200);
    ownerToken = loginRes.body.accessToken;
  });

  it('GET /api/shops (kimliksiz) hassas alan dönmez', async () => {
    const res = await request(app).get('/api/shops');

    expect(res.status).toBe(200);
    const shop = res.body.find((s) => s.id === shopId);
    expectNoSensitiveData(shop);
  });

  it('GET /api/shops/:id (kimliksiz) hassas alan dönmez', async () => {
    const res = await request(app).get(`/api/shops/${shopId}`);

    expect(res.status).toBe(200);
    expectNoSensitiveData(res.body.shop);
  });

  // Bu endpoint şu an 500 dönüyor (Shop.hasMany(Package) tanımlı değil, include hata veriyor).
  // Test bilerek durum kodundan bağımsız: yanıt ne olursa olsun hassas veri içermemeli.
  // İlişki tanımlanıp endpoint düzeltilirse bu test sızıntıyı yakalamaya devam eder.
  it('GET /api/shops/:id/packages (kimliksiz) yanıtı, durumu ne olursa olsun hassas veri içermez', async () => {
    const res = await request(app).get(`/api/shops/${shopId}/packages`);

    const serialized = JSON.stringify(res.body);
    for (const value of Object.values(secrets)) {
      expect(serialized).not.toContain(value);
    }
    for (const key of SENSITIVE_KEYS) {
      expect(serialized).not.toContain(`"${key}"`);
    }
  });

  it('market sahibi kendi ödeme ayarlarını hâlâ görebilir', async () => {
    const res = await request(app)
      .get('/api/shops/me/payment-settings')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.settings.iban).toBe(secrets.iban);
  });
});