const eventBus = require('../events/eventBus');
const auditService = require('../services/auditService');
const SHOP_EVENTS = require('../events/shop.events');
const AUDIT_EVENTS = require('../events/audit.events');


eventBus.on(SHOP_EVENTS.APPROVED, async (data) => {
  try {
    if (!data?.shop?.id) return;

    await auditService.log({
      actorId: data.actorId,
      action: 'SHOP_APPROVED',
      entityType: 'SHOP',
      entityId: data.shop.id,
      description: 'Shop approved by admin',
      metadata: {
        shop: data.shop
      }
    });

  } catch (err) {
    console.log("AUDIT HANDLER ERROR:", err);
  }
});

eventBus.on(SHOP_EVENTS.REJECTED, async (data) => {
  try {
    if (!data?.shop?.id) return;

    await auditService.log({
      actorId: data.actorId,
      action: 'SHOP_REJECTED',
      entityType: 'SHOP',
      entityId: data.shop.id,
      description: data.reason || 'Shop rejected',
      metadata: {
        reason: data.reason
      }
    });

  } catch (err) {
    console.log("AUDIT HANDLER ERROR:", err);
  }
});
eventBus.on(AUDIT_EVENTS.USER_DELETED, async (data) => {
    try {
        await auditService.log({
            actorId: data.actorId,
            action: 'USER_DELETED',
            entityType: 'USER',
            entityId: data.user.id,
            description: `User deleted: ${data.user.email}`,
            metadata: {
                user: data.user
            }
        });
    } catch (err) {
        console.error('AUDIT USER_DELETED ERROR:', err);
    }
});
eventBus.on(AUDIT_EVENTS.ROLE_CHANGED, async (data) => {
    try {
        await auditService.log({
            actorId: data.actorId,
            action: 'ROLE_CHANGED',
            entityType: 'USER',
            entityId: data.user.id,
            description: `Role changed ${data.oldRole} → ${data.newRole}`,
            metadata: {
                oldRole: data.oldRole,
                newRole: data.newRole,
                user: data.user
            }
        });
    } catch (err) {
        console.error('AUDIT ROLE_CHANGED ERROR:', err);
    }
});
eventBus.on(AUDIT_EVENTS.SHOP_STATUS_CHANGED, async (data) => {
    try {
        await auditService.log({
            actorId: data.actorId,
            action: 'SHOP_STATUS_CHANGED',
            entityType: 'SHOP',
            entityId: data.shop.id,
            description: `Shop status ${data.from} → ${data.to}`,
            metadata: {
                from: data.from,
                to: data.to,
                shop: {
                    id: data.shop.id,
                    name: data.shop.name
                }
            }
        });
    } catch (err) {
        console.error('AUDIT SHOP_STATUS_CHANGED ERROR:', err);
    }
});