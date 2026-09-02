export const CATEGORIES = [
  { key: 'BAKERY', label: 'Fırın', icon: 'bakery-dining' },
  { key: 'GROCERY', label: 'Manav', icon: 'local-florist' },
  { key: 'MARKET', label: 'Market', icon: 'storefront' },
  { key: 'PREPARED_MEALS', label: 'Hazır Yemek', icon: 'restaurant-menu' },
  { key: 'CAFE', label: 'Kafe', icon: 'local-cafe' },
  { key: 'DELI', label: 'Şarküteri', icon: 'lunch-dining' },
  { key: 'OTHER', label: 'Diğer', icon: 'category' },
];


export const CATEGORY_PLACEHOLDERS = {
  BAKERY: require('../assets/placeholders/bakery.jpg'),
  GROCERY: require('../assets/placeholders/grocery.jpg'),
  MARKET: require('../assets/placeholders/general_store.jpg'),
  PREPARED_MEALS: require('../assets/placeholders/prepared_meals.jpg'),
  CAFE: require('../assets/placeholders/cafe.jpg'),
  DELI: require('../assets/placeholders/deli.jpg'),
  OTHER: require('../assets/placeholders/other.jpg'),
};

export const getShopImageSource = (shop) => {
  if (shop.coverImageUrl) return { uri: shop.coverImageUrl };
  return CATEGORY_PLACEHOLDERS[shop.category] || CATEGORY_PLACEHOLDERS.OTHER;
};

export const getCategoryLabel = (key) => {
  return CATEGORIES.find((c) => c.key === key)?.label || 'Diğer';
};