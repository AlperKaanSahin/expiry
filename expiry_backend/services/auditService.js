const { AuditLog, User } = require('../models');

class AuditService {
  async log({ actorId, action, entityType, entityId = null, description, metadata = null }) {
    const actor = await User.findByPk(actorId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'role']
    });

    return await AuditLog.create({
      actorId,
      action,
      entityType,
      entityId,
      description,
      actorSnapshot: actor ? {
        id: actor.id,
        name: `${actor.firstName} ${actor.lastName}`,
        email: actor.email,
        role: actor.role
      } : null,
      metadata
    });
  }

  async getLogs(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return await AuditLog.findAndCountAll({
      include: [{
        model: User,
        as: 'actor',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  }
}

module.exports = new AuditService();