import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { fetchNotifications } from '../services/api';
import { COLORS } from '../theme/colors';

const ROLE_ACTION = {
  user:   { title: 'Market Ol',   icon: 'store',                screen: 'ShopApply'  },
  market: { title: 'Shop Panel',  icon: 'dashboard',            screen: 'ShopStack'  },
  admin:  { title: 'Admin Panel', icon: 'admin-panel-settings', screen: 'AdminStack' },
};

const QUICK_ACTIONS = [
  { title: 'Marketler',  icon: 'storefront',   screen: 'Shops'      },
  { title: 'Siparişlerim', icon: 'receipt-long', screen: 'UserOrders' },
  { title: 'Profilim',  icon: 'person-outline', screen: 'UserProfile' },
];

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const loadUnread = async () => {
        try {
          const res = await fetchNotifications();
          const data = res.data || [];
          setUnreadCount(data.filter(n => !n.isRead).length);
        } catch {
          //
        }
      };
      loadUnread();
    }, [])
  );

  const roleAction = ROLE_ACTION[user?.role];
  const actions = roleAction ? [...QUICK_ACTIONS, roleAction] : QUICK_ACTIONS;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appName}>expiry</Text>
          <View style={styles.dot} />
        </View>
        <TouchableOpacity
          style={styles.notifButton}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.7}
        >
          <Icon name="notifications-none" size={22} color={COLORS.text} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Hoş geldin 👋</Text>
          <Text style={styles.heroName}>{user?.firstName || 'Kullanıcı'}</Text>
          <Text style={styles.heroSub}>Bugün ne yapmak istersin?</Text>
        </View>

        {/* ACTIONS */}
        <View style={styles.grid}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.screen}
              style={styles.card}
              onPress={() => navigation.navigate(action.screen)}
              activeOpacity={0.75}
            >
              <View style={styles.cardIcon}>
                <Icon name={action.icon} size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>{action.title}</Text>
              <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Icon name="logout" size={18} color={COLORS.red} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.bg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appName: { fontSize: 22, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginBottom: 2 },
  notifButton: {
    width: 42, height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badge: {
    position: 'absolute',
    top: 6, right: 6,
    backgroundColor: COLORS.red,
    borderRadius: 8,
    minWidth: 16, height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: COLORS.white, fontSize: 9, fontWeight: '800' },

  body: { paddingHorizontal: 20, paddingBottom: 40 },

  hero: { marginTop: 8, marginBottom: 28 },
  heroLabel: { fontSize: 14, color: COLORS.textMuted, marginBottom: 4 },
  heroName: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, marginBottom: 6 },
  heroSub: { fontSize: 14, color: COLORS.textMuted },

  grid: { gap: 10, marginBottom: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  cardIcon: {
    width: 46, height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: COLORS.redLight,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: COLORS.red },
});

export default HomeScreen;