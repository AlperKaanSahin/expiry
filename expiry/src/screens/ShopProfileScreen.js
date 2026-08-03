import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { fetchShopProfile, updateShopProfile, changeShopPassword } from '../services/api';
import { COLORS } from '../theme/colors';
import { showErrorToast } from '../utils/errorHandler';
import LoadingState from '../components/common/LoadingState';
import Icon from '@expo/vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import ErrorState from '../components/common/ErrorState';
import { useWorkspace } from '../context/WorkspaceContext';

const TABS = [
  { key: 'profile', label: 'Bilgilerim' },
  { key: 'password', label: 'Şifre Değiştir' },
];

const EMPTY_PASSWORD = { currentPassword: '', newPassword: '', confirmPassword: '' };

const ShopProfileScreen = () => {
  const { logout } = useAuth();
const { switchWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({ name: '', address: '', phone: '', email: '' });
  const [passwordData, setPasswordData] = useState(EMPTY_PASSWORD);
  const [error, setError] = useState(null);
  
const loadProfile = async () => {
  try {
    setLoading(true);
    setError(null);

    const data = await fetchShopProfile();

    setFormData({
      name: data.shop?.name || '',
      address: data.shop?.address || '',
      phone: data.shop?.phone || '',
      email: data.shop?.email || '',
    });
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadProfile();
}, []);

const handleProfileUpdate = async () => {
  try {
    setSaving(true);
    await updateShopProfile(formData);
    Toast.show({ type: 'success', text1: 'Güncellendi', text2: 'Profil bilgileri güncellendi' });
  } catch (err) {
    showErrorToast(err, Toast);
  } finally {
    setSaving(false);
  }
};

const handlePasswordChange = async () => {
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    Toast.show({ type: 'error', text1: 'Hata', text2: 'Yeni şifreler eşleşmiyor' });
    return;
  }
  if (passwordData.newPassword.length < 6) {
    Toast.show({ type: 'error', text1: 'Hata', text2: 'Şifre en az 6 karakter olmalı' });
    return;
  }
  try {
    setSaving(true);
    await changeShopPassword({
      password: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
    Toast.show({ type: 'success', text1: 'Güncellendi', text2: 'Şifre başarıyla değiştirildi' });
    setPasswordData(EMPTY_PASSWORD);
  } catch (err) {
    showErrorToast(err, Toast);
  } finally {
    setSaving(false);
  }
};

if (loading) {
  return <LoadingState />;
}
if (error) {
  return (
    <ErrorState
      message="Shop bilgileri yüklenirken bir hata oluştu."
      onRetry={loadProfile}
    />
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
        <Text style={styles.heroName}>Profil</Text>
      </View>

      {/* TABS */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabItem, activeTab === t.key && styles.tabItemActive]}
            onPress={() => setActiveTab(t.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'profile' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Shop Adı</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={text => setFormData({ ...formData, name: text })}
                  placeholder="Shop adınız"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Adres</Text>
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={formData.address}
                  onChangeText={text => setFormData({ ...formData, address: text })}
                  placeholder="Shop adresi"
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telefon</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={text => setFormData({ ...formData, phone: text })}
                  placeholder="05XX XXX XX XX"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={text => setFormData({ ...formData, email: text })}
                  placeholder="Email adresi"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleProfileUpdate}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitText}>Bilgileri Güncelle</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mevcut Şifre</Text>
                <TextInput
                  style={styles.input}
                  value={passwordData.currentPassword}
                  onChangeText={text => setPasswordData({ ...passwordData, currentPassword: text })}
                  placeholder="Mevcut şifreniz"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Yeni Şifre</Text>
                <TextInput
                  style={styles.input}
                  value={passwordData.newPassword}
                  onChangeText={text => setPasswordData({ ...passwordData, newPassword: text })}
                  placeholder="En az 6 karakter"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Yeni Şifre (Tekrar)</Text>
                <TextInput
                  style={styles.input}
                  value={passwordData.confirmPassword}
                  onChangeText={text => setPasswordData({ ...passwordData, confirmPassword: text })}
                  placeholder="Yeni şifreyi tekrar girin"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handlePasswordChange}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitText}>Şifreyi Değiştir</Text>
                )}
              </TouchableOpacity>
            </>
          )}
          {/* HESAP */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => switchWorkspace('user')}
              activeOpacity={0.8}
            >
              <Icon name="storefront" size={18} color={COLORS.primary} />
              <Text style={styles.browseButtonText}>Normal Kullanıcı Olarak Gez</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={logout}
              activeOpacity={0.8}
            >
              <Icon name="logout" size={18} color={COLORS.red} />
              <Text style={styles.logoutText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
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

  body: { paddingHorizontal: 20, paddingBottom: 40 },

  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  multiline: { height: 90, textAlignVertical: 'top' },

  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  footer: {
  marginTop: 24,
  marginBottom: 16,
  gap: 10,
},
browseButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  paddingVertical: 14,
  borderRadius: 12,
  backgroundColor: '#F0FDF4',
  borderWidth: 1,
  borderColor: COLORS.primary,
},
browseButtonText: {
  color: COLORS.primary,
  fontWeight: '600',
  fontSize: 14,
},
logoutButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  paddingVertical: 14,
  borderRadius: 12,
  backgroundColor: '#FEF2F2',
  borderWidth: 1,
  borderColor: '#FCA5A5',
},
logoutText: {
  color: COLORS.red,
  fontWeight: '600',
  fontSize: 14,
},
});

export default ShopProfileScreen;