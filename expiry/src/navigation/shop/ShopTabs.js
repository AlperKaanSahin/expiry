import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from '@expo/vector-icons/MaterialIcons';
import { COLORS } from '../../theme/colors';

import ShopProductsScreen from '../../screens/ShopProductsScreen';
import ShopPackagesScreen from '../../screens/ShopPackagesScreen';
import ShopOrdersScreen from '../../screens/ShopOrdersScreen';
import ShopProfileScreen from '../../screens/ShopProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  ShopProducts: 'shopping-basket',
  ShopPackages: 'inventory',
  ShopOrders: 'receipt-long',
  ShopProfile: 'store',
};

export default function ShopTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarIcon: ({ color, size }) => (
          <Icon name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="ShopProducts" component={ShopProductsScreen} options={{ title: 'Ürünler' }} />
      <Tab.Screen name="ShopPackages" component={ShopPackagesScreen} options={{ title: 'Paketler' }} />
      <Tab.Screen name="ShopOrders" component={ShopOrdersScreen} options={{ title: 'Siparişler' }} />
      <Tab.Screen name="ShopProfile" component={ShopProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}