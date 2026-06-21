import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

const ADMIN_FEATURES = [
  { title: 'Kullanıcı Yönetimi', icon: 'people',              screen: 'UserListScreen' },
  { title: 'Shop Yönetimi',      icon: 'store',               screen: 'ShopListScreen' },
  { title: 'Raporlar',           icon: 'analytics',           screen: 'AuditLogsScreen' },
  { title: 'Sistem Ayarları',    icon: 'settings',            screen: 'SystemSettingsScreen' },
];

export default function AdminPanelScreen({ navigation }) {
  const { logout } = useAuth();

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

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Yönetim Paneli</Text>
          <Text style={styles.heroName}>Admin Panel</Text>
          <Text style={styles.heroSub}>Ne yapmak istersiniz?</Text>
        </View>

        {/* FEATURES */}
        <View style={styles.grid}>
          {ADMIN_FEATURES.map((feature) => (
            <TouchableOpacity
              key={feature.screen}
              style={styles.card}
              onPress={() => navigation.navigate(feature.screen)}
              activeOpacity={0.8}
            >
              <View style={styles.cardIcon}>
                <Icon name={feature.icon} size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>{feature.title}</Text>
              <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Icon name="logout" size={18} color={COLORS.red} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

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

  body: { paddingHorizontal: 20, paddingBottom: 40 },

  hero: { marginTop: 8, marginBottom: 28 },
  heroLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 4 },
  heroName: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, marginBottom: 6 },
  heroSub: { fontSize: 14, color: COLORS.textMuted },

  grid: { gap: 10, marginBottom: 32 },
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
});