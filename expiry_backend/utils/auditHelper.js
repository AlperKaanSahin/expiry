const auditService = require("../services/auditService");

const audit = {
  userCreated: ({ actorId, user }) =>
    auditService.log({
      actorId,
      action: "USER_CREATED",
      entityType: "USER",
      entityId: user.id,
      description: `User created: ${user.email}`,
      metadata: {
        email: user.email,
        role: user.role
      }
    }),

userDeleted: ({ actorId, user }) =>
  auditService.log({
    actorId,
    action: "USER_DELETED",
    entityType: "USER",
    entityId: user.id,
    description: `User deleted: ${user.email}`,
    metadata: {
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    }
  }),

roleChanged: ({ actorId, user, oldRole, newRole }) =>
  auditService.log({
    actorId,
    action: "USER_ROLE_CHANGED",
    entityType: "USER",
    entityId: user.id,
    description: `Role changed from ${oldRole} to ${newRole}`,
    metadata: {
      user: {
        id: user.id,
        email: user.email,
        role: newRole
      },
      oldRole,
      newRole
    }
  }),

marketCreated: ({ actorId, market }) =>
  auditService.log({
    actorId,
    action: "MARKET_CREATED",
    entityType: "MARKET",
    entityId: market.id,
    description: `Market created: ${market.name}`,
    metadata: {
      name: market.name,
      address: market.address,
      phone: market.phone
    }
  }),

marketUpdated: ({ actorId, oldMarket, newMarket }) =>
  auditService.log({
    actorId,
    action: "MARKET_UPDATED",
    entityType: "MARKET",
    entityId: newMarket.id,
    description: `Market updated: ${newMarket.name}`,
    metadata: {
      old: {
        name: oldMarket.name,
        address: oldMarket.address,
        phone: oldMarket.phone
      },
      new: {
        name: newMarket.name,
        address: newMarket.address,
        phone: newMarket.phone
      }
    }
  }),

marketDeleted: ({ actorId, market }) =>
  auditService.log({
    actorId,
    action: "MARKET_DELETED",
    entityType: "MARKET",
    entityId: market.id,
    description: `Market deleted: ${market.name}`,
    metadata: {
      name: market.name,
      address: market.address,
      phone: market.phone,
      ownerId: market.ownerId
    }
  }),
marketWithUserCreated: ({ actorId, user, market }) =>
  auditService.log({
    actorId,
    action: "MARKET_WITH_USER_CREATED",
    entityType: "MARKET",
    entityId: market.id,
    description: `Market + owner created: ${market.name}`,
    metadata: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      market: {
        id: market.id,
        name: market.name
      }
    }
  }),
  userAndMarketCreated: async ({ actorId, user, market }) => {
    await audit.userCreated({ actorId, user });
    await audit.marketCreated({ actorId, market });
  }
};

module.exports = audit;