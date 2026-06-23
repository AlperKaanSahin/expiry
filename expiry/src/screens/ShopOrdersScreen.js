import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { fetchShopOrders, changeOrderStatus, markOrderDelivered } from '../services/api';
import { COLORS } from '../theme/colors';

const STATUS_CONFIG = {
  pending:   { label: 'Bekliyor',          color: '#6B7280' },
  paid:      { label: 'Ödendi',            color: '#D97706' },
  delivered: { label: 'Teslim Edildi',     color: '#2563EB' },
  confirmed: { label: 'Onaylandı',         color: '#16A34A' },
  released:  { label: 'Tamamlandı',        color: '#7C3AED' },
};

const TABS = [
  { key: 'active', label: 'Aktif' },
  { key: 'past',   label: 'Geçmiş' },
];

const ShopOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('active');

  const loadOrders = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchShopOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Hata', text2: err.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);


const handleDeliver = async (orderId) => {
  try {
    await markOrderDelivered(orderId);
    loadOrders();
  } catch (err) {
    Toast.show({ type: 'error', text1: 'Hata', text2: err.toString() });
  }
};

  const activeOrders = orders.filter(o => ['pending', 'paid', 'delivered'].includes(o.status));
  const pastOrders = orders.filter(o => ['confirmed', 'released'].includes(o.status));
  const filteredOrders = tab === 'active' ? activeOrders : pastOrders;

  const renderOrder = ({ item }) => {
    const status = STATUS_CONFIG[item.status] || { label: item.status, color: COLORS.textMuted };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Sipariş #{item.id}</Text>
          <View style={[styles.badge, { backgroundColor: status.color + '18' }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          {item.status === 'paid' && (
            <>
              <Text style={styles.infoText}>Sipariş hazırlanmayı bekliyor</Text>
              <TouchableOpacity
                style={styles.deliverButton}
                onPress={() => handleDeliver(item.id)}
                activeOpacity={0.8}
              >
                <Icon name="check-circle" size={18} color={COLORS.white} />
                <Text style={styles.deliverText}>Teslim Ettim</Text>
              </TouchableOpacity>
            </>
          )}

          {item.status === 'pending' && (
            <Text style={styles.infoText}>Ödeme bekleniyor</Text>
          )}

          {item.status === 'delivered' && (
            <Text style={styles.infoText}>Kullanıcı onayı bekleniyor</Text>
          )}

          {item.status === 'confirmed' && (
            <Text style={styles.infoText}>Kullanıcı teslim aldı</Text>
          )}

          {item.status === 'released' && (
            <Text style={styles.infoText}>Sipariş tamamlandı</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appName}>expiry</Text>
          <View style={styles.dot} />
        </View>
      </View>

      {/* HERO */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Shop Paneli</Text>
        <Text style={styles.heroName}>Siparişler</Text>
      </View>

      {/* TABS */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabItem, tab === t.key && styles.tabItemActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadOrders(true)}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="receipt-long" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>
                {tab === 'active' ? 'Aktif sipariş yok' : 'Geçmiş sipariş yok'}
              </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.bg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appName: { fontSize: 22, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginBottom: 2 },

  hero: { paddingHorizontal: 20, marginBottom: 16 },
  heroLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 2 },
  heroName: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },

  // TABS
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabItemActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.primary },

  loader: { marginTop: 40 },

  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },

  // CARD
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderId: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  cardBody: { gap: 10 },
  infoText: { fontSize: 13, color: COLORS.textMuted },

  deliverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  deliverText: { fontSize: 14, fontWeight: '700', color: COLORS.white },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
});

export default ShopOrdersScreen;