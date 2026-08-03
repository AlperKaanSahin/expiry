export const SHOP_OWNER_TYPES = {
  SHOP_APPROVED: 'ShopHome',
  SHOP_REJECTED: 'ShopHome',
  ORDER_NEW: 'ShopOrders',
  ORDER_CONFIRMED: 'ShopOrders',
  ORDER_RELEASED: 'ShopOrders',
};

export const ADMIN_TYPES = {
  SHOP_APPLY: 'ShopListScreen',
  SHOP_REAPPLY: 'ShopListScreen',
  SHOP_APPLICATION: 'ShopListScreen',
};

export const CUSTOMER_TYPES = new Set(['RATE_SHOP', 'ORDER_PAID', 'ORDER_DELIVERED']);

export const filterNotificationsByWorkspace = (notifications, workspace) => {
  return notifications.filter((item) => {
    const isShopType = item.type in SHOP_OWNER_TYPES;
    const isAdminType = item.type in ADMIN_TYPES;
    const isCustomerType = CUSTOMER_TYPES.has(item.type);

    if (workspace === 'shop') {
      return isShopType;
    }
    if (workspace === 'admin') {
      return isShopType || isAdminType;
    }
    return isCustomerType || (!isShopType && !isAdminType);
  });
};