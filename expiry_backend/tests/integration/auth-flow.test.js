const request = require('supertest');
const app = require('../../app');
const { sequelize, User, RefreshToken, UserDevice } = require('../../models');

describe('Auth akışı: kayıt → giriş → profil → token → şifre → cihaz → hesap silme', () => {
  const timestamp = Date.now();

  const email = `auth-test+${timestamp}@test.com`;
  const password = '123456';
  const newPassword = '654321';

  let userId;
  let accessToken;
  let refreshToken;
  let newAccessToken;
  let newRefreshToken;
  let tokenBeforeReset; // eklendi
  let deviceId;



  it('kullanıcı kayıt olabilir', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        email,
        password,
        firstName: 'Auth',
        lastName: 'Test',
      });

    expect(res.status).toBe(201);

    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.firstName).toBe('Auth');
    expect(res.body.user.lastName).toBe('Test');

    expect(res.body.user.password).toBeUndefined();

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();

    userId = res.body.user.id;
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

it('aynı email ile tekrar kayıt olunamaz', async () => {
  const res = await request(app)
    .post('/api/users/register')
    .send({
      email,
      password,
      firstName: 'Another',
      lastName: 'User',
    });

  expect(res.status).toBe(409);
  expect(res.body.error).toBeDefined();
  expect(typeof res.body.error).toBe('string');
});

  it('kullanıcı doğru bilgilerle giriş yapabilir', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email,
        password,
      });

    expect(res.status).toBe(200);

    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe(userId);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.password).toBeUndefined();

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();

    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

it('yanlış şifre ile giriş yapılamaz', async () => {
  const res = await request(app)
    .post('/api/users/login')
    .send({
      email,
      password: 'wrong-password',
    });

  expect(res.status).toBe(401);
  expect(res.body.error).toBeDefined();
  expect(typeof res.body.error).toBe('string');
});
  it('kullanıcı kendi profilini görüntüleyebilir', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);

    expect(res.body.id).toBe(userId);
    expect(res.body.email).toBe(email);
    expect(res.body.firstName).toBe('Auth');
    expect(res.body.lastName).toBe('Test');

    expect(res.body.password).toBeUndefined();
  });

  it('kullanıcı profilini güncelleyebilir', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        firstName: 'Updated',
        lastName: 'User',
        address: 'Test Adres',
      });

    expect(res.status).toBe(200);

    expect(res.body.firstName).toBe('Updated');
    expect(res.body.lastName).toBe('User');
    expect(res.body.address).toBe('Test Adres');

    expect(res.body.password).toBeUndefined();
  });

  it('geçerli refresh token ile yeni access token alınabilir', async () => {
    const res = await request(app)
      .post('/api/users/refresh')
      .send({
        refreshToken,
      });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();

    newAccessToken = res.body.accessToken;
  });

  it('logout refresh tokenı iptal eder', async () => {
    const res = await request(app)
      .post('/api/users/logout')
      .set('Authorization', `Bearer ${newAccessToken}`)
      .send({
        refreshToken,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Çıkış yapıldı');
  });

  it('logout sonrası aynı refresh token tekrar kullanılamaz', async () => {
    const res = await request(app)
      .post('/api/users/refresh')
      .send({
        refreshToken,
      });

    expect(res.status).toBe(401);
  });

  it('yeni login ile yeni refresh token alınabilir', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email,
        password,
      });

    expect(res.status).toBe(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();

    accessToken = res.body.accessToken;
    newRefreshToken = res.body.refreshToken;
  });

it('yanlış mevcut şifre ile şifre değiştirilemez', async () => {
  const res = await request(app)
    .put('/api/users/change-password')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      password: 'wrong-password',
      newPassword,
    });

  expect(res.status).toBe(401);
  expect(res.body.error).toBeDefined();
  expect(typeof res.body.error).toBe('string');
});

  it('doğru mevcut şifre ile şifre değiştirilebilir', async () => {
    const res = await request(app)
      .put('/api/users/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        password,
        newPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Şifre başarıyla değiştirildi');
  });

  it('şifre değiştikten sonra eski refresh tokenlar iptal edilir', async () => {
    const res = await request(app)
      .post('/api/users/refresh')
      .send({
        refreshToken: newRefreshToken,
      });

    expect(res.status).toBe(401);
  });

  it('eski şifre ile artık giriş yapılamaz', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email,
        password,
      });

    expect(res.status).toBe(401);
  });

  it('yeni şifre ile giriş yapılabilir', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email,
        password: newPassword,
      });

    expect(res.status).toBe(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();

    accessToken = res.body.accessToken;
    newRefreshToken = res.body.refreshToken;
  });

  it('forgot-password mevcut veya mevcut olmayan email için aynı mesajı döner', async () => {
    const existingRes = await request(app)
      .post('/api/users/forgot-password')
      .send({
        email,
      });

    expect(existingRes.status).toBe(200);
    expect(existingRes.body.message).toBe(
      'Eğer bu email adresi kayıtlıysa, şifre sıfırlama kodu gönderildi'
    );

    const nonExistingRes = await request(app)
      .post('/api/users/forgot-password')
      .send({
        email: `not-found+${timestamp}@test.com`,
      });

    expect(nonExistingRes.status).toBe(200);
    expect(nonExistingRes.body.message).toBe(
      'Eğer bu email adresi kayıtlıysa, şifre sıfırlama kodu gönderildi'
    );
  });

