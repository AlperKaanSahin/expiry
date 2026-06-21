import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { fetchShopProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

const MENU_ITEMS = [
  { title: 'Ürünlerim', icon: 'shopping-basket', screen: 'ShopProducts' },
  { title: 'Kutu Yönetimi', icon: 'inventory', screen: 'ShopPackages' },
  { title: 'Siparişlerim', icon: 'receipt-long', screen: 'ShopOrders' },
  { title: 'Profilim', icon: 'store', screen: 'ShopProfile' },
];

const ShopPanelScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [status, setStatus] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShopProfile = async () => {
      try {
        const data = await fetchShopProfile();
        setStatus(data.status);
        setShop(data.shop);
      } catch {
        //
      } finally {
        setLoading(false);
      }
    };
    loadShopProfile();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'PENDING') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.appName}>expiry</Text>
            <View style={styles.dot} />
          </View>
        </View>
        <View style={styles.center}>
          <View style={styles.pendingIcon}>
            <Icon name="pending-actions" size={40} color="#D97706" />
          </View>
          <Text style={styles.pendingTitle}>Shop'unuz onay bekliyor</Text>
          <Text style={styles.pendingSubtitle}>
            Admin inceledikten sonra shop panelinize erişebilirsiniz.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.heroName}>{shop?.name || 'Shopum'}</Text>
        <Text style={styles.heroSub}>Ne yapmak istersiniz?</Text>
      </View>

      {/* MENU */}
      <View style={styles.grid}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.card}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.8}
          >
            <View style={styles.cardIcon}>
              <Icon name={item.icon} size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* LOGOUT */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Icon name="logout" size={18} color={COLORS.red} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.bg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appName: { fontSize: 22, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginBottom: 2 },

  hero: { paddingHorizontal: 20, marginBottom: 24 },
  heroLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 4 },
  heroName: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, marginBottom: 6 },
  heroSub: { fontSize: 14, color: COLORS.textMuted },

  grid: { paddingHorizontal: 20, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  cardIcon: {
    width: 46, height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },

  footer: { paddingHorizontal: 20, marginTop: 'auto', paddingBottom: 24, paddingTop: 16 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: COLORS.redLight,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: COLORS.red },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  pendingIcon: {
    width: 80, height: 80,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pendingTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 8 },
  pendingSubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
});

export default ShopPanelScreen;