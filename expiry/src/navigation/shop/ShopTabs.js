import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useWorkspace } from '../../context/WorkspaceContext';
import { COLORS } from '../../theme/colors';

import ShopHomeScreen from '../../screens/ShopHomeScreen';
import ShopProductsScreen from '../../screens/ShopProductsScreen';
import ShopPackagesScreen from '../../screens/ShopPackagesScreen';
import ShopOrdersScreen from '../../screens/ShopOrdersScreen';
import ShopProfileScreen from '../../screens/ShopProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  ShopHome: 'home',
  ShopProducts: 'shopping-basket',
  ShopPackages: 'inventory',
  ShopOrders: 'receipt-long',
  ShopProfile: 'store',
};

function ShopHomeWithIntent({ navigation, ...props }) {
  const { pendingIntent, consumeIntent } = useWorkspace();

  useEffect(() => {
    console.log('=== SHOPHOME PENDING INTENT ===', pendingIntent);
    if (pendingIntent && pendingIntent.screen !== 'ShopHome') {
      let attempts = 0;
      let timer;
      const tryNavigate = () => {
        const ready = navigation.getState() !== undefined;
        console.log('=== SHOP TRY NAVIGATE ===', { ready, attempts });
        if (ready) {
          navigation.navigate(pendingIntent.screen, pendingIntent.params);
          consumeIntent();
        } else if (attempts < 10) {
          attempts += 1;
          timer = setTimeout(tryNavigate, 50);
        }
      };
      tryNavigate();
      return () => clearTimeout(timer);
    }
  }, [pendingIntent]);

  return <ShopHomeScreen navigation={navigation} {...props} />;
}

export default function ShopTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          height: 68, paddingBottom: 10, paddingTop: 10,
          backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, size }) => (
          <Icon name={TAB_ICONS[route.name] || 'help-outline'} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="ShopHome" component={ShopHomeWithIntent} options={{ title: 'Ana Sayfa' }} />
      <Tab.Screen name="ShopProducts" component={ShopProductsScreen} options={{ title: 'Ürünler' }} />
      <Tab.Screen name="ShopPackages" component={ShopPackagesScreen} options={{ title: 'Paketler' }} />
      <Tab.Screen name="ShopOrders" component={ShopOrdersScreen} options={{ title: 'Siparişler' }} />
      <Tab.Screen name="ShopProfile" component={ShopProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}