it('geçerli reset token ile şifre sıfırlanabilir', async () => {
  const tokenBeforeReset = newRefreshToken; // reset'ten önceki, hâlâ geçerli token

  const user = await User.findByPk(userId);

  expect(user).toBeDefined();
  expect(user.resetToken).toBeDefined();
  expect(user.resetTokenExpiry).toBeDefined();

  const resetPassword = 'reset123';

  const res = await request(app)
    .post('/api/users/reset-password')
    .send({
      email,
      token: user.resetToken,
      newPassword: resetPassword,
    });

  expect(res.status).toBe(200);
  expect(res.body.message).toBe('Şifreniz başarıyla güncellendi');

  const updatedUser = await User.findByPk(userId);

  expect(updatedUser.resetToken).toBeNull();
  expect(updatedUser.resetTokenExpiry).toBeNull();

  const loginRes = await request(app)
    .post('/api/users/login')
    .send({
      email,
      password: resetPassword,
    });

  expect(loginRes.status).toBe(200);
  expect(loginRes.body.accessToken).toBeDefined();

  accessToken = loginRes.body.accessToken;
  newRefreshToken = loginRes.body.refreshToken; // sıradaki testler için güncel token

  // reset'ten önceki token'ı, bir sonraki test kullanabilsin diye modül seviyesinde sakla
  global.__tokenBeforeReset = tokenBeforeReset;
});

it('şifre sıfırlandıktan sonra eski refresh token artık geçersizdir', async () => {
  const res = await request(app)
    .post('/api/users/refresh')
    .send({ refreshToken: global.__tokenBeforeReset });

  expect(res.status).toBe(401);
});

it('geçersiz reset token ile şifre sıfırlanamaz', async () => {
  const res = await request(app)
    .post('/api/users/reset-password')
    .send({
      email,
      token: '000000',
      newPassword: 'another123',
    });

  expect(res.status).toBe(400);
  expect(res.body.error).toBeDefined();
  expect(typeof res.body.error).toBe('string');
});

  it('cihaz kaydı yapılabilir', async () => {
    deviceId = `test-device-${timestamp}`;

    const res = await request(app)
      .post('/api/users/devices')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        deviceId,
        fcmToken: `test-fcm-token-${timestamp}`,
        platform: 'android',
        appVersion: '1.0.0',
      });

    expect(res.status).toBe(200);

    expect(res.body.message).toBe('Cihaz kaydedildi');
    expect(res.body.device).toBeDefined();
  });

  it('aynı cihaz tekrar kaydedildiğinde güncellenebilir', async () => {
    const res = await request(app)
      .post('/api/users/devices')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        deviceId,
        fcmToken: `updated-fcm-token-${timestamp}`,
        platform: 'android',
        appVersion: '1.0.1',
      });

    expect(res.status).toBe(200);

    expect(res.body.device).toBeDefined();
  });

  it('cihaz kaydı silinebilir', async () => {
    const res = await request(app)
      .delete('/api/users/devices')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        deviceId,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Cihaz kaydı silindi');

    const device = await UserDevice.findOne({
      where: {
        userId,
        deviceId,
      },
    });

    expect(device).toBeNull();
  });

  it('aktif sipariş yoksa hesap silinebilir', async () => {
    const res = await request(app)
      .delete('/api/users/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        password: 'reset123',
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Hesabınız başarıyla silindi');

    const deletedUser = await User.findByPk(userId, {
      paranoid: false,
    });

    expect(deletedUser).toBeDefined();
    expect(deletedUser.deletedAt).not.toBeNull();
    expect(deletedUser.firstName).toBe('Silinmiş');
    expect(deletedUser.lastName).toBe('Kullanıcı');
  });

});

describe('Auth akışı: validasyon, yetkilendirme, ek senaryolar', () => {
  const timestamp = Date.now();
  const email = `auth-extra+${timestamp}@test.com`;
  const password = '123456';

  let accessToken;
  let userId;



  it('kullanıcı kayıt olur (bu describe bloğu için)', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ email, password, firstName: 'Extra', lastName: 'Test' });

    expect(res.status).toBe(201);
    accessToken = res.body.accessToken;
    userId = res.body.user.id;
  });

  // ---------- Validasyon hataları ----------

  it('geçersiz email formatıyla kayıt olunamaz', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ email: 'not-an-email', password: '123456', firstName: 'A', lastName: 'B' });

    expect(res.status).toBe(400);
  });

  it('6 karakterden kısa şifreyle kayıt olunamaz', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ email: `short+${timestamp}@test.com`, password: '123', firstName: 'A', lastName: 'B' });

    expect(res.status).toBe(400);
  });

  it('firstName/lastName eksikse kayıt olunamaz', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ email: `noname+${timestamp}@test.com`, password: '123456' });

    expect(res.status).toBe(400);
  });

  it('şifresiz login denemesi reddedilir', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email });

    expect(res.status).toBe(400);
  });

  it('geçersiz email formatıyla forgot-password reddedilir', async () => {
    const res = await request(app)
      .post('/api/users/forgot-password')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
  });

  it('6 haneden farklı reset kodu reddedilir', async () => {
    const res = await request(app)
      .post('/api/users/reset-password')
      .send({ email, token: '123', newPassword: 'newpass123' });

    expect(res.status).toBe(400);
  });

  // ---------- Auth olmadan erişim ----------

  it('token olmadan profil görüntülenemez (401)', async () => {
    const res = await request(app).get('/api/users/profile');
    expect(res.status).toBe(401);
  });

  it('token olmadan profil güncellenemez (401)', async () => {
    const res = await request(app).put('/api/users/profile').send({ firstName: 'X' });
    expect(res.status).toBe(401);
  });

  it('token olmadan şifre değiştirilemez (401)', async () => {
    const res = await request(app)
      .put('/api/users/change-password')
      .send({ password, newPassword: 'newpass123' });
    expect(res.status).toBe(401);
  });

  it('token olmadan hesap silinemez (401)', async () => {
    const res = await request(app).delete('/api/users/account').send({ password });
    expect(res.status).toBe(401);
  });

  it('token olmadan cihaz kaydı yapılamaz (401)', async () => {
    const res = await request(app)
      .post('/api/users/devices')
      .send({ deviceId: 'x', fcmToken: 'y', platform: 'android' });
    expect(res.status).toBe(401);
  });

  // ---------- refreshToken edge case'leri ----------

  it('refreshToken hiç gönderilmezse 400 döner', async () => {
    const res = await request(app).post('/api/users/refresh').send({});
    expect(res.status).toBe(400);
  });

  it('bozuk formatlı refreshToken 401 döner', async () => {
    const res = await request(app)
      .post('/api/users/refresh')
      .send({ refreshToken: 'not-a-valid-jwt' });
    expect(res.status).toBe(401);
  });

  // ---------- removeDevice edge case ----------

  it('var olmayan bir cihaz silinmeye çalışılırsa yine de 200 döner (idempotent)', async () => {
    const res = await request(app)
      .delete('/api/users/devices')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ deviceId: 'never-registered-device' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Cihaz kaydı silindi');
  });

  // ---------- deleteAccount: aktif sipariş varken silinemez ----------

  it('aktif siparişi olan kullanıcı hesabını silemez', async () => {
    // market sahibi + aktif market + ürün + paket + sipariş oluşturuyoruz,
    // ödeme yapmadan (status: pending), sonra hesap silmeyi deniyoruz.
    const shopOwnerRes = await request(app).post('/api/users/register').send({
      email: `activeorder-shop+${timestamp}@test.com`, password: '123456', firstName: 'Shop', lastName: 'Owner',
    });
    const shopOwnerInitialToken = shopOwnerRes.body.accessToken;

    const applyRes = await request(app)
      .post('/api/shops/apply')
      .set('Authorization', `Bearer ${shopOwnerInitialToken}`)
      .send({ name: `Active Order Shop ${timestamp}`, address: 'Adres', phone: '05551239876', category: 'MARKET' });
    const shopId = applyRes.body.shop.id;

    const adminLogin = await request(app)
      .post('/api/users/login')
      .send({ email: 'admin@example.com', password: '1234' });

    await request(app)
      .put(`/api/admin/shops/${shopId}/status`)
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
      .send({ status: 'active' });

    const shopOwnerLogin = await request(app).post('/api/users/login').send({
      email: `activeorder-shop+${timestamp}@test.com`, password: '123456',
    });
    const shopOwnerToken = shopOwnerLogin.body.accessToken;

    const productRes = await request(app)
      .post('/api/shop/products')
      .set('Authorization', `Bearer ${shopOwnerToken}`)
      .send({ name: 'Active Order Ürün', price: 10, quantity: 10, expiryDate: '2027-01-01' });

    const packageRes = await request(app)
      .post('/api/shop/packages')
      .set('Authorization', `Bearer ${shopOwnerToken}`)
      .send({
        name: 'Active Order Paket',
        quantity: 5,
        deliveryStart: '2027-01-01T10:00:00Z',
        deliveryEnd: '2027-01-01T18:00:00Z',
        products: [{ id: productRes.body.id, quantity: 1, price: 10 }],
      });

    await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ shopId, packages: [{ packageId: packageRes.body.id, quantity: 1 }] });

    const deleteRes = await request(app)
      .delete('/api/users/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password });

    expect(deleteRes.status).toBe(409);
    expect(deleteRes.body.error).toBeDefined();
  });
});
afterAll(async () => {
  await sequelize.close();
});