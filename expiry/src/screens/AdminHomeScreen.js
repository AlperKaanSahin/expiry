import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { fetchNotifications, fetchAdminDashboardSummary } from '../services/api';
import { COLORS } from '../theme/colors';
import { filterNotificationsByWorkspace } from '../utils/notificationFilters';

const TYPE_ICONS = {
  SHOP_APPLY: { icon: 'store', color: COLORS.primary },
  SHOP_REAPPLY: { icon: 'store', color: '#D97706' },
};
const DEFAULT_TYPE_ICON = { icon: 'notifications', color: COLORS.primary };

const formatRelative = (dateString) => {
  const diff = Date.now() - new Date(dateString);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return 'Şimdi';
  if (minutes < 60) return `${minutes} dk önce`;
  if (hours < 24) return `${hours} sa önce`;
  return `${days} gün önce`;
};

const ADMIN_QUICK_ACTIONS = [
  { title: 'Kullanıcılar', icon: 'people', tab: 'UsersTab' },
  { title: 'Marketler', icon: 'store', tab: 'ShopsTab' },
  { title: 'Raporlar', icon: 'analytics', tab: 'ReportsTab' },
];

const AdminHomeScreen = ({ navigation }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadNotifications = async () => {
        try {
          const res = await fetchNotifications();
          const data = res.data || [];
          const adminNotifications = filterNotificationsByWorkspace(data, 'admin');
          setUnreadCount(adminNotifications.filter(n => !n.isRead).length);
          setRecentNotifications(adminNotifications.slice(0, 3));
        } catch (err) {
          console.log('Bildirimler yüklenemedi:', err.message);
        }
      };

      const loadSummary = async () => {
        try {
          setSummaryLoading(true);
          const data = await fetchAdminDashboardSummary();
          setSummary(data);
        } catch (err) {
          console.log('Dashboard özeti yüklenemedi:', err.message);
        } finally {
          setSummaryLoading(false);
        }
      };

      loadNotifications();
      loadSummary();
    }, [])
  );

  const maxWeeklyRevenue = summary?.weeklyTrend
    ? Math.max(...summary.weeklyTrend.map(d => d.revenue), 1)
    : 1;

  const pending = summary?.pendingActions;
  const hasPendingActions = pending && (pending.pendingShopApplications > 0 || pending.pendingPhotoApprovals > 0);

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
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Icon name="shield" size={14} color={COLORS.primary} />
            <Text style={styles.heroBadgeText}>Yönetici</Text>
          </View>
          <Text style={styles.heroName}>Yönetim Paneli</Text>
        </View>

        {/* BUGÜN ÖZETİ */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            {summaryLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.statValue}>{summary?.today?.newUsers ?? 0}</Text>
            )}
            <Text style={styles.statLabel}>Yeni Kayıt</Text>
          </View>
          <View style={styles.statCard}>
            {summaryLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.statValue}>{summary?.today?.orderCount ?? 0}</Text>
            )}
            <Text style={styles.statLabel}>Bugünkü Sipariş</Text>
          </View>
          <View style={styles.statCard}>
            {summaryLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.statValue}>{Math.round(summary?.today?.revenue ?? 0)}₺</Text>
            )}
            <Text style={styles.statLabel}>Platform Cirosu</Text>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.quickActions}>
          {ADMIN_QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.tab}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.tab)}
              activeOpacity={0.8}
            >
              <View style={styles.actionIcon}>
                <Icon name={action.icon} size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* DİKKAT GEREKİYOR — bekleyen market başvuruları / fotoğraf onayları */}
        {hasPendingActions && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>DİKKAT GEREKİYOR</Text>
            </View>
            <View style={styles.list}>
              {pending.pendingShopApplications > 0 && (
                <TouchableOpacity
                  style={styles.notifRow}
                  onPress={() => navigation.navigate('ShopsTab')}
                  activeOpacity={0.6}
                >
                  <View style={[styles.notifIcon, { backgroundColor: '#D9770618' }]}>
                    <Icon name="store" size={16} color="#D97706" />
                  </View>
                  <View style={styles.notifText}>
                    <Text style={styles.notifTitle}>Onay Bekleyen Market Başvurusu</Text>
                    <Text style={[styles.notifTime, { color: '#D97706', fontWeight: '700' }]}>
                      {pending.pendingShopApplications} başvuru bekliyor
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
              {pending.pendingShopApplications > 0 && pending.pendingPhotoApprovals > 0 && (
                <View style={styles.divider} />
              )}
              {pending.pendingPhotoApprovals > 0 && (
                <TouchableOpacity
                  style={styles.notifRow}
                  onPress={() => navigation.navigate('ShopsTab')}
                  activeOpacity={0.6}
                >
                  <View style={[styles.notifIcon, { backgroundColor: '#D9770618' }]}>
                    <Icon name="photo-camera" size={16} color="#D97706" />
                  </View>
                  <View style={styles.notifText}>
                    <Text style={styles.notifTitle}>Onay Bekleyen Kapak Fotoğrafı</Text>
                    <Text style={[styles.notifTime, { color: '#D97706', fontWeight: '700' }]}>
                      {pending.pendingPhotoApprovals} fotoğraf bekliyor
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* SON 7 GÜN — PLATFORM CİROSU */}
        {summary?.weeklyTrend && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>SON 7 GÜN — PLATFORM CİROSU</Text>
            </View>
            <View style={styles.trendCard}>
              <View style={styles.trendBars}>
                {summary.weeklyTrend.map((day) => {
                  const barHeight = Math.max((day.revenue / maxWeeklyRevenue) * 56, 4);
                  const dayLabel = new Date(day.date).toLocaleDateString('tr-TR', { weekday: 'short' });
                  return (
                    <View key={day.date} style={styles.trendBarColumn}>
                      <View style={[styles.trendBar, { height: barHeight }]} />
                      <Text style={styles.trendBarLabel}>{dayLabel}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* RECENT NOTIFICATIONS */}
        {recentNotifications.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>SON BİLDİRİMLER</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                <Text style={styles.sectionLink}>Tümünü Gör</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.list}>
              {recentNotifications.map((item, index) => {
                const config = TYPE_ICONS[item.type] || DEFAULT_TYPE_ICON;
                return (
                  <React.Fragment key={item.id}>
                    <TouchableOpacity
                      style={styles.notifRow}
                      onPress={() => navigation.navigate('Notifications')}
                      activeOpacity={0.6}
                    >
                      <View style={[styles.notifIcon, { backgroundColor: config.color + '18' }]}>
                        <Icon name={config.icon} size={16} color={config.color} />
                      </View>
                      <View style={styles.notifText}>
                        <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.notifTime}>{formatRelative(item.createdAt)}</Text>
                      </View>
                      {!item.isRead && <View style={styles.unreadDot} />}
                    </TouchableOpacity>
                    {index < recentNotifications.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.bg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appName: { fontSize: 22, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginBottom: 2 },
  notifButton: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  badge: {
    position: 'absolute', top: 6, right: 6, backgroundColor: COLORS.red, borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: COLORS.white, fontSize: 9, fontWeight: '800' },
  body: { paddingHorizontal: 20, paddingBottom: 110 },
  hero: { marginTop: 8, marginBottom: 20 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4,
    backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, marginBottom: 10,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  heroName: { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },

  // BUGÜN ÖZETİ
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: COLORS.white, borderRadius: 16, paddingVertical: 16,
    borderWidth: 1, borderColor: COLORS.border, minHeight: 72,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center' },

  quickActions: { flexDirection: 'row', gap: 10 },
  actionCard: {
    flex: 1, alignItems: 'center', gap: 8, backgroundColor: COLORS.white,
    borderRadius: 16, paddingVertical: 18, borderWidth: 1, borderColor: COLORS.border,
  },
  actionIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  actionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 28, marginBottom: 10,
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.6 },
  sectionLink: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  list: {
    backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1,
    borderColor: COLORS.border, overflow: 'hidden',
  },
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 12 },
  notifIcon: { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  notifText: { flex: 1 },
  notifTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  notifTime: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  unreadDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.primary },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 58 },

  // HAFTALIK TREND
  trendCard: {
    backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1,
    borderColor: COLORS.border, paddingVertical: 16, paddingHorizontal: 12,
  },
  trendBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 76 },
  trendBarColumn: { alignItems: 'center', gap: 6, flex: 1 },
  trendBar: { width: 14, borderRadius: 5, backgroundColor: COLORS.primary },
  trendBarLabel: { fontSize: 10, color: COLORS.textMuted, textTransform: 'capitalize' },
});

export default AdminHomeScreen;