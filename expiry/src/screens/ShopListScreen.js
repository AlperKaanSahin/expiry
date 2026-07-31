import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import { fetchAllShopsAdmin, updateShopStatus, deleteShop } from '../services/api';
import { actionsByStatus, actionToStatus, actionLabels, actionColors } from '../constants/shopWorkflow';
import { COLORS } from '../theme/colors';
import Toast from 'react-native-toast-message';
import { showErrorToast } from '../utils/errorHandler';
import EmptyState from '../components/common/EmptyState';
import LoadingState from '../components/common/LoadingState';

const STATUS_CONFIG = {
  active:   { label: 'Aktif',      color: '#16A34A' },
  pending:  { label: 'Beklemede',  color: '#D97706' },
  inactive: { label: 'Pasif',      color: '#DC2626' },
  rejected: { label: 'Reddedildi', color: '#6B7280' },
};

const LIMIT = 10;

const ShopListScreen = () => {
  const [shops, setShops] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => { loadShops(); }, []);

  const loadShops = async (pageNumber = 1) => {
    setHasError(false);
    setLoading(true);
    try {
      const data = await fetchAllShopsAdmin(pageNumber, LIMIT);
      setShops(data.shops);
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      setHasError(true);
showErrorToast(err, Toast);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await updateShopStatus(id, status);
      loadShops(page);
    } catch (err) {
      showErrorToast(err, Toast);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Shop\'u Sil',
      'Bu shop\'u silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteShop(id);
              loadShops(page);
            } catch (err) {
              showErrorToast(err, Toast);
            }
          }
        }
      ]
    );
  };

  const maxPage = Math.ceil(total / LIMIT);

  const renderShop = ({ item }) => {
    const status = STATUS_CONFIG[item.status] || { label: item.status, color: COLORS.primary };
    const actions = actionsByStatus[item.status] || [];

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.shopName}>{item.name}</Text>
          <View style={[styles.badge, { backgroundColor: status.color + '18' }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Icon name="location-on" size={14} color={COLORS.textMuted} />
          <Text style={styles.infoText}>{item.address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="phone" size={14} color={COLORS.textMuted} />
          <Text style={styles.infoText}>{item.phone || 'Belirtilmemiş'}</Text>
        </View>
        {item.owner && (
          <View style={styles.infoRow}>
            <Icon name="person" size={14} color={COLORS.textMuted} />
            <Text style={styles.infoText}>
              {item.owner.firstName} {item.owner.lastName} (ID: {item.owner.id})
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action}
              style={[styles.actionButton, { backgroundColor: actionColors[action] + '18', borderColor: actionColors[action] + '40' }]}
              onPress={() => handleStatus(item.id, actionToStatus[action])}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionText, { color: actionColors[action] }]}>
                {actionLabels[action]}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
            activeOpacity={0.8}
          >
            <Icon name="delete" size={16} color={COLORS.red} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

if (loading) {
    return <LoadingState />;
}

if (hasError) {
    return (
        <ErrorState
            onRetry={() => loadShops(page)}
        />
    );
}

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appName}>expiry</Text>
          <View style={styles.dot} />
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Admin Panel</Text>
        <Text style={styles.heroName}>Shop Yönetimi</Text>
        <Text style={styles.heroSub}>Toplam {total} shop</Text>
      </View>


        <>
          <FlatList
            data={shops}
            keyExtractor={item => item.id.toString()}
            renderItem={renderShop}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
ListEmptyComponent={
  <EmptyState
    icon="store"
    title="Henüz shop bulunmuyor"
  />
}
          />

          {total > LIMIT && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                onPress={() => loadShops(page - 1)}
                disabled={page === 1}
              >
                <Icon name="chevron-left" size={20} color={page === 1 ? COLORS.textMuted : COLORS.white} />
              </TouchableOpacity>

              <Text style={styles.pageInfo}>{page} / {maxPage}</Text>

              <TouchableOpacity
                style={[styles.pageBtn, page >= maxPage && styles.pageBtnDisabled]}
                onPress={() => loadShops(page + 1)}
                disabled={page >= maxPage}
              >
                <Icon name="chevron-right" size={20} color={page >= maxPage ? COLORS.textMuted : COLORS.white} />
              </TouchableOpacity>
            </View>
          )}
        </>
      
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
  heroSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },

  loader: { marginTop: 40 },

  list: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },

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
  shopName: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  infoText: { fontSize: 13, color: COLORS.textMuted, flex: 1 },

  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionText: { fontSize: 12, fontWeight: '600' },
  deleteButton: {
    marginLeft: 'auto',
    padding: 6,
  },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },

  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pageBtn: {
    width: 40, height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageBtnDisabled: { backgroundColor: COLORS.border },
  pageInfo: { fontSize: 15, fontWeight: '700', color: COLORS.text },
});

export default ShopListScreen;