import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useWorkspace } from '../../context/WorkspaceContext';
import { COLORS } from '../../theme/colors';

import AdminHomeScreen from '../../screens/AdminHomeScreen';
import UsersStack from './UsersStack';
import ShopListScreen from '../../screens/ShopListScreen';
import AuditLogsScreen from '../../screens/AuditLogsScreen';
import UserProfileScreen from '../../screens/UserProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  AdminHome: 'home',
  UsersTab: 'people',
  ShopsTab: 'store',
  ReportsTab: 'analytics',
  ProfileTab: 'person',
};

// Bildirimlerden gelen ekran isimlerini (eski ADMIN_ROUTE_MAP formatı) tab isimlerine çevir
const TARGET_TO_TAB = {
  ShopListScreen: 'ShopsTab',
  UserListScreen: 'UsersTab',
  AuditLogsScreen: 'ReportsTab',
};

function AdminHomeWithIntent({ navigation, ...props }) {
  const { pendingIntent, consumeIntent } = useWorkspace();

useEffect(() => {
  if (pendingIntent && pendingIntent.screen !== 'AdminHome') {
    const targetTab = TARGET_TO_TAB[pendingIntent.screen] || pendingIntent.screen;
    const timer = setTimeout(() => {
      navigation.navigate(targetTab, pendingIntent.params);
      consumeIntent();
    }, 0);
    return () => clearTimeout(timer);
  }
}, [pendingIntent]);

  return <AdminHomeScreen navigation={navigation} {...props} />;
}

export default function AdminTabs() {
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
      <Tab.Screen name="AdminHome" component={AdminHomeWithIntent} options={{ title: 'Ana Sayfa' }} />
      <Tab.Screen name="UsersTab" component={UsersStack} options={{ title: 'Kullanıcılar' }} />
      <Tab.Screen name="ShopsTab" component={ShopListScreen} options={{ title: 'Marketler' }} />
      <Tab.Screen name="ReportsTab" component={AuditLogsScreen} options={{ title: 'Raporlar' }} />
      <Tab.Screen name="ProfileTab" component={UserProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}