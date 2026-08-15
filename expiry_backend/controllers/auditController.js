const auditService = require('../services/auditService');
const catchAsync = require('../utils/catchAsync');

exports.getAuditLogs = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const result = await auditService.getLogs(page, limit);

  res.json({
    total: result.count,
    page,
    limit,
    logs: result.rows
  });
});