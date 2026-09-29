const Sentry = require('@sentry/node');
const { Op } = require('sequelize');
const {
  Order, OrderPackage, Package, PackageUnit, PackageProduct, ShopProduct, Shop, User, sequelize
} = require('../models');
const eventBus = require('../events/eventBus');
const ORDER_EVENTS = require('../events/order.events');
const crypto = require('crypto');
const AppError = require('../utils/AppError');
const iyzicoService = require('./iyzicoService');

const PLATFORM_FEE_FIXED_AMOUNT = 10; // ≤50 TL paketler için sabit tutar
const PLATFORM_FEE_THRESHOLD = 50;
const PLATFORM_FEE_PERCENTAGE = 0.20;

// iyzico Checkout Form'un oturum süresine yakın tutuldu — kesin değer
// dokümandan doğrulanmadı, sandbox'ta checkout formunun ne kadar açık
// kaldığını test edip gerekirse ayarla.
const RESERVATION_TTL_MINUTES = 20;

function calculatePlatformFee(totalPrice) {
  if (totalPrice <= PLATFORM_FEE_THRESHOLD) {
    return PLATFORM_FEE_FIXED_AMOUNT;
  }
  return parseFloat((totalPrice * PLATFORM_FEE_PERCENTAGE).toFixed(2));
}

// Her durum geçişi, hangi actor'lerin (rollerin) bu geçişi tetikleyebileceğini
// açıkça listeler. Bu liste, "kim hangi state'i değiştirebilir" sorusunun tek
// doğru kaynağıdır — buraya eklenmeyen bir (from, to, actor) kombinasyonu
// otomatik olarak reddedilir.
const TRANSITIONS = {
  pending: { paid: ['system', 'admin'] },
  paid: { delivered: ['market', 'admin'] },
  delivered: { confirmed: ['market', 'admin'] },
  confirmed: { released: ['market', 'admin'] },
};

const STATUS_GROUPS = {
  active: ['pending', 'paid', 'delivered'],
  past: ['confirmed', 'released'],
};

function getTransitionRule(current, next) {
  return TRANSITIONS[current]?.[next] || null;
}

