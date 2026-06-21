import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { fetchNotifications, markNotificationAsRead } from '../services/api';
import { COLORS } from '../theme/colors';

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
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetchNotifications();
      setNotifications(res.data || []);
    } catch {
      //
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

      if (user.role === 'admin') {
        switch (item.type) {
          case 'SHOP_APPLY':
          case 'SHOP_REAPPLY':
            navigation.navigate('AdminStack', { screen: 'ShopListScreen' });
            break;
          default:
            navigation.navigate('AdminStack');
        }
        return;
      }

switch (item.type) {
  case 'SHOP_APPROVED':
    navigation.navigate('ShopStack', { screen: 'ShopPanel' });
    break;
  case 'SHOP_REJECTED':
    navigation.navigate('ShopStack', { screen: 'ShopApply' });
    break;
  case 'RATE_SHOP':
    navigation.navigate('ShopStack', { screen: 'RateShopScreen', params: { shopId: item.targetId, orderId: item.orderId } });
    break;

  // Market'e gelen yeni sipariş bildirimi
  case 'ORDER_NEW':
    navigation.navigate('ShopStack', { screen: 'ShopOrders' });
    break;

  // Market'e gelen sipariş tamamlandı bildirimi
  case 'ORDER_CONFIRMED':
    navigation.navigate('ShopStack', { screen: 'ShopOrders' });
    break;

  // Market'e gelen ödeme aktarıldı bildirimi
  case 'ORDER_RELEASED':
    navigation.navigate('ShopStack', { screen: 'ShopOrders' });
    break;

  // Kullanıcıya gelen ödeme alındı bildirimi
  case 'ORDER_PAID':
    navigation.navigate('UserOrders');
    break;

  // Kullanıcıya gelen teslim aldıysanız onaylayın bildirimi
  case 'ORDER_DELIVERED':
    navigation.navigate('UserOrders');
    break;

  default:
    break;
}
    } 
    catch {
      //
    }
  };

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

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={notifications}
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
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.bg,
  },
  backButton: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appName: { fontSize: 22, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  headerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginBottom: 2 },

  hero: { paddingHorizontal: 20, marginBottom: 16 },
  heroName: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },

  loader: { marginTop: 40 },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  itemUnread: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  iconBox: {
    width: 46, height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  message: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, marginBottom: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date: { fontSize: 11, color: COLORS.textMuted },
  dot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
});

export default NotificationScreen;