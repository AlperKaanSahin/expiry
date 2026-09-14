const { QueryTypes } = require('sequelize');
const { Shop, sequelize } = require('../models');
const AppError = require('../utils/AppError');

// Bir siparişin "gerçekleşmiş satış" sayılması için ödemesinin tamamlanmış olması
// gerekir — 'pending' henüz ödenmemiş, ciro/sipariş sayısına dahil edilmez.
const COMPLETED_STATUSES = ['paid', 'delivered', 'confirmed', 'released'];

const getShopByOwner = async (userId) => {
  const shop = await Shop.findOne({ where: { ownerId: userId } });
  if (!shop) throw new AppError('Market bulunamadı', 404);
  return shop;
};

// SKT'ye göre kalan gün sayısından kullanıcıya gösterilecek etiketi üretir.
// Mevzuata göre SKT'nin GEÇTİĞİ gün satış yasak, SKT bugünse hâlâ satılabilir —
// bu yüzden 0 gün "Bugün son gün" (hâlâ satılabilir, en acil), negatif gün ise
// zaten satılamaz durumda olup listeden kaldırılması gereken bir uyarı.
const buildExpiryLabel = (daysLeft) => {
  if (daysLeft < 0) return 'SKT geçmiş — satıştan kaldırın';
  if (daysLeft === 0) return 'Bugün son gün';
  if (daysLeft === 1) return 'Yarın son gün';
  return `${daysLeft} gün kaldı`;
};

exports.getShopSummary = async (userId) => {
  const shop = await getShopByOwner(userId);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // bugün dahil son 7 gün

  const statusPlaceholders = COMPLETED_STATUSES.map((_, i) => `:status${i}`).join(', ');
  const statusReplacements = COMPLETED_STATUSES.reduce((acc, s, i) => {
    acc[`status${i}`] = s;
    return acc;
  }, {});

  // --- Bugünkü sipariş sayısı ve ciro ---
  const [todayRow] = await sequelize.query(`
    SELECT COUNT(*) AS orderCount, COALESCE(SUM(totalPrice), 0) AS revenue
    FROM \`orders\`
    WHERE shopId = :shopId
      AND status IN (${statusPlaceholders})
      AND createdAt >= :todayStart
  `, {
    replacements: { shopId: shop.id, todayStart, ...statusReplacements },
    type: QueryTypes.SELECT,
  });

  // --- Aktif paket sayısı (hâlâ satılmamış en az 1 ünitesi olan paketler) ---
  const [activeRow] = await sequelize.query(`
    SELECT COUNT(DISTINCT pu.packageId) AS activeCount
    FROM \`PackageUnits\` pu
    INNER JOIN \`Packages\` p ON p.id = pu.packageId
    WHERE p.shopId = :shopId AND pu.isSold = false
  `, {
    replacements: { shopId: shop.id },
    type: QueryTypes.SELECT,
  });

  // --- Son kullanma tarihine göre kritik paketler ---
  // Her aktif paketin İÇİNDEKİ ürünlerin en erken SKT'si (en kritik ürün paketin
  // tamamını satılamaz hale getirir). Yalnızca SKT'si bilinen ürünleri olan
  // paketler değerlendiriliyor.
  const expiringRows = await sequelize.query(`
    SELECT
      p.id AS packageId,
      p.name AS packageName,
      MIN(sp.expiryDate) AS minExpiryDate,
      COUNT(DISTINCT pu.id) AS remainingUnits
    FROM \`Packages\` p
    INNER JOIN \`package_products\` pp ON pp.packageId = p.id
    INNER JOIN \`shop_products\` sp ON sp.id = pp.shopProductId
    INNER JOIN \`PackageUnits\` pu ON pu.packageId = p.id AND pu.isSold = false
    WHERE p.shopId = :shopId AND sp.expiryDate IS NOT NULL
    GROUP BY p.id, p.name
    HAVING COUNT(DISTINCT pu.id) > 0
    ORDER BY minExpiryDate ASC
    LIMIT 10
  `, {
    replacements: { shopId: shop.id },
    type: QueryTypes.SELECT,
  });

  // Bugünden 1 gün sonrasına (yarına) kadar olanları göster; ötesi "yakında" sayılmıyor.
  const tomorrowEnd = new Date(todayStart);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 2);

  const expiringSoon = expiringRows
    .filter(r => new Date(r.minExpiryDate) < tomorrowEnd)
    .map(r => {
      const expiryDay = new Date(r.minExpiryDate);
      expiryDay.setHours(0, 0, 0, 0);
      const daysLeft = Math.round((expiryDay - todayStart) / 86400000);

      return {
        packageId: r.packageId,
        name: r.packageName,
        remainingUnits: Number(r.remainingUnits),
        expiryDate: r.minExpiryDate,
        daysLeft,
        label: buildExpiryLabel(daysLeft),
      };
    });

  // --- Son 7 gün günlük ciro trendi ---
  const trendRows = await sequelize.query(`
    SELECT DATE(createdAt) AS date, COALESCE(SUM(totalPrice), 0) AS revenue
    FROM \`orders\`
    WHERE shopId = :shopId
      AND status IN (${statusPlaceholders})
      AND createdAt >= :sevenDaysAgo
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
  `, {
    replacements: { shopId: shop.id, sevenDaysAgo, ...statusReplacements },
    type: QueryTypes.SELECT,
  });

  // MySQL'in DATE() ile döndürdüğü günler arasında sipariş olmayan günler
  // hiç satır olarak gelmiyor — sparkline'ın kopuk görünmemesi için 7 günün
  // tamamını 0 ciro ile dolduruyoruz.
  const trendMap = new Map(trendRows.map(r => [String(r.date), Number(r.revenue)]));
  const weeklyTrend = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    weeklyTrend.push({ date: key, revenue: trendMap.get(key) || 0 });
  }

  return {
    today: {
      orderCount: Number(todayRow?.orderCount || 0),
      revenue: Number(todayRow?.revenue || 0),
      activePackages: Number(activeRow?.activeCount || 0),
    },
    expiringSoon,
    weeklyTrend,
  };
};