async function assertPackageProductsNotExpired(packageId, transaction) {
  const packageProducts = await PackageProduct.findAll({
    where: { packageId },
    include: [{ model: ShopProduct, attributes: ['id', 'name', 'expiryDate'] }],
    transaction,
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  for (const pp of packageProducts) {
    const expiryDate = pp.ShopProduct?.expiryDate;
    if (!expiryDate) continue;

    const expiryDay = new Date(expiryDate);
    expiryDay.setHours(0, 0, 0, 0);

    if (expiryDay < todayStart) {
      throw new AppError(
        `"${pp.ShopProduct.name}" ürününün son kullanma tarihi geçtiği için bu paket satın alınamaz`,
        409
      );
    }
  }
}

// NOT: 'confirmed' durumunda Iyzico approve call'u BURADA (transaction içinde)
// YAPILMIYOR — bkz. payment.handler.js. Dış bir HTTP çağrısını DB transaction'ı
// içinde tutmak (network round-trip boyunca row lock) ölçeklenebilirlik açısından
// kötü; approve call, transaction commit olduktan sonra event listener'da çalışıyor.
//
// Event'ler commit'ten SONRA fırlatılır: transaction rollback olursa hiçbir
// listener (bildirim, audit, Iyzico approve) çalışmaz.
async function runSideEffects(order, status, transaction) {
  const emitAfterCommit = (event, payload) => {
    transaction.afterCommit(() => {
      eventBus.emit(event, payload);
    });
  };

  switch (status) {
    case 'paid': {
      await reserveStock(order, transaction);

      const orderPackages = await OrderPackage.findAll({
        where: { orderId: order.id },
        include: [{ model: Package, attributes: ['deliveryStart', 'deliveryEnd', 'name'] }],
        transaction
      });

      const firstPackage = orderPackages[0]?.Package;

      emitAfterCommit(ORDER_EVENTS.PAID, {
        orderId: order.id,
        userId: order.userId,
        shopId: order.shopId,
        deliveryStart: firstPackage?.deliveryStart,
        deliveryEnd: firstPackage?.deliveryEnd,
      });
      break;
    }

    case 'delivered':
      emitAfterCommit(ORDER_EVENTS.DELIVERED, {
        orderId: order.id,
        userId: order.userId,
        shopId: order.shopId,
      });
      break;

    case 'confirmed':
      emitAfterCommit(ORDER_EVENTS.CONFIRMED, {
        orderId: order.id,
        userId: order.userId,
        shopId: order.shopId,
      });
      break;

    case 'released':
      emitAfterCommit(ORDER_EVENTS.RELEASED, {
        orderId: order.id,
        shopId: order.shopId,
      });
      break;
  }
}

// Bu fonksiyon artık YENİ ünite seçmiyor — createOrder sırasında zaten bu
// siparişe rezerve edilmiş (reservedByOrderId = order.id) üniteleri isSold=true'ya
// çeviriyor. reservedByOrderId filtresi race condition'ı önlüyor: başka bir
// sipariş bu üniteleri asla göremez, çünkü onlar zaten BU siparişe ait.
async function reserveStock(order, transaction) {
  const orderPackages = await OrderPackage.findAll({
    where: { orderId: order.id },
    transaction
  });

  for (const opkg of orderPackages) {
    const units = await PackageUnit.findAll({
      where: { packageId: opkg.packageId, reservedByOrderId: order.id, isSold: false },
      order: [['id', 'ASC']],
      limit: opkg.quantity,
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    // Buraya sadece RESERVATION_TTL_MINUTES süresi dolmuş ve ünitelerin başka
    // bir sipariş tarafından lazy-release ile devralınmış olması durumunda
    // düşülür (checkout, TTL'den daha uzun sürmüş). Ödeme muhtemelen zaten
    // alınmıştır — handleCheckoutCallback bu durumu (rollback + Sentry 'fatal')
    // zaten yakalıyor, manuel iade gerektirir.
    if (units.length < opkg.quantity) {
      throw new AppError(
        'Rezervasyon süresi dolduğu için stok onaylanamadı, manuel kontrol gerekiyor',
        409
      );
    }

    for (const unit of units) {
      unit.isSold = true;
      unit.reservedByOrderId = null;
      unit.reservedUntil = null;
      await unit.save({ transaction });
    }

    const remaining = await PackageUnit.count({
      where: { packageId: opkg.packageId, isSold: false },
      transaction
    });

    await Package.update(
      { quantity: remaining },
      { where: { id: opkg.packageId }, transaction }
    );
  }
}

/**
 * Stok rezervasyonu artık BURADA (sipariş oluşturma anında) yapılıyor, 'paid'
 * geçişinde değil — aksi halde iki müşteri son 1 adet stoklu pakete eşzamanlı
 * GERÇEK ödeme yapabilir, biri ödemeyi tamamlar ama 'paid' geçişi
 * 'Stok yetersiz' ile rollback olur ve parası çekilmiş bir müşteri elde kalır.
 *
 * "Lazy release": süresi geçmiş (reservedUntil < now) rezervasyonlar ayrı bir
 * cron olmadan, bir sonraki createOrder çağrısı tarafından otomatik olarak
 * müsait sayılır.
 */
async function createOrder(userId, data) {
  const { shopId, packages } = data;

  const t = await sequelize.transaction();
  try {
    let totalPrice = 0;
    const validatedPackages = [];

    for (const pkg of packages) {
      const dbPackage = await Package.findOne({
        where: { id: pkg.packageId, shopId },
        transaction: t
      });

      if (!dbPackage) throw new AppError(`Geçersiz paket: ${pkg.packageId}`, 400);

      await assertPackageProductsNotExpired(pkg.packageId, t);

      const now = new Date();

      const reservedUnits = await PackageUnit.findAll({
        where: {
          packageId: pkg.packageId,
          isSold: false,
          [Op.or]: [
            { reservedByOrderId: null },
            { reservedUntil: { [Op.lt]: now } },
          ],
        },
        order: [['id', 'ASC']],
        limit: pkg.quantity,
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (reservedUnits.length < pkg.quantity) throw new AppError('Yeterli stok yok', 409);

      const realPrice = dbPackage.price;
      totalPrice += realPrice * pkg.quantity;

      validatedPackages.push({
        packageId: pkg.packageId,
        quantity: pkg.quantity,
        price: realPrice,
        unitIds: reservedUnits.map(u => u.id),
      });
    }

    const deliveryToken = crypto.randomBytes(16).toString('hex');
    const platformFee = calculatePlatformFee(totalPrice);
    const paidPrice = parseFloat((totalPrice + platformFee).toFixed(2));

    const order = await Order.create(
      { userId, shopId, totalPrice, platformFee, paidPrice, status: 'pending', deliveryToken },
      { transaction: t }
    );

    const reservedUntil = new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);

    for (let i = 0; i < validatedPackages.length; i++) {
      const pkg = validatedPackages[i];
      await OrderPackage.create(
        {
          orderId: order.id,
          packageId: pkg.packageId,
          quantity: pkg.quantity,
          price: pkg.price,
          iyzicoItemId: `op-${order.id}-${i}`,
        },
        { transaction: t }
      );

      await PackageUnit.update(
        { reservedByOrderId: order.id, reservedUntil },
        { where: { id: pkg.unitIds }, transaction: t }
      );
    }

    await t.commit();
    return order;
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

/**
 * Bir pending order için Iyzico Checkout Form başlatır ve paymentPageUrl döner.
 * Frontend bunu WebView'de açar.
 *
 * Sepette her OrderPackage için bir kalem gönderilir (id = iyzicoItemId), böylece
 * callback'teki itemTransactions -> OrderPackage eşlemesi birebir çalışır ve her
 * kalemin kendi paymentTransactionId'si approve için saklanır. Platform komisyonu
 * kalemlere price/subMerchantPrice farkı olarak dağıtılır.
 */
async function initiateCheckout(userId, orderId, req) {
  const order = await Order.findOne({
    where: { id: orderId, userId },
    include: [{ model: OrderPackage, include: [{ model: Package }] }],
  });

  if (!order) throw new AppError('Sipariş bulunamadı veya erişim yetkiniz yok', 404);
  if (order.status !== 'pending') throw new AppError('Bu sipariş zaten işlenmiş', 409);
  if (!order.OrderPackages?.length) throw new AppError('Siparişte paket bulunamadı', 409);

  const user = await User.findByPk(userId, {
    attributes: ['id', 'email', 'firstName', 'lastName', 'address'],
  });
  const shop = await Shop.findByPk(order.shopId);

  if (!shop || !shop.subMerchantKey || shop.subMerchantStatus !== 'active') {
    throw new AppError('Bu market henüz ödeme almaya hazır değil', 409);
  }

  const baseItems = order.OrderPackages.map((op) => ({
    id: op.iyzicoItemId,
    name: op.Package?.name || 'Expiry Paketi',
    price: Number(op.price) * op.quantity, // mağazanın payı (satır toplamı)
    subMerchantKey: shop.subMerchantKey,
  }));

  const basketItems = iyzicoService.applyPlatformFee(baseItems, order.platformFee);

  const callbackUrl = `${process.env.BACKEND_URL}/api/orders/checkout/callback`;

  const result = await iyzicoService.initializeCheckoutForm(
    order, basketItems, user, req.ip, callbackUrl, shop
  );

  order.checkoutToken = result.token;
  await order.save();

  return { paymentPageUrl: result.paymentPageUrl, token: result.token };
}

/**
 * callbackUrl'e Iyzico POST ettiğinde (body içinde `token`) çağrılır.
 * Redirect'teki hiçbir parametreye güvenilmiyor — token ile Iyzico'dan
 * otoriter sonucu tekrar sorguluyoruz.
 */
async function handleCheckoutCallback(token) {
  const order = await Order.findOne({ where: { checkoutToken: token } });
  if (!order) throw new AppError('Geçersiz checkout token', 404);

  // Idempotency: aynı callback iki kez gelirse (Iyzico'nun retry mekanizması
  // olabilir) ikinci kez state geçişi denemeyelim.
  if (order.status !== 'pending') {
    return order;
  }

  const result = await iyzicoService.retrieveCheckoutForm(token);

  if (result.paymentStatus !== 'SUCCESS') {
    // Ödeme başarısız — order 'pending' kalır, kullanıcı tekrar deneyebilir.
    throw new AppError(result.errorMessage || 'Ödeme başarısız oldu', 402);
  }

  // Iyzico'dan dönen sonuç bu order'a ve beklenen sepet tutarına ait mi?
  // (alan response'ta varsa kontrol edilir). paidPrice ile KARŞILAŞTIRILMIYOR:
  // taksitli ödemede iyzico taksit farkını paidPrice'a ekler, meşru ödeme reddedilirdi.
  if (result.basketId && result.basketId !== `order-${order.id}`) {
    console.error(`[checkout] basketId uyuşmazlığı: order=${order.id}, iyzico=${result.basketId}`);
    Sentry.captureMessage(`checkout basketId uyuşmazlığı order=${order.id}`, 'error');
    throw new AppError('Ödeme sonucu siparişle eşleşmiyor', 409);
  }
  if (
    result.price != null &&
    Math.round(Number(result.price) * 100) !== Math.round(Number(order.paidPrice) * 100)
  ) {
    console.error(
      `[checkout] tutar uyuşmazlığı: order=${order.id}, beklenen=${order.paidPrice}, iyzico price=${result.price}`
    );
    Sentry.captureMessage(`checkout tutar uyuşmazlığı order=${order.id}`, 'error');
    throw new AppError('Ödeme tutarı sipariş tutarıyla uyuşmuyor', 409);
  }

  const t = await sequelize.transaction();
  try {
    const lockedOrder = await Order.findOne({
      where: { id: order.id },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (lockedOrder.status !== 'pending') {
      await t.commit();
      return lockedOrder;
    }

    // itemTransactions'daki paymentTransactionId'leri OrderPackage'lara yaz —
    // approve call bunları kullanacak.
    const orderPackages = await OrderPackage.findAll({
      where: { orderId: order.id },
      transaction: t,
    });

    for (const itemTx of result.itemTransactions || []) {
      const matching = orderPackages.find((op) => op.iyzicoItemId === itemTx.itemId);
      if (matching) {
        matching.iyzicoPaymentTransactionId = String(itemTx.paymentTransactionId);
        await matching.save({ transaction: t });
      }
    }

    // Ödeme ZATEN alındı: eşlenemeyen kalem için throw ETME (müşteriden para çekilip
    // sipariş oluşmamış olurdu). Görünür kıl; payment.handler approve öncesi
    // iyzico'dan eksik id'leri geri doldurmayı dener.
    const unmapped = orderPackages.filter((op) => !op.iyzicoPaymentTransactionId);
    if (unmapped.length) {
      const ids = unmapped.map((op) => op.id).join(', ');
      console.error(`[checkout] order ${order.id}: paymentTransactionId eşlenemeyen OrderPackage'lar: ${ids}`);
      Sentry.captureMessage(
        `checkout: paymentTransactionId eşlenemedi order=${order.id} orderPackages=${ids}`,
        'error'
      );
    }

    await changeStatusInternal(lockedOrder, 'paid', 'system', t);

    await t.commit();
    return lockedOrder;
  } catch (err) {
    await t.rollback();
    // Buraya gelindiyse ödeme alınmış ama order 'paid' yapılamamış demektir
    // (örn. rezervasyon süresi dolmuş). Müşteri parası çekilmiş durumda —
    // manuel müdahale/iade gerekir.
    Sentry.captureException(err, {
      level: 'fatal',
      extra: { orderId: order.id, token, note: 'ödeme alındı ama order paid yapılamadı' },
    });
    throw err;
  }
}

async function confirmByQRCode(marketUserId, deliveryToken) {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findOne({
      where: { deliveryToken, status: 'delivered' },
      lock: t.LOCK.UPDATE,
      include: [
        { model: User, attributes: ['id', 'firstName', 'lastName'] },
        {
          model: OrderPackage,
          include: [{ model: Package, attributes: ['id', 'name', 'deliveryEnd'] }]
        }
      ],
      transaction: t
    });

    if (!order) throw new AppError('Geçersiz veya süresi dolmuş QR kod', 404);

    const deliveryEnd = order.OrderPackages?.[0]?.Package?.deliveryEnd;
    if (deliveryEnd && new Date() > new Date(deliveryEnd)) {
      throw new AppError('Teslimat penceresi geçmiş, QR kod artık geçerli değil', 410);
    }

    const shop = await Shop.findOne({
      where: { id: order.shopId, ownerId: marketUserId },
      transaction: t
    });

    if (!shop) throw new AppError('Bu siparişe erişim yetkiniz yok', 403);

    await changeStatusInternal(order, 'confirmed', 'market', t);

    await t.commit();
    return order;
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function changeStatus(orderId, newStatus, actor = 'user', userId = null) {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findOne({ where: { id: orderId }, transaction: t });
    if (!order) throw new AppError('Sipariş bulunamadı', 404);

    if (actor === 'user' && order.userId !== userId) {
      throw new AppError('Bu siparişe erişim yetkiniz yok', 403);
    }

    if (actor === 'market') {
      const shop = await Shop.findOne({
        where: { id: order.shopId, ownerId: userId },
        transaction: t
      });

      if (!shop) {
        throw new AppError('Bu siparişe erişim yetkiniz yok', 403);
      }
    }

    await changeStatusInternal(order, newStatus, actor, t);

    await t.commit();
    return order;
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function changeStatusInternal(order, newStatus, actor, transaction) {
  const allowedActors = getTransitionRule(order.status, newStatus);

  if (!allowedActors) {
    throw new AppError(`Geçersiz durum geçişi: ${order.status} → ${newStatus}`, 409);
  }

  if (!allowedActors.includes(actor)) {
    throw new AppError(
      `Bu durum geçişini (${order.status} → ${newStatus}) gerçekleştirme yetkiniz yok`,
      403
    );
  }

  const now = new Date();
  order.status = newStatus;

  if (newStatus === 'paid') order.paidAt = now;
  if (newStatus === 'delivered') order.deliveredAt = now;
  if (newStatus === 'confirmed') order.confirmedAt = now;
  if (newStatus === 'released') order.releasedAt = now;

  await order.save({ transaction });
  await runSideEffects(order, newStatus, transaction);
}

async function listUserOrders(userId, statusGroup = 'active', page = 1, limit = 10) {
  const statuses = STATUS_GROUPS[statusGroup] || STATUS_GROUPS.active;

  if (statusGroup === 'past') {
    const offset = (page - 1) * limit;
    const { count, rows } = await Order.findAndCountAll({
      where: { userId, status: statuses },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    return { total: count, page, limit, orders: rows };
  }

  const orders = await Order.findAll({
    where: { userId, status: statuses },
    order: [['createdAt', 'DESC']],
  });
  return { total: orders.length, page: 1, limit: orders.length, orders };
}

async function listShopOrders(shopId, statusGroup = 'active', page = 1, limit = 10) {
  const statuses = STATUS_GROUPS[statusGroup] || STATUS_GROUPS.active;

  if (statusGroup === 'past') {
    const offset = (page - 1) * limit;
    const { count, rows } = await Order.findAndCountAll({
      where: { shopId, status: statuses },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    return { total: count, page, limit, orders: rows };
  }

  const orders = await Order.findAll({
    where: { shopId, status: statuses },
    order: [['createdAt', 'DESC']],
  });
  return { total: orders.length, page: 1, limit: orders.length, orders };
}

async function getShopByOwner(ownerId) {
  return await Shop.findOne({ where: { ownerId } });
}
async function simulatePayment(userId, orderId) {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findOne({
      where: { id: orderId, userId },
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (!order) throw new AppError('Sipariş bulunamadı veya erişim yetkiniz yok', 404);
    if (order.status !== 'pending') throw new AppError('Bu sipariş zaten işlenmiş', 409);

    await changeStatusInternal(order, 'paid', 'system', t);

    await t.commit();
    return { success: true, order };
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

module.exports = {
  createOrder,
  initiateCheckout,
  handleCheckoutCallback,
  confirmByQRCode,
  changeStatus,
  simulatePayment,
  listUserOrders,
  listShopOrders,
  getShopByOwner,
  reserveStock,
  assertPackageProductsNotExpired,
  calculatePlatformFee, // test edilebilirlik için export edildi
}; 