import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StatusBar,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useIsFocused } from '@react-navigation/native';
import { fetchShopById, fetchShopPackages, canRateShop } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPE_SCALE } from '../theme';
import LoadingState from '../components/common/LoadingState';
import Toast from 'react-native-toast-message';
import { showErrorToast } from '../utils/errorHandler';
import EmptyState from '../components/common/EmptyState';
import Card from '../components/common/Card';

const CATEGORY_LABELS = {
  BAKERY: 'Fırın',
  GROCERY: 'Manav',
  MARKET: 'Market',
  PREPARED_MEALS: 'Hazır Yemek',
  CAFE: 'Kafe',
  DELI: 'Şarküteri',
  OTHER: 'Diğer',
};

const formatDelivery = (start, end) => {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  const time = (d) => d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return `${s.toLocaleDateString('tr-TR')} ${time(s)} - ${time(e)}`;
};

const ShopDetailScreen = ({ route, navigation }) => {
  const { shopId, shopName, ratingAverage, ratingCount } = route.params;

  const [shop, setShop] = useState({
    name: shopName, ratingAverage, ratingCount,
    address: null, phone: null, category: null, coverImageUrl: null,
  });
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [canRate, setCanRate] = useState(false);
  const isFocused = useIsFocused();

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [shopData, packagesData, rateRes] = await Promise.all([
        fetchShopById(shopId).catch(() => null),
        fetchShopPackages(shopId),
        canRateShop(shopId),
      ]);

      if (shopData) setShop(shopData);
      setPackages(packagesData);
      setCanRate(rateRes.canRate);
    } catch (err) {
      showErrorToast(err, Toast);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
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

  const handleCall = () => {
    if (shop.phone) Linking.openURL(`tel:${shop.phone}`);
  };

  const handleDirections = () => {
    if (!shop.address) return;
    const query = encodeURIComponent(shop.address);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const renderPackage = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('PackageDetail', { packageId: item.id })}
      activeOpacity={0.85}
    >
      <Card style={styles.card} shadow="sm">
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
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

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

      <FlatList
        data={filteredPackages}
        keyExtractor={item => item.id.toString()}
        renderItem={renderPackage}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            colors={[COLORS.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {shop.coverImageUrl && (
              <Image source={{ uri: shop.coverImageUrl }} style={styles.coverImage} />
            )}

            <View style={styles.hero}>
              <View style={styles.heroTopRow}>
                <Text style={styles.heroName}>{shop.name}</Text>
                {shop.category && CATEGORY_LABELS[shop.category] && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{CATEGORY_LABELS[shop.category]}</Text>
                  </View>
                )}
              </View>

              <View style={styles.ratingRow}>
                <Icon name="star" size={16} color="#F59E0B" />
                <Text style={styles.ratingText}>
                  {shop.ratingAverage && shop.ratingAverage > 0
                    ? `${shop.ratingAverage.toFixed(1)} (${shop.ratingCount || 0} oy)`
                    : 'Henüz değerlendirilmedi'}
                </Text>
              </View>

              {shop.address && (
                <View style={styles.addressRow}>
                  <Icon name="place" size={14} color={COLORS.textMuted} />
                  <Text style={styles.addressText} numberOfLines={2}>{shop.address}</Text>
                </View>
              )}

              {(shop.phone || shop.address) && (
                <View style={styles.contactRow}>
                  {shop.phone && (
                    <TouchableOpacity style={styles.contactButton} onPress={handleCall} activeOpacity={0.8}>
                      <Icon name="call" size={16} color={COLORS.primary} />
                      <Text style={styles.contactButtonText}>Ara</Text>
                    </TouchableOpacity>
                  )}
                  {shop.address && (
                    <TouchableOpacity style={styles.contactButton} onPress={handleDirections} activeOpacity={0.8}>
                      <Icon name="directions" size={16} color={COLORS.primary} />
                      <Text style={styles.contactButtonText}>Yol Tarifi</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

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

            {filteredPackages.length > 0 && (
              <Text style={styles.activeCountText}>
                {filteredPackages.length} aktif paket
              </Text>
            )}
          </>
        }
        ListEmptyComponent={() => (
          <EmptyState
            icon="inventory-2"
            title="Paket bulunamadı"
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md + 1,
    backgroundColor: COLORS.bg,
  },
  backButton: {
    width: 36, height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appName: { fontSize: 22, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginBottom: 2 },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
  },
  rateButtonText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  coverImage: {
    width: '100%',
    height: 160,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
  },

  hero: { marginBottom: SPACING.lg },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs + 2 },
  heroName: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  categoryBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.xs + 2 },
  ratingText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },

  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginBottom: SPACING.md },
  addressText: { fontSize: 13, color: COLORS.textMuted, flex: 1, lineHeight: 18 },

  contactRow: { flexDirection: 'row', gap: SPACING.sm },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...SHADOWS.sm,
  },
  contactButtonText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },

  activeCountText: {
    fontSize: 12, color: COLORS.textMuted, fontWeight: '600',
    marginBottom: SPACING.md,
  },

  list: { paddingHorizontal: SPACING.xxl, paddingBottom: SPACING.xxxl + SPACING.md },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  cardBody: { flex: 1, gap: 6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  packageName: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: SPACING.sm },
  packagePrice: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  packageDesc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  productList: { fontSize: 12, color: COLORS.textMuted },
  cardMeta: { gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.textMuted },
});

export default ShopDetailScreen;