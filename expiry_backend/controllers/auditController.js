const auditService = require('../services/auditService');
const catchAsync = require('../utils/catchAsync');
const { parsePagination } = require('../utils/pagination');

exports.getAuditLogs = catchAsync(async (req, res) => {
  const { page, limit } = parsePagination(req.query, { defaultLimit: 20 });
  // "SHOP_APPROVED,SHOP_REJECTED" gibi virgülle ayrılmış birden fazla değer gelebilir
  // (frontend'de gruplanmış filtreler için) — tek değer de aynı mekanizmayla çalışır.
  // Tekrarlı parametre (?action=a&action=b) dizi olarak gelir; .split o durumda hata verirdi.
  const action = typeof req.query.action === 'string' && req.query.action
    ? req.query.action.split(',').map(s => s.trim())
    : null;

  const result = await auditService.getLogs(page, limit, action);

  res.json({
    total: result.count,
    page,
    limit,
    logs: result.rows
  });
});