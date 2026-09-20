const orderService = require('../services/orderService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const iyzicoService = require('../services/iyzicoService');

// Iyzico'nun asenkron webhook bildirimi (checkout form callback'ten AYRI bir
// mekanizma — fraud/gecikmeli sonuç gibi durumlar için). Public, JWT yok.
// Header'daki X-IYZ-SIGNATURE-V3 doğrulanmadan hiçbir şey işlenmiyor.
const iyzicoWebhook = catchAsync(async (req, res) => {
  const { iyziEventType, iyziPaymentId, token, paymentConversationId, status } = req.body || {};
  const signature = req.headers['x-iyz-signature-v3'];

  if (!signature) {
    // İmza hiç yoksa muhtemelen hesapta X-IYZ-SIGNATURE-V3 özelliği aktif değil
    // (entegrasyon@iyzico.com ile aktif ettirilmesi gerekiyor) — bunu "imza yanlış"
    // hatasından ayırt edilebilir logluyoruz, teşhisi kolaylaştırsın diye.
    console.error('[iyzico webhook] İmza header\'ı (X-IYZ-SIGNATURE-V3) hiç gelmedi — hesapta bu özellik aktif mi kontrol et');
    return res.status(401).json({ error: 'İmza eksik' });
  }

  const isValid = iyzicoService.verifyWebhookSignature(
    { iyziEventType, iyziPaymentId, token, paymentConversationId, status },
    signature
  );

  if (!isValid) {
    console.error('[iyzico webhook] Geçersiz imza — istek reddedildi', { token, iyziEventType, status });
    return res.status(401).json({ error: 'Geçersiz imza' });
  }

  // Sadece nihai durumu işliyoruz; ara durumlar (INIT_THREEDS vb.) için bir şey yapmıyoruz.
  if (status === 'SUCCESS' && token) {
    try {
      await orderService.handleCheckoutCallback(token);
    } catch (err) {
      // handleCheckoutCallback zaten idempotent (order 'pending' değilse no-op).
      // Burada hata muhtemelen Iyzico'nun retrieve çağrısı başarısız olduğunda oluşur —
      // logla ama yine 2xx dön, aksi halde Iyzico 15dk'da bir 3 kez retry eder.
      console.error('[iyzico webhook] handleCheckoutCallback hatası:', err.message);
    }
  }

  res.status(200).json({ received: true });
});

const createOrder = catchAsync(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body);
  res.status(201).json(order);
});

const simulatePayment = catchAsync(async (req, res) => {
  const result = await orderService.simulatePayment(req.user.id, req.body.orderId);
  res.json(result);
});

const initiateCheckout = catchAsync(async (req, res) => {
  const result = await orderService.initiateCheckout(req.user.id, req.params.id, req);
  res.json(result);
});

// Iyzico'nun callbackUrl'e POST ettiği public endpoint. auth YOK — Iyzico'nun
// sunucusu JWT taşımıyor. Güvenlik, POST'a güvenmemekten geliyor: token ile
// Iyzico'ya geri sorup (retrieveCheckoutForm) otoriter sonucu handleCheckoutCallback
// içinde alıyoruz. WebView'in yakalayıp kapatması için custom scheme'e redirect
// ediyoruz — RN tarafında bu scheme'i dinleyen bir onShouldStartLoadWithRequest
// (veya onNavigationStateChange) handler'ı gerekiyor, o ayrı bir iş.
const iyzicoCallback = catchAsync(async (req, res) => {
  const token = req.body?.token;
  const baseRedirect = `${process.env.BACKEND_URL}/api/orders/payment-result`;

  if (!token) {
    return res.redirect(303, `${baseRedirect}?status=failed&message=${encodeURIComponent('Token eksik')}`);
  }

  try {
    const order = await orderService.handleCheckoutCallback(token);
    return res.redirect(303, `${baseRedirect}?status=success&orderId=${order.id}`);
  } catch (err) {
    return res.redirect(303, `${baseRedirect}?status=failed&message=${encodeURIComponent(err.message || '')}`);
  }
});

// WebView'in onShouldStartLoadWithRequest'i intercept edip navigasyonu engellemesi
// gerekiyor (return false) — buraya normalde hiç gelinmemeli. Buraya bir kullanıcı
// gerçekten ulaşırsa (intercept başarısız olduysa) en azından anlamlı bir mesaj görsün.
const paymentResultPage = (req, res) => {
  const { status, message } = req.query;
  const humanMessage = status === 'success'
    ? 'Ödemeniz tamamlandı. Uygulamaya dönebilirsiniz.'
    : `Ödeme başarısız oldu. ${message || ''}`;

  res.send(`<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"><title>Expiry</title></head>
<body>
  <p>${humanMessage}</p>
</body>
</html>`);
};

const changeOrderStatus = catchAsync(async (req, res) => {
  const isMarket = req.user.role === 'market';

  const order = await orderService.changeStatus(
    req.params.id,
    req.body.status,
    isMarket ? 'market' : 'user',
    req.user.id
  );

  res.json(order);
});

const confirmOrder = catchAsync(async (req, res) => {
  const order = await orderService.changeStatus(req.params.id, 'confirmed', 'user', req.user.id);
  res.json(order);
});

const confirmByQRCode = catchAsync(async (req, res) => {
  const { deliveryToken } = req.body;
  const order = await orderService.confirmByQRCode(req.user.id, deliveryToken);
  res.json(order);
});

const markDelivered = catchAsync(async (req, res) => {
  const order = await orderService.changeStatus(req.params.id, 'delivered', 'market', req.user.id);
  res.json(order);
});

const getMyShopOrders = catchAsync(async (req, res) => {
  const shop = await orderService.getShopByOwner(req.user.id);
  if (!shop) throw new AppError('Market bulunamadı', 404);

  const statusGroup = req.query.tab === 'past' ? 'past' : 'active';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await orderService.listShopOrders(shop.id, statusGroup, page, limit);
  res.json(result);
});

const getMyUserOrders = catchAsync(async (req, res) => {
  const statusGroup = req.query.tab === 'past' ? 'past' : 'active';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await orderService.listUserOrders(req.user.id, statusGroup, page, limit);
  res.json(result);
});

module.exports = {
  createOrder,
  simulatePayment,
  initiateCheckout,
  iyzicoCallback,
  iyzicoWebhook,
  paymentResultPage,
  changeOrderStatus,
  markDelivered,
  confirmOrder,
  confirmByQRCode,
  getMyShopOrders,
  getMyUserOrders
};