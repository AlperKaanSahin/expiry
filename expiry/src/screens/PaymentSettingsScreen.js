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
import Icon from '@expo/vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { fetchPaymentSettings, updatePaymentSettings } from '../services/api';
import { COLORS } from '../theme/colors';
import { showErrorToast } from '../utils/errorHandler';
import LoadingState from '../components/common/LoadingState';

const TYPES = [
  { key: 'PERSONAL', label: 'Şahıs' },
  { key: 'LIMITED_OR_JOINT_STOCK_COMPANY', label: 'Şirket' },
];

const EMPTY = {
  subMerchantType: 'PERSONAL',
  iban: '',
  email: '',
  identityNumber: '',
  taxNumber: '',
  taxOffice: '',
  legalCompanyTitle: '',
};

const STATUS_CONFIG = {
  pending: { label: 'Ödeme bilgileri henüz kaydedilmedi', color: COLORS.textMuted, icon: 'info-outline' },
  active: { label: 'Ödeme bilgileri aktif', color: '#16A34A', icon: 'check-circle' },
  failed: { label: 'Kayıt başarısız oldu, tekrar deneyin', color: '#DC2626', icon: 'error-outline' },
};

const PaymentSettingsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('pending');
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    try {
      setLoading(true);
      const { settings } = await fetchPaymentSettings();
      setForm({
        subMerchantType: settings.subMerchantType || 'PERSONAL',
        iban: settings.iban || '',
        email: '',
        identityNumber: settings.identityNumber || '',
        taxNumber: settings.taxNumber || '',
        taxOffice: settings.taxOffice || '',
        legalCompanyTitle: settings.legalCompanyTitle || '',
      });
      setStatus(settings.subMerchantStatus || 'pending');
    } catch (err) {
      showErrorToast(err, Toast);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const isCompany = form.subMerchantType === 'LIMITED_OR_JOINT_STOCK_COMPANY';

  const handleSave = async () => {
    if (!form.iban.trim() || !form.email.trim()) {
      Toast.show({ type: 'error', text1: 'Hata', text2: 'IBAN ve email zorunlu' });
      return;
    }
    if (!isCompany && !form.identityNumber.trim()) {
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Kimlik numarası zorunlu' });
      return;
    }
    if (isCompany && (!form.taxNumber.trim() || !form.taxOffice.trim() || !form.legalCompanyTitle.trim())) {
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Vergi no, vergi dairesi ve unvan zorunlu' });
      return;
    }

    try {
      setSaving(true);
      const result = await updatePaymentSettings(form);
      setStatus(result.subMerchantStatus);
      Toast.show({ type: 'success', text1: 'Kaydedildi', text2: 'Ödeme bilgileri güncellendi' });
    } catch (err) {
      showErrorToast(err, Toast);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Icon name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ödeme Ayarları</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

          <View style={[styles.statusBanner, { borderColor: statusConfig.color + '40', backgroundColor: statusConfig.color + '10' }]}>
            <Icon name={statusConfig.icon} size={18} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>

          <Text style={styles.sectionLabel}>İşletme Tipi</Text>
          <View style={styles.typeRow}>
            {TYPES.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeChip, form.subMerchantType === t.key && styles.typeChipActive]}
                onPress={() => setForm({ ...form, subMerchantType: t.key })}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeChipText, form.subMerchantType === t.key && styles.typeChipTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>IBAN</Text>
            <TextInput
              style={styles.input}
              value={form.iban}
              onChangeText={text => setForm({ ...form, iban: text })}
              placeholder="TR.."
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={text => setForm({ ...form, email: text })}
              placeholder="Ödeme bildirimleri için email"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {!isCompany ? (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kimlik Numarası (TCKN)</Text>
              <TextInput
                style={styles.input}
                value={form.identityNumber}
                onChangeText={text => setForm({ ...form, identityNumber: text })}
                placeholder="11 haneli TCKN"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                maxLength={11}
              />
            </View>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Şirket Unvanı</Text>
                <TextInput
                  style={styles.input}
                  value={form.legalCompanyTitle}
                  onChangeText={text => setForm({ ...form, legalCompanyTitle: text })}
                  placeholder="XYZ Ltd. Şti."
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vergi Numarası</Text>
                <TextInput
                  style={styles.input}
                  value={form.taxNumber}
                  onChangeText={text => setForm({ ...form, taxNumber: text })}
                  placeholder="Vergi numarası"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vergi Dairesi</Text>
                <TextInput
                  style={styles.input}
                  value={form.taxOffice}
                  onChangeText={text => setForm({ ...form, taxOffice: text })}
                  placeholder="Vergi dairesi"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
            {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitText}>Kaydet</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PaymentSettingsScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  backButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: COLORS.text },
  body: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  statusText: { fontSize: 13, fontWeight: '600', flex: 1 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeChip: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  typeChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  typeChipText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  typeChipTextActive: { color: COLORS.primary },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.text },
  submitButton: { backgroundColor: COLORS.primary, paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  submitText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});