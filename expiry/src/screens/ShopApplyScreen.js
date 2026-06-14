import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { applyForShop, fetchShopProfile } from '../services/api';
import { COLORS } from '../theme/colors';

const EMPTY_FORM = { name: '', address: '', phone: '' };

const ShopApplyScreen = ({ navigation }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [shopStatus, setShopStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const data = await fetchShopProfile();
        setShopStatus(data?.shop?.status || null);
      } catch {
        setShopStatus(null);
      } finally {
        setStatusLoading(false);
      }
    };
    checkStatus();
  }, []);

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Market adı ve telefon zorunlu' });
      return;
    }
    try {
      setLoading(true);
      await applyForShop(form);
      Toast.show({ type: 'success', text1: 'Başvuru Alındı', text2: 'Admin onayı bekleniyor' });
      navigation.navigate('Home');
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Hata', text2: err.message || 'Başvuru başarısız' });
    } finally {
      setLoading(false);
    }
  };

  if (statusLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (shopStatus === 'pending') {
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
          <Text style={styles.pendingTitle}>Başvurunuz İnceleniyor</Text>
          <Text style={styles.pendingSubtitle}>
            Admin onayı bekleniyor. Onaylandığında bildirim alacaksınız.
          </Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.8}
          >
            <Text style={styles.submitText}>Ana Sayfaya Dön</Text>
          </TouchableOpacity>
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* HERO */}
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>Market Ol</Text>
            <Text style={styles.heroName}>Market Başvurusu</Text>
            <Text style={styles.heroSub}>
              Bilgilerini doldur, admin onayından sonra market paneline erişebilirsin.
            </Text>
          </View>

          {/* FORM */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Market Adı *</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={text => handleChange('name', text)}
                placeholder="Market adını girin"
                placeholderTextColor={COLORS.textMuted}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Adres</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={form.address}
                onChangeText={text => handleChange('address', text)}
                placeholder="Market adresini girin"
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Telefon *</Text>
              <TextInput
                style={styles.input}
                value={form.phone}
                onChangeText={text => handleChange('phone', text)}
                placeholder="05XX XXX XX XX"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* SUBMIT */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitText}>Başvuru Yap</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelText}>Vazgeç</Text>
          </TouchableOpacity>
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

  body: { paddingHorizontal: 20, paddingBottom: 40 },

  hero: { marginTop: 8, marginBottom: 28 },
  heroLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 4 },
  heroName: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, marginBottom: 8 },
  heroSub: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20 },

  form: { gap: 16, marginBottom: 24 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
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
    marginBottom: 10,
  },
  submitText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  cancelButton: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: COLORS.textMuted },

  // PENDING
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
  pendingSubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
});

export default ShopApplyScreen;