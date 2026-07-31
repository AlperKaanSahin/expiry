import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from '@expo/vector-icons/MaterialIcons';

import HomeStack from './HomeStack';
import BrowseStack from './BrowseStack';
import OrdersStack from './OrdersStack';
import ProfileStack from './ProfileStack';

import { COLORS } from '../../theme/colors';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
<Tab.Navigator
  screenOptions={({ route }) => ({
    headerShown: false,

    tabBarActiveTintColor: COLORS.primary,
    tabBarInactiveTintColor: COLORS.textMuted,

    tabBarStyle: {
      height: 64,
      paddingBottom: 8,
      paddingTop: 8,
    },

    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '600',
    },

    tabBarHideOnKeyboard: true,

    tabBarIcon: ({ color, size }) => {
      let iconName;

      switch (route.name) {
        case 'HomeTab':
          iconName = 'home';
          break;

        case 'BrowseTab':
          iconName = 'store';
          break;

        case 'OrdersTab':
          iconName = 'receipt-long';
          break;

        case 'ProfileTab':
          iconName = 'person';
          break;

        default:
          iconName = 'help-outline';
      }

      return <Icon name={iconName} size={size} color={color} />;
    },
  })}
>

  <Tab.Screen
    name="HomeTab"
    component={HomeStack}
    options={{ title: 'Ana Sayfa' }}
  />

  <Tab.Screen
    name="BrowseTab"
    component={BrowseStack}
    options={{ title: 'Marketler' }}
  />

  <Tab.Screen
    name="OrdersTab"
    component={OrdersStack}
    options={{ title: 'Siparişler' }}
  />

  <Tab.Screen
    name="ProfileTab"
    component={ProfileStack}
    options={{ title: 'Profil' }}
  />
    </Tab.Navigator>
  );
}