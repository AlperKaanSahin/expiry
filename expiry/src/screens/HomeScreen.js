import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { fetchShops, fetchShopPackages, fetchNotifications } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPE_SCALE } from '../theme';
import { filterNotificationsByWorkspace } from '../utils/notificationFilters';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import Card from '../components/common/Card';
import Chip from '../components/common/Chip';
import SectionHeader from '../components/common/SectionHeader';
import { getShopImageSource } from '../constants/shopCategories';

const CATEGORIES = [
  { key: 'all', label: 'Tümü' },
  { key: 'bakery', label: 'Fırın', icon: 'bakery-dining' },
  { key: 'grocery', label: 'Manav', icon: 'local-florist' },
  { key: 'prepared', label: 'Hazır Yemek', icon: 'restaurant-menu' },
];

const formatCountdown = (deliveryEnd) => {
  if (!deliveryEnd) return null;
  const diffMs = new Date(deliveryEnd) - new Date();
  if (diffMs <= 0) return null;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return { label: `${mins} dk kaldı`, urgent: mins <= 20 };
  const hours = Math.floor(mins / 60);
  return { label: `${hours} sa kaldı`, urgent: false };
};

const discountPercent = (price, originalPrice) => {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      setError(null);
      const shopList = await fetchShops();
      setShops(shopList);

      const previewShops = shopList.slice(0, 5);
      const packagesPerShop = await Promise.all(
        previewShops.map((shop) =>
          fetchShopPackages(shop.id)
            .then((packages) => ({ shop, packages }))
            .catch(() => ({ shop, packages: [] }))
        )
      );

      const flattened = packagesPerShop
        .flatMap(({ shop, packages }) =>
          packages.map((pkg) => ({ ...pkg, shopName: shop.name, shopId: shop.id }))
        )
        .filter((pkg) => pkg.deliveryEnd)
        .sort((a, b) => new Date(a.deliveryEnd) - new Date(b.deliveryEnd))
        .slice(0, 6);

      setExpiringItems(flattened);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      const loadNotifications = async () => {
        try {
          const res = await fetchNotifications();
          const data = res.data || [];
          const userNotifications = filterNotificationsByWorkspace(data, 'user');
          setUnreadCount(userNotifications.filter((n) => !n.isRead).length);
        } catch (err) {
          console.log('Bildirimler yüklenemedi:', err.message);
        }
      };
      loadNotifications();
    }, [])
  );

  const filteredShops = shops.filter((s) =>
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const sortedShops = [...filteredShops].sort(
    (a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0)
  );
  const featuredShop = sortedShops[0]?.ratingAverage >= 4.5 ? sortedShops[0] : null;
  const regularShops = featuredShop ? sortedShops.slice(1) : sortedShops;

  const heroItem = expiringItems[0];
  const listItems = expiringItems.slice(1); // hero'da gösterileni tekrar listeleme

  const goToShop = (shop) =>
    navigation.navigate('BrowseTab', {
      screen: 'ShopDetail',
      params: { shopId: shop.id, shopName: shop.name, ratingAverage: shop.ratingAverage, ratingCount: shop.ratingCount },
    });

  const goToPackage = (packageId) =>
    navigation.navigate('BrowseTab', { screen: 'PackageDetail', params: { packageId } });

  const renderExpiringCard = ({ item }) => {
    const countdown = formatCountdown(item.deliveryEnd);
    const price = item.price ?? item.totalPrice;

    return (
      <TouchableOpacity onPress={() => goToPackage(item.id)} activeOpacity={0.85}>
        <Card style={styles.expiringCard} padding={0} shadow="md">
          <View style={styles.expiringImageWrap}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.expiringImage} />
            ) : (
              <View style={[styles.expiringImage, styles.imagePlaceholder]}>
                <Icon name="inventory-2" size={28} color={COLORS.border} />
              </View>
            )}
            {countdown && (
              <View style={[styles.timerBadge, { backgroundColor: countdown.urgent ? COLORS.redLight : COLORS.primaryLight }]}>
                <View style={[styles.timerDot, { backgroundColor: countdown.urgent ? COLORS.red : COLORS.primary }]} />
                <Text style={[styles.timerText, { color: countdown.urgent ? COLORS.red : COLORS.primary }]}>
                  {countdown.label}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.expiringBody}>
            <Text style={styles.expiringShopName} numberOfLines={1}>{item.shopName}</Text>
            <Text style={styles.expiringPkgName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceNew}>{price} ₺</Text>
              {item.originalPrice && <Text style={styles.priceOld}>{item.originalPrice} ₺</Text>}
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderRegularShop = ({ item }) => (
    <TouchableOpacity onPress={() => goToShop(item)} activeOpacity={0.85}>
      <Card style={styles.regularShopCard} shadow="sm">
<Image source={getShopImageSource(item)} style={styles.regularShopImage} />
        <View style={{ flex: 1 }}>
          <Text style={styles.regularShopName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.shopMetaRow}>
            <Icon name="star" size={14} color="#F59E0B" />
            <Text style={styles.shopRatingText}>
              {item.ratingAverage > 0 ? item.ratingAverage.toFixed(1) : '—'}
            </Text>
            {item.address ? (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.shopAddress} numberOfLines={1}>{item.address}</Text>
              </>
            ) : null}
          </View>
        </View>
        <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
      </Card>
    </TouchableOpacity>
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Marketler yüklenirken bir hata oluştu." onRetry={loadData} />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* Organik blob'lar — arka planda sabit, MD dosyasındaki "background depth" prensibi */}
      <View pointerEvents="none" style={styles.blobTopRight} />
      <View pointerEvents="none" style={styles.blobLeft} />

      {/* HEADER — özel, çünkü konum satırı Home'a özgü */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandName}>Expiry</Text>
          <TouchableOpacity style={styles.locationRow}>
            <Icon name="location-on" size={14} color={COLORS.primary} />
            <Text style={styles.locationText}>Konumunu ayarla</Text>
            <Icon name="expand-more" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.notifButton}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.7}
        >
          <Icon name="notifications-none" size={20} color={COLORS.text} />
          {unreadCount > 0 && <View style={styles.notifDot} />}
        </TouchableOpacity>
      </View>

      <FlatList
        data={regularShops}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRegularShop}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        ListHeaderComponent={
          <>
            <View style={styles.searchBox}>
              <Icon name="search" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Taze fırın ürünleri, meze, sebze ara..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={CATEGORIES}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.categoryList}
              renderItem={({ item }) => (
                <Chip
                  label={item.label}
                  icon={item.icon}
                  active={activeCategory === item.key}
                  onPress={() => setActiveCategory(item.key)}
                />
              )}
            />

            {/* HERO — fiyat etiketi kartın üstüne taşıyor (ticket-shape, MD'deki tanıma göre) */}
            {heroItem && (
              <TouchableOpacity onPress={() => goToPackage(heroItem.id)} activeOpacity={0.9} style={styles.heroWrap}>
                <Card style={styles.heroCard} padding={0} shadow="lg">
                  <View style={styles.heroImageWrap}>
                    {heroItem.imageUrl ? (
                      <Image source={{ uri: heroItem.imageUrl }} style={styles.heroImage} />
                    ) : (
                      <View style={[styles.heroImage, styles.imagePlaceholder]}>
                        <Icon name="inventory-2" size={40} color={COLORS.border} />
                      </View>
                    )}
                    {discountPercent(heroItem.price, heroItem.originalPrice) && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>
                          %{discountPercent(heroItem.price, heroItem.originalPrice)} İNDİRİM
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.heroContent}>
                    <View style={styles.ticketTag}>
                      <View style={[styles.ticketNotch, { left: -6 }]} />
                      <View style={[styles.ticketNotch, { right: -6 }]} />
                      <Text style={styles.ticketPrice}>{heroItem.price ?? heroItem.totalPrice} ₺</Text>
                    </View>
                    <View style={styles.heroShopRow}>
                      <Icon name="storefront" size={16} color={COLORS.textMuted} />
                      <Text style={styles.heroShopName} numberOfLines={1}>{heroItem.shopName}</Text>
                    </View>
                    <Text style={styles.heroPkgName} numberOfLines={2}>{heroItem.name}</Text>
                    <View style={styles.heroDivider} />
                    <View style={styles.heroBottomRow}>
                      <View style={styles.heroTagline}>
                        <Icon name="eco" size={16} color={COLORS.primary} />
                        <Text style={styles.heroTaglineText}>Bugün kurtarılmayı bekliyor</Text>
                      </View>
                      {heroItem.originalPrice && (
                        <Text style={styles.priceOld}>{heroItem.originalPrice} ₺</Text>
                      )}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            )}

            {listItems.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Son Paketler!" onSeeAllPress={() => {}} />
                <FlatList
                  data={listItems}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderExpiringCard}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  ItemSeparatorComponent={() => <View style={{ width: SPACING.md }} />}
                />
              </View>
            )}

            <SectionHeader title="Yakındaki Dükkanlar" />

            {featuredShop && (
              <TouchableOpacity onPress={() => goToShop(featuredShop)} activeOpacity={0.9}>
                <Card style={styles.featuredShopCard} shadow="lg">
                  <View style={styles.featuredAccentBar} />
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>ÖNERİLEN</Text>
                  </View>
                  <View style={styles.featuredRow}>
<Image source={getShopImageSource(featuredShop)} style={styles.featuredImage} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featuredName} numberOfLines={1}>{featuredShop.name}</Text>
                      <View style={styles.shopMetaRow}>
                        <Icon name="star" size={14} color="#F59E0B" />
                        <Text style={styles.shopRatingText}>{featuredShop.ratingAverage.toFixed(1)}</Text>
                        {featuredShop.address ? (
                          <>
                            <Text style={styles.dotSeparator}>•</Text>
                            <Text style={styles.shopAddress} numberOfLines={1}>{featuredShop.address}</Text>
                          </>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="storefront" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>Henüz market bulunamadı</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // MD'deki "background depth" prensibi: yumuşak, yarı saydam organik bloblar
  blobTopRight: {
    position: 'absolute', top: -100, right: -100,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: COLORS.primaryLight, opacity: 0.5,
  },
  blobLeft: {
    position: 'absolute', top: 180, left: -130,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: COLORS.primaryLight, opacity: 0.3,
  },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.lg,
  },
  brandName: { ...TYPE_SCALE.h1, fontSize: 28, color: COLORS.primary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: -2 },
  locationText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  notifButton: {
    width: 40, height: 40, borderRadius: RADIUS.full,
    backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.sm,
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.red,
    borderWidth: 2, borderColor: COLORS.white,
  },

  list: { paddingHorizontal: SPACING.xxl, paddingBottom: 110 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.white, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg, height: 48, marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },

  categoryList: { gap: SPACING.sm, paddingBottom: SPACING.xxl },

  heroWrap: { marginBottom: SPACING.xxl },
  heroCard: { overflow: 'visible', marginTop: 4 },
  heroImageWrap: { height: 180, borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  imagePlaceholder: { backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  discountBadge: {
    position: 'absolute', top: SPACING.md, right: SPACING.md,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
  },
  discountBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.white },
  heroContent: { padding: SPACING.xxl, paddingTop: SPACING.xl, gap: SPACING.sm },
  // Ticket-shape: kartın üstüne taşan, iki kenarında çentik olan fiyat etiketi
  ticketTag: {
    position: 'absolute', top: -20, right: SPACING.xxl,
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    ...SHADOWS.md,
  },
  ticketNotch: {
    position: 'absolute', top: '50%', marginTop: -6,
    width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.bg,
  },
  ticketPrice: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  heroShopRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.sm },
  heroShopName: { fontSize: 13, color: COLORS.textMuted },
  heroPkgName: { ...TYPE_SCALE.h3, color: COLORS.text },
  heroDivider: { height: 1, backgroundColor: '#F0F1F2', marginVertical: SPACING.xs },
  heroBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTagline: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  heroTaglineText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },

  section: { marginBottom: SPACING.xxl },

  expiringCard: { width: 200, overflow: 'hidden' },
  expiringImageWrap: { height: 110, width: '100%' },
  expiringImage: { width: '100%', height: '100%' },
  timerBadge: {
    position: 'absolute', top: SPACING.sm, left: SPACING.sm,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.md,
  },
  timerDot: { width: 6, height: 6, borderRadius: 3 },
  timerText: { fontSize: 11, fontWeight: '700' },
  expiringBody: { padding: SPACING.md, gap: 4 },
  expiringShopName: { fontSize: 12, color: COLORS.textMuted },
  expiringPkgName: { ...TYPE_SCALE.bodySemiBold, color: COLORS.text },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.sm, marginTop: 4 },
  priceNew: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  priceOld: { fontSize: 12, color: COLORS.textMuted, textDecorationLine: 'line-through' },

  featuredShopCard: { position: 'relative', paddingLeft: SPACING.xl + 4, marginBottom: SPACING.sm },
  featuredAccentBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
    backgroundColor: COLORS.primary, borderTopLeftRadius: RADIUS.lg, borderBottomLeftRadius: RADIUS.lg,
  },
  recommendedBadge: {
    position: 'absolute', top: SPACING.lg, right: SPACING.lg,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
  },
  recommendedText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  featuredRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  featuredIcon: {
    width: 64, height: 64, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center',
  },
  featuredName: { ...TYPE_SCALE.h3, color: COLORS.text, marginBottom: 4 },

  shopMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shopRatingText: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  dotSeparator: { fontSize: 12, color: COLORS.border },
  shopAddress: { fontSize: 12, color: COLORS.textMuted, flexShrink: 1 },

  regularShopCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  regularShopIcon: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center',
  },
  regularShopImage: {
  width: 48, height: 48, borderRadius: RADIUS.md,
},
featuredImage: {
  width: 64, height: 64, borderRadius: RADIUS.xl,
},
  regularShopName: { ...TYPE_SCALE.bodySemiBold, fontSize: 15, color: COLORS.text, marginBottom: 2 },

  empty: { alignItems: 'center', paddingVertical: 60, gap: SPACING.md },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
});

export default HomeScreen;