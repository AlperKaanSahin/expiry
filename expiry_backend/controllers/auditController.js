const { AuditLog, User } = require('../models');

exports.getAuditLogs = async (req, res) => {
  try {
    console.log("USER:", req.user);

    const logs = await AuditLog.findAll();

    console.log("LOGS COUNT:", logs.length);

    return res.json(logs);
  } catch (err) {
    console.log("AUDIT ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};