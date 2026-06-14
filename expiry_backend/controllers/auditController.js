const auditService = require('../services/auditService');

exports.getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await auditService.getLogs(page, limit);

    res.json({
      total: result.count,
      page,
      limit,
      logs: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};