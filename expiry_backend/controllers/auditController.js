const auditService = require('../services/auditService');
const catchAsync = require('../utils/catchAsync');

exports.getAuditLogs = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  // "SHOP_APPROVED,SHOP_REJECTED" gibi virgülle ayrılmış birden fazla değer gelebilir
  // (frontend'de gruplanmış filtreler için) — tek değer de aynı mekanizmayla çalışır.
  const action = req.query.action ? req.query.action.split(',').map(s => s.trim()) : null;

  const result = await auditService.getLogs(page, limit, action);

  res.json({
    total: result.count,
    page,
    limit,
    logs: result.rows
  });
});