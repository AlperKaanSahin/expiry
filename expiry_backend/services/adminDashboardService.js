const { QueryTypes, Op } = require('sequelize');
const { User, Shop, sequelize } = require('../models');

// Bir siparişin "gerçekleşmiş satış" sayılması için ödemesinin tamamlanmış olması
// gerekir — shopDashboardService ile aynı kural, sadece shopId filtresi olmadan
// (platform geneli).
const COMPLETED_STATUSES = ['paid', 'delivered', 'confirmed', 'released'];

exports.getAdminSummary = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // bugün dahil son 7 gün

  const statusPlaceholders = COMPLETED_STATUSES.map((_, i) => `:status${i}`).join(', ');
  const statusReplacements = COMPLETED_STATUSES.reduce((acc, s, i) => {
    acc[`status${i}`] = s;
    return acc;
  }, {});

  const [newUsersCount, pendingShopsCount, pendingPhotosCount, todayOrderRows] = await Promise.all([
    User.count({ where: { createdAt: { [Op.gte]: todayStart } } }),
    Shop.count({ where: { status: 'pending' } }),
    Shop.count({ where: { coverImagePendingUrl: { [Op.ne]: null } } }),
    sequelize.query(`
      SELECT COUNT(*) AS orderCount, COALESCE(SUM(totalPrice), 0) AS revenue
      FROM \`orders\`
      WHERE status IN (${statusPlaceholders}) AND createdAt >= :todayStart
    `, {
      replacements: { todayStart, ...statusReplacements },
      type: QueryTypes.SELECT,
    }),
  ]);

  const todayOrderRow = todayOrderRows[0];

  // --- Son 7 gün, platform geneli günlük ciro ---
  const trendRows = await sequelize.query(`
    SELECT DATE(createdAt) AS date, COALESCE(SUM(totalPrice), 0) AS revenue
    FROM \`orders\`
    WHERE status IN (${statusPlaceholders}) AND createdAt >= :sevenDaysAgo
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
  `, {
    replacements: { sevenDaysAgo, ...statusReplacements },
    type: QueryTypes.SELECT,
  });

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
      newUsers: newUsersCount,
      orderCount: Number(todayOrderRow?.orderCount || 0),
      revenue: Number(todayOrderRow?.revenue || 0),
    },
    pendingActions: {
      pendingShopApplications: pendingShopsCount,
      pendingPhotoApprovals: pendingPhotosCount,
    },
    weeklyTrend,
  };
};