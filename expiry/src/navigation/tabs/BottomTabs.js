import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkspace } from '../../context/WorkspaceContext';

import HomeStack from './HomeStack';
import BrowseStack from './BrowseStack';
import OrdersStack from './OrdersStack';
import ProfileStack from './ProfileStack';

import { COLORS } from '../../theme/colors';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  HomeTab: { active: 'home', inactive: 'home' },
  BrowseTab: { active: 'storefront', inactive: 'storefront' },
  OrdersTab: { active: 'receipt-long', inactive: 'receipt-long' },
  ProfileTab: { active: 'person', inactive: 'person-outline' },
};

const HIDE_TAB_BAR_ROUTES = ['PaymentScreen'];

function OrdersStackWithIntent({ navigation, ...props }) {
  const { pendingIntent, consumeIntent } = useWorkspace();

  useEffect(() => {
    console.log('=== ORDERSSTACK PENDING INTENT ===', pendingIntent);
    if (pendingIntent && pendingIntent.screen) {
      let attempts = 0;
      let timer;
      const tryNavigate = () => {
        const ready = navigation.getState() !== undefined;
        console.log('=== TRY NAVIGATE ===', { ready, attempts });
        if (ready) {
          navigation.navigate('OrdersTab', {
            screen: pendingIntent.screen,
            params: pendingIntent.params,
          });
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

  return <OrdersStack navigation={navigation} {...props} />;
}

export default function BottomTabs() {
  const insets = useSafeAreaInsets();

  const defaultTabBarStyle = {
    height: 58 + Math.max(insets.bottom, 16),
paddingBottom: Math.max(insets.bottom, 16),
    paddingTop: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const focusedRouteName = getFocusedRouteNameFromRoute(route) ?? '';

        return {
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,

          tabBarStyle: HIDE_TAB_BAR_ROUTES.includes(focusedRouteName)
            ? { display: 'none' }
            : defaultTabBarStyle,

          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginTop: 2,
          },

          tabBarHideOnKeyboard: true,

          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name] || { active: 'help-outline', inactive: 'help-outline' };
            return (
              <View style={focused ? styles.activeIconWrap : null}>
                <Icon
                  name={focused ? icons.active : icons.inactive}
                  size={focused ? size - 1 : size - 2}
                  color={color}
                />
              </View>
            );
          },
        };
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Ana Sayfa' }} />
      <Tab.Screen name="BrowseTab" component={BrowseStack} options={{ title: 'Marketler' }} />
      <Tab.Screen name="OrdersTab" component={OrdersStackWithIntent} options={{ title: 'Siparişler' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  activeIconWrap: {
    backgroundColor: COLORS.primaryLight,
    width: 40,
    height: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});