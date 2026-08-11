import { SHOP_OWNER_TYPES, ADMIN_TYPES, CUSTOMER_TYPES } from './notificationFilters';

// screen hedefleri, tab-level wrapper'ların (SCREEN_TO_TAB) anlayacağı isimlerle
const CUSTOMER_TYPE_SCREENS = {
  ORDER_PAID: 'UserOrders',
  ORDER_DELIVERED: 'UserOrders',
  RATE_SHOP: 'RateShopScreen',
};

export function resolveNotificationTarget(remoteMessage) {
  const data = remoteMessage.data || {};
  const { type, targetId, orderId } = data;

  if (type in ADMIN_TYPES) {
    return { workspace: 'admin', screen: ADMIN_TYPES[type], params: {} };
  }

  if (type in SHOP_OWNER_TYPES) {
    return { workspace: 'shop', screen: SHOP_OWNER_TYPES[type], params: targetId ? { orderId: targetId } : {} };
  }

  if (CUSTOMER_TYPES.has(type)) {
    const screen = CUSTOMER_TYPE_SCREENS[type];
    // RATE_SHOP: data.targetId aslında shopId (backend notify() çağrısına bak)
    const params = type === 'RATE_SHOP'
      ? { shopId: targetId, orderId }
      : {};
    return { workspace: 'user', screen, params };
  }

  return { workspace: 'user', screen: null, params: {} };
}