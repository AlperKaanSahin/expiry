import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { fetchNotifications } from '../services/api';
import { COLORS } from '../theme/colors';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const loadUnread = async () => {
        try {
          const res = await fetchNotifications();
          const data = res.data || [];
          setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (err) {
          console.log('Bildirim sayısı yüklenemedi:', err.message);
        }
      };
      loadUnread();
    }, [])
  );

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

        {/* QUICK ACTIONS */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('BrowseTab')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIcon}>
              <Icon name="storefront" size={26} color={COLORS.primary} />
            </View>
            <Text style={styles.actionTitle}>Marketleri Keşfet</Text>
            <Text style={styles.actionSub}>Yakınındaki fırsatlara göz at</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('OrdersTab')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIcon}>
              <Icon name="receipt-long" size={26} color={COLORS.primary} />
            </View>
            <Text style={styles.actionTitle}>Siparişlerim</Text>
            <Text style={styles.actionSub}>Aktif ve geçmiş siparişlerin</Text>
          </TouchableOpacity>
        </View>
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

  quickActions: { gap: 12 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  actionSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});

export default HomeScreen;