import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { fetchShopOrders, markOrderDelivered } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPE_SCALE } from '../theme';
import { showErrorToast } from '../utils/errorHandler';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import ScreenHeader from '../components/common/ScreenHeader';
import Card from '../components/common/Card';

const STATUS_CONFIG = {
  pending:   { label: 'Bekliyor',          color: '#6B7280' },
  paid:      { label: 'Ödendi',            color: '#D97706' },
  delivered: { label: 'Müşteri Bekleniyor', color: '#2563EB' },
  confirmed: { label: 'Onaylandı',         color: '#16A34A' },
  released:  { label: 'Tamamlandı',        color: '#7C3AED' },
};

const TABS = [
  { key: 'active', label: 'Aktif' },
  { key: 'past',   label: 'Geçmiş' },
];
const LIMIT = 10;

const ShopOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('active');
  const [hasError, setHasError] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const loadOrders = async (tabValue = tab, pageNumber = 1, isRefresh = false) => {
    setHasError(false);
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchShopOrders(tabValue, pageNumber, LIMIT);
      setOrders(data.orders);
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      setHasError(true);
      showErrorToast(err, Toast);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadOrders('active', 1); }, []);

  const handleDeliver = async (orderId) => {
    try {
      await markOrderDelivered(orderId);
      loadOrders(tab, page);
    } catch (err) {
      showErrorToast(err, Toast);
    }
  };

  const renderOrder = ({ item }) => {
    const status = STATUS_CONFIG[item.status] || { label: item.status, color: COLORS.textMuted };

    return (
      <Card style={styles.card} shadow="sm">
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
                <Text style={styles.deliverText}>Hazır, Müşteri Gelsin</Text>
              </TouchableOpacity>
            </>
          )}

          {item.status === 'pending' && (
            <Text style={styles.infoText}>Ödeme bekleniyor</Text>
          )}

          {item.status === 'delivered' && (
            <View style={styles.waitingRow}>
              <Icon name="qr-code-scanner" size={16} color={COLORS.textMuted} />
              <Text style={styles.infoText}>Müşteri geldiğinde yukarıdan QR okutun</Text>
            </View>
          )}

          {item.status === 'confirmed' && (
            <Text style={styles.infoText}>Müşteri teslim aldı</Text>
          )}

          {item.status === 'released' && (
            <Text style={styles.infoText}>Sipariş tamamlandı</Text>
          )}
        </View>
      </Card>
    );
  };

  if (loading) {
    return <LoadingState />;
  }
  if (hasError) {
    return <ErrorState onRetry={() => loadOrders(tab, 1)} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <ScreenHeader title="Siparişler" />

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate('ScanQRScreen')}
        activeOpacity={0.8}
      >
        <Icon name="qr-code-scanner" size={20} color={COLORS.white} />
        <Text style={styles.scanButtonText}>Müşteri QR'ını Okut</Text>
      </TouchableOpacity>

      {/* SEKME SEÇİCİ */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabItem, tab === t.key && styles.tabItemActive]}
            onPress={() => {
              setTab(t.key);
              loadOrders(t.key, 1);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={orders}
        keyExtractor={item => item.id.toString()}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadOrders(tab, 1, true)}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt-long"
            title={tab === 'active' ? 'Aktif sipariş yok' : 'Geçmiş sipariş yok'}
          />
        }
      />

      {total > LIMIT && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
            onPress={() => loadOrders(tab, page - 1)}
            disabled={page === 1}
          >
            <Icon name="chevron-left" size={20} color={page === 1 ? COLORS.textMuted : COLORS.white} />
          </TouchableOpacity>

          <Text style={styles.pageInfo}>{page} / {Math.ceil(total / LIMIT)}</Text>

          <TouchableOpacity
            style={[styles.pageBtn, page >= Math.ceil(total / LIMIT) && styles.pageBtnDisabled]}
            onPress={() => loadOrders(tab, page + 1)}
            disabled={page >= Math.ceil(total / LIMIT)}
          >
            <Icon name="chevron-right" size={20} color={page >= Math.ceil(total / LIMIT) ? COLORS.textMuted : COLORS.white} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md + 1,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.xxl,
    marginBottom: SPACING.lg,
  },
  scanButtonText: { fontSize: 14, fontWeight: '700', color: COLORS.white },

  // SEKME SEÇİCİ — border yerine gölge, ShopProfileScreen'deki ile aynı dil
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xxl,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  tabItem: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  tabItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.primary },

  list: { paddingHorizontal: SPACING.xxl, paddingBottom: SPACING.xxxl + SPACING.md },

  // KART
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderId: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  badge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.sm },
  badgeText: { fontSize: 11, fontWeight: '700' },

  cardBody: { gap: SPACING.sm + 2 },
  infoText: { fontSize: 13, color: COLORS.textMuted },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs + 2 },

  deliverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  deliverText: { fontSize: 14, fontWeight: '700', color: COLORS.white },

  // SAYFALAMA
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.lg,
  },
  pageBtn: {
    width: 40, height: 40, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  pageBtnDisabled: { backgroundColor: COLORS.border },
  pageInfo: { fontSize: 14, fontWeight: '600', color: COLORS.text, minWidth: 50, textAlign: 'center' },
});

export default ShopOrdersScreen;