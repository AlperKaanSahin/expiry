import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import { fetchPackageDetail, createOrder } from '../services/api';
import { COLORS } from '../theme/colors';
import Toast from 'react-native-toast-message';
import { showErrorToast } from '../utils/errorHandler';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

const formatDelivery = (start, end) => {
  if (!start || !end) return 'Teslimat zamanı belirtilmemiş';
  const s = new Date(start);
  const e = new Date(end);
  const date = s.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
  const startTime = s.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const endTime = e.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${startTime} - ${endTime}`;
};

const PackageDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { packageId } = route.params;
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState(false);
  
  

const loadPackage = async () => {
  setLoading(true);
  setError(false);

  try {
    const data = await fetchPackageDetail(packageId);
    setPackageData(data);
  } catch (err) {
    setError(true);
    showErrorToast(err, Toast);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadPackage();
}, [packageId]);

const handleOrder = async () => {
  try {
    setOrdering(true);
    const order = await createOrder({
      shopId: packageData.shopId,
      packages: [{ packageId: packageData.id, quantity }],
    });
    navigation.navigate('PaymentScreen', { orderId: order.id });
  } catch (err) {
    showErrorToast(err, Toast);
  } finally {
    setOrdering(false);
  }
};

  const maxQuantity = packageData?.quantity || 1;

if (loading) {
  return (
    <LoadingState text="Paket yükleniyor..." />
  );
}

if (error) {
  return (
    <ErrorState
      title="Paket yüklenemedi"
      subtitle="Lütfen tekrar deneyin."
      onRetry={loadPackage}
    />
  );
}

if (!packageData) {
  return (
    <EmptyState
      icon="inventory-2"
      title="Paket bulunamadı"
      subtitle="Bu paket kaldırılmış veya artık mevcut değil."
    />
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
          <View style={styles.dot} />
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <View style={styles.hero}>
          <Text style={styles.packageName}>{packageData.name}</Text>
          <Text style={styles.packagePrice}>
            {packageData.price ?? packageData.totalPrice} ₺
          </Text>
          {packageData.description ? (
            <Text style={styles.packageDesc}>{packageData.description}</Text>
          ) : null}
        </View>

        {/* INFO CARDS */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Icon name="inventory-2" size={20} color={COLORS.primary} />
            <Text style={styles.infoLabel}>Kalan Kutu</Text>
            <Text style={styles.infoValue}>{packageData.quantity ?? '-'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Icon name="schedule" size={20} color={COLORS.primary} />
            <Text style={styles.infoLabel}>Teslimat</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {formatDelivery(packageData.deliveryStart, packageData.deliveryEnd)}
            </Text>
          </View>
        </View>

        {/* PRODUCTS */}
        {packageData.products?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kutu İçeriği</Text>
            {packageData.products.map((product, index) => (
              <View
                key={index}
                style={[
                  styles.productRow,
                  index < packageData.products.length - 1 && styles.productRowBorder
                ]}
              >
                <View style={styles.productLeft}>
                  <Text style={styles.productName}>{product.name}</Text>
                  {product.expiryDate && (
                    <View style={styles.expiryRow}>
                      <Icon name="event" size={13} color={COLORS.textMuted} />
                      <Text style={styles.expiryText}>
                        SKT: {new Date(product.expiryDate).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.productRight}>
                  <Text style={styles.productQty}>{product.quantity} adet</Text>
                  <Text style={styles.productPrice}>{product.price} ₺</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* AUTO PRICE DROP */}
        {packageData.autoPriceDropEnabled && (
          <View style={styles.section}>
            <View style={styles.priceDropBadge}>
              <Icon name="trending-down" size={16} color="#D97706" />
              <Text style={styles.priceDropText}>
                Her {packageData.priceDropInterval} saatte {packageData.priceDropAmount}₺ düşüyor
                · Min: {packageData.minPriceDropLimit}₺
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { bottom: tabBarHeight, paddingBottom: 16 }]}>
        <View style={styles.quantityBox}>
          <TouchableOpacity
            onPress={() => setQuantity(q => Math.max(1, q - 1))}
            style={styles.qtyBtn}
          >
            <Icon name="remove" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity
            onPress={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
            style={styles.qtyBtn}
          >
            <Icon name="add" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

 <TouchableOpacity style={styles.orderButton} onPress={handleOrder} disabled={ordering} activeOpacity={0.8}>
    {/* ... aynı */}
          {ordering ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.orderButtonText}>Sipariş Ver</Text>
              <Text style={styles.orderTotal}>
                {(packageData.price * quantity).toFixed(2)} ₺
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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

  body: { paddingHorizontal: 20, paddingBottom: 100 },

  hero: { marginBottom: 20 },
  packageName: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, marginBottom: 6 },
  packagePrice: { fontSize: 28, fontWeight: '800', color: COLORS.primary, marginBottom: 8 },
  packageDesc: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20 },

  infoGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  infoLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  infoValue: { fontSize: 13, fontWeight: '700', color: COLORS.text },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    borderRadius: 0,
  },
  productRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  productLeft: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expiryText: { fontSize: 12, color: COLORS.textMuted },
  productRight: { alignItems: 'flex-end', gap: 2 },
  productQty: { fontSize: 12, color: COLORS.textMuted },
  productPrice: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  priceDropBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  priceDropText: { fontSize: 13, color: '#D97706', fontWeight: '500', flex: 1 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },

  // FOOTER
footer: {
  position: 'absolute',
  left: 0, right: 0,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  backgroundColor: COLORS.white,
  paddingHorizontal: 20,
  paddingVertical: 16,
  borderTopWidth: 1,
  borderTopColor: COLORS.border,
},
  quantityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 4,
  },
  qtyBtn: { padding: 10 },
  qtyText: { fontSize: 16, fontWeight: '700', color: COLORS.text, minWidth: 24, textAlign: 'center' },
  orderButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  orderButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  orderTotal: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
});

export default PackageDetailScreen;