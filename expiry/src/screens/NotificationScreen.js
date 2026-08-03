import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { fetchNotifications, markNotificationAsRead } from '../services/api';
import { COLORS } from '../theme/colors';
import Toast from 'react-native-toast-message';
import { showErrorToast } from '../utils/errorHandler';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import {
  SHOP_OWNER_TYPES,
  ADMIN_TYPES,
  CUSTOMER_TYPES,
  filterNotificationsByWorkspace,
} from '../utils/notificationFilters';

const TYPE_CONFIG = {
  SHOP_APPROVED:   { icon: 'check-circle',   color: '#16A34A' },
  SHOP_REJECTED:   { icon: 'cancel',         color: '#DC2626' },
  SHOP_APPLY:      { icon: 'store',          color: COLORS.primary },
  SHOP_REAPPLY:    { icon: 'store',          color: '#D97706' },
  RATE_SHOP:       { icon: 'star',           color: '#F59E0B' },
  ORDER_PAID:      { icon: 'payment',        color: '#16A34A' },
  ORDER_NEW:       { icon: 'shopping-bag',   color: '#2563EB' },
  ORDER_DELIVERED: { icon: 'local-shipping', color: '#7C3AED' },
  ORDER_CONFIRMED: { icon: 'check-circle',   color: '#16A34A' },
  ORDER_RELEASED:  { icon: 'account-balance',color: '#16A34A' },
};

const DEFAULT_TYPE = { icon: 'notifications', color: COLORS.primary };

const formatDate = (dateString) => {
  const diff = Date.now() - new Date(dateString);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Şimdi';
  if (minutes < 60) return `${minutes} dk önce`;
  if (hours < 24) return `${hours} sa önce`;
  if (days < 7) return `${days} gün önce`;
  return new Date(dateString).toLocaleDateString('tr-TR');
};

const NotificationScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { currentWorkspace, switchWorkspace } = useWorkspace();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    setLoading(true);
    setError(false);

    try {
      const res = await fetchNotifications();
      setNotifications(res.data || []);
    } catch (err) {
      setError(true);
      showErrorToast(err, Toast);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = async (item) => {
    try {
      await markNotificationAsRead(item.id);
      setNotifications(prev =>
        prev.map(n => n.id === item.id ? { ...n, isRead: true } : n)
      );

      // Bildirim tipine göre karar veriyoruz, kullanıcının rolüne göre değil —
      // aynı hesap hem "market sahibi" hem "müşteri" bildirimi alabiliyor.

      if (item.type in ADMIN_TYPES && user.role === 'admin') {
        switchWorkspace('admin', { screen: ADMIN_TYPES[item.type] });
        return;
      }

      if (item.type in SHOP_OWNER_TYPES && (user.role === 'market' || user.role === 'admin')) {
        switchWorkspace('shop', { screen: SHOP_OWNER_TYPES[item.type] });
        return;
      }

      if (CUSTOMER_TYPES.has(item.type)) {
        let intentParams;
        if (item.type === 'RATE_SHOP') {
          intentParams = {
            screen: 'RateShopScreen',
            params: { shopId: item.targetId, orderId: item.orderId },
          };
        } else {
          intentParams = { screen: 'UserOrders' };
        }
        switchWorkspace('user', { screen: 'OrdersTab', params: intentParams });
        return;
      }
    } catch (err) {
      showErrorToast(err, Toast);
    }
  };

  const filteredNotifications = filterNotificationsByWorkspace(notifications, currentWorkspace);

  const renderItem = ({ item }) => {
    const config = TYPE_CONFIG[item.type] || DEFAULT_TYPE;

    return (
      <TouchableOpacity
        style={[styles.item, !item.isRead && styles.itemUnread]}
        onPress={() => handlePress(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.iconBox, { backgroundColor: config.color + '18' }]}>
          <Icon name={config.icon} size={22} color={config.color} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.message}>{item.message}</Text>
          <View style={styles.meta}>
            <Icon name="access-time" size={11} color={COLORS.textMuted} />
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        {!item.isRead && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState text="Bildirimler yükleniyor..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState
          title="Bildirimler yüklenemedi"
          subtitle="Lütfen tekrar deneyin."
          onRetry={loadNotifications}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.appName}>expiry</Text>
          <View style={styles.headerDot} />
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* HERO */}
      <View style={styles.hero}>
        <Text style={styles.heroName}>Bildirimler</Text>
      </View>
<FlatList
  data={filteredNotifications}
  keyExtractor={item => item.id.toString()}
  renderItem={renderItem}
  contentContainerStyle={styles.list}
  showsVerticalScrollIndicator={false}
  ListEmptyComponent={
    <View style={styles.empty}>
      <Icon name="notifications-none" size={48} color={COLORS.border} />
      <Text style={styles.emptyText}>Henüz bildirim yok</Text>
    </View>
  }
/>
    </SafeAreaView>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  appName: { fontSize: 20, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  headerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginBottom: 2 },
  hero: { paddingHorizontal: 20, marginBottom: 12 },
  heroName: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemUnread: {
    borderColor: COLORS.primary + '40',
    backgroundColor: COLORS.primaryLight,
  },
  iconBox: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  message: { fontSize: 13, color: COLORS.textMuted, marginBottom: 6, lineHeight: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date: { fontSize: 11, color: COLORS.textMuted },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
});