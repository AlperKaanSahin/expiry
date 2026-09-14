const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');

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

  // `action` tekil bir string ya da birden fazla değeri kapsayan bir array olabilir
  // (frontend'de "Market Durumu" gibi gruplanmış filtreler birden fazla gerçek
  // action değerini tek bir chip altında topluyor).
  async getLogs(page = 1, limit = 20, action = null) {
    const offset = (page - 1) * limit;
    let where;
    if (Array.isArray(action) && action.length > 0) {
      where = { action: { [Op.in]: action } };
    } else if (typeof action === 'string' && action) {
      where = { action };
    }

    return await AuditLog.findAndCountAll({
      where,
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