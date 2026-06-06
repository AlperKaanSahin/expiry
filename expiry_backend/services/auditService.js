const { AuditLog } = require('../models');

class AuditService {
  async log({
    actorId,
    action,
    entityType,
    entityId = null,
    description,
    metadata = null
  }) {
    return await AuditLog.create({
      actorId,
      action,
      entityType,
      entityId,
      description,
      metadata
    });
  }
}

module.exports = new AuditService();