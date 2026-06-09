const { AuditLog, User } = require('../models');

class AuditService {
  async log({
    actorId,
    action,
    entityType,
    entityId = null,
    description,
    metadata = null
  }) {
    // 👇 actor bilgisi snapshot al
    const actor = await User.findByPk(actorId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'role']
    });

    return await AuditLog.create({
      actorId,
      action,
      entityType,
      entityId,
      description,

      // 🔥 EN ÖNEMLİ EK
      actorSnapshot: actor ? {
        id: actor.id,
        name: `${actor.firstName} ${actor.lastName}`,
        email: actor.email,
        role: actor.role
      } : null,

      metadata
    });
  }
}

module.exports = new AuditService();