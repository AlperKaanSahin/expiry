const eventBus = require('../events/eventBus');
const auditService = require('../services/auditService');
const SHOP_EVENTS = require('../events/shop.events');
const AUDIT_EVENTS = require('../events/audit.events');

eventBus.on(SHOP_EVENTS.STATUS_CHANGED, async (data) => {
  try {
    if (!data?.shop?.id) return;

    const actionMap = {
      active: 'SHOP_APPROVED',
      rejected: 'SHOP_REJECTED',
      inactive: 'SHOP_DEACTIVATED',
    };
    const action = actionMap[data.status?.to] || 'SHOP_STATUS_CHANGED';

    await auditService.log({
      actorId: data.actorId,
      action,
      entityType: 'SHOP',
      entityId: data.shop.id,
      description: `Shop status ${data.status.from} → ${data.status.to}`,
      metadata: {
        from: data.status.from,
        to: data.status.to,
        shop: data.shop,
        user: data.user,
      },
    });
  } catch (err) {
    console.error('AUDIT SHOP_STATUS_CHANGED ERROR:', err);
  }
});
eventBus.on(AUDIT_EVENTS.SHOP_CREATED, async (data) => {
  try {
    await auditService.log({
      actorId: data.actorId,
      action: data.reapplied ? 'SHOP_REAPPLIED' : 'SHOP_CREATED',
      entityType: 'SHOP',
      entityId: data.shop.id,
      description: data.reapplied
        ? `Shop reapplied: ${data.shop.name}`
        : `Shop created: ${data.shop.name}`,
      metadata: { shop: data.shop },
    });
  } catch (err) {
    console.error('AUDIT SHOP_CREATED ERROR:', err);
  }
});

eventBus.on(AUDIT_EVENTS.SHOP_UPDATED, async (data) => {
  try {
    await auditService.log({
      actorId: data.actorId,
      action: 'SHOP_UPDATED',
      entityType: 'SHOP',
      entityId: data.shop.id,
      description: 'Shop updated by admin',
      metadata: { oldShop: data.oldShop, newShop: data.newShop },
    });
  } catch (err) {
    console.error('AUDIT SHOP_UPDATED ERROR:', err);
  }
});

eventBus.on(AUDIT_EVENTS.SHOP_DELETED, async (data) => {
  try {
    await auditService.log({
      actorId: data.actorId,
      action: 'SHOP_DELETED',
      entityType: 'SHOP',
      entityId: data.shop.id,
      description: `Shop deleted: ${data.shop.name}`,
      metadata: { shop: data.shop },
    });
  } catch (err) {
    console.error('AUDIT SHOP_DELETED ERROR:', err);
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
      metadata: { user: data.user },
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
      metadata: { oldRole: data.oldRole, newRole: data.newRole, user: data.user },
    });
  } catch (err) {
    console.error('AUDIT ROLE_CHANGED ERROR:', err);
  }
});