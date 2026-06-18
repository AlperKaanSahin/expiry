import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useIsFocused } from '@react-navigation/native';
import { fetchShopPackages, canRateShop } from '../services/api';
import { COLORS } from '../theme/colors';

const formatDelivery = (start, end) => {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  const time = (d) => d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return `${s.toLocaleDateString('tr-TR')} ${time(s)} - ${time(e)}`;
};

const ShopDetailScreen = ({ route, navigation }) => {
  const { shopId, shopName, ratingAverage, ratingCount } = route.params;
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [canRate, setCanRate] = useState(false);
  const isFocused = useIsFocused();

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await fetchShopPackages(shopId);
      setPackages(data);

      const rateRes = await canRateShop(shopId);
      setCanRate(rateRes.canRate);
    } catch {
      //
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused, shopId]);

  const filteredPackages = packages
    .filter(pkg => Number(pkg.quantity) > 0)
    .filter(pkg =>
      (pkg.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pkg.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

  const renderPackage = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PackageDetail', { packageId: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.packageName}>{item.name}</Text>
          <Text style={styles.packagePrice}>
            {item.price ?? item.totalPrice} ₺
          </Text>
        </View>

        {item.description ? (
          <Text style={styles.packageDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}

        {item.products?.length > 0 && (
          <Text style={styles.productList} numberOfLines={1}>
            {item.products.map(p => `${p.name} (${p.quantity})`).join(', ')}
          </Text>
        )}

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Icon name="inventory-2" size={13} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{item.quantity} kutu kaldı</Text>
          </View>
          {formatDelivery(item.deliveryStart, item.deliveryEnd) && (
            <View style={styles.metaItem}>
              <Icon name="schedule" size={13} color={COLORS.textMuted} />
              <Text style={styles.metaText}>
                {formatDelivery(item.deliveryStart, item.deliveryEnd)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );

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
          <View style={styles.dot} />
        </View>
        {canRate ? (
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => navigation.navigate('RateShopScreen', { shopId })}
            activeOpacity={0.8}
          >
            <Icon name="star" size={16} color={COLORS.primary} />
            <Text style={styles.rateButtonText}>Puan Ver</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {/* HERO */}
      <View style={styles.hero}>
        <Text style={styles.heroName}>{shopName}</Text>
        <View style={styles.ratingRow}>
          <Icon name="star" size={16} color="#F59E0B" />
          <Text style={styles.ratingText}>
            {ratingAverage && ratingAverage > 0
              ? `${ratingAverage.toFixed(1)} (${ratingCount || 0} oy)`
              : 'Henüz değerlendirilmedi'}
          </Text>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Icon name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Paket ara..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredPackages}
          keyExtractor={item => item.id.toString()}
          renderItem={renderPackage}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="inventory-2" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>Paket bulunamadı</Text>
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
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginBottom: 2 },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  rateButtonText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  hero: { paddingHorizontal: 20, marginBottom: 16 },
  heroName: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },

  loader: { marginTop: 40 },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },

  // CARD
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  cardBody: { flex: 1, gap: 6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  packageName: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  packagePrice: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  packageDesc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  productList: { fontSize: 12, color: COLORS.textMuted },
  cardMeta: { gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.textMuted },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
});

export default ShopDetailScreen;