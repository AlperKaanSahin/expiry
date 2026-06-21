import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { registerUser } from '../services/api';
import { ROUTES } from '../navigation/routes';
import { COLORS } from '../theme/colors';

const GENDERS = [
  { value: 'Erkek', label: 'Erkek', icon: 'male' },
  { value: 'Kadın', label: 'Kadın', icon: 'female' },
  { value: 'Diğer', label: 'Diğer', icon: 'transgender' },
];

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', birthDate: '', gender: '', password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleChange = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));

  const handleDateChange = (_, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      handleChange('birthDate', selectedDate.toISOString().split('T')[0]);
    }
  };

  const handleRegister = async () => {
    const { firstName, lastName, email, password, phone, birthDate, gender } = formData;

    if (!firstName || !lastName || !email || !password || !phone || !birthDate || !gender) {
      Toast.show({ type: 'error', text1: 'Eksik Bilgi', text2: 'Lütfen tüm zorunlu alanları doldurun' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Toast.show({ type: 'error', text1: 'Geçersiz Email', text2: 'Lütfen geçerli bir email adresi girin' });
      return;
    }

    try {
      setLoading(true);
      await registerUser(formData);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: ROUTES.WELCOME, params: { registered: true } }],
        })
      );
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Hata', text2: err.message || 'Kayıt sırasında bir hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
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
            <Text style={styles.appName}>expiry</Text>
            <View style={styles.dot} />
            <Text style={styles.heroTitle}>Hesap Oluştur</Text>
            <Text style={styles.heroSub}>Başlamak için bilgilerini gir</Text>
          </View>

          {/* AD SOYAD */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Ad *</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={t => handleChange('firstName', t)}
                  placeholder="Adınız"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Soyad *</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={t => handleChange('lastName', t)}
                  placeholder="Soyadınız"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>
          </View>

          {/* EMAIL */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email *</Text>
            <View style={styles.inputBox}>
              <Icon name="email" size={18} color={COLORS.textMuted} />
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={t => handleChange('email', t)}
                placeholder="ornek@email.com"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* TELEFON */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Telefon *</Text>
            <View style={styles.inputBox}>
              <Icon name="phone" size={18} color={COLORS.textMuted} />
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={t => { if (t.length <= 10) handleChange('phone', t); }}
                placeholder="05XX XXX XX XX"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* DOĞUM TARİHİ */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Doğum Tarihi *</Text>
            <TouchableOpacity
              style={styles.inputBox}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Icon name="calendar-today" size={18} color={COLORS.textMuted} />
              <Text style={[styles.input, !formData.birthDate && { color: COLORS.textMuted }]}>
                {formData.birthDate || 'GG-AA-YYYY'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <View style={styles.datePicker}>
                <DateTimePicker
                  value={formData.birthDate ? new Date(formData.birthDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
                {Platform.OS === 'ios' && (
                  <View style={styles.datePickerBtns}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.datePickerCancel}>Vazgeç</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.datePickerConfirm}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.datePickerConfirmText}>Tamam</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* CİNSİYET */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cinsiyet *</Text>
            <View style={styles.genderRow}>
              {GENDERS.map(g => (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.genderOption, formData.gender === g.value && styles.genderOptionActive]}
                  onPress={() => handleChange('gender', g.value)}
                  activeOpacity={0.8}
                >
                  <Icon
                    name={g.icon}
                    size={18}
                    color={formData.gender === g.value ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text style={[
                    styles.genderLabel,
                    formData.gender === g.value && styles.genderLabelActive
                  ]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ŞİFRE */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Şifre *</Text>
            <View style={styles.inputBox}>
              <Icon name="lock" size={18} color={COLORS.textMuted} />
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={t => handleChange('password', t)}
                placeholder="En az 6 karakter"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <TouchableOpacity onPress={() => setShowPassword(p => !p)}>
                <Icon name={showPassword ? 'visibility' : 'visibility-off'} size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* SUBMIT */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitText}>Hesap Oluştur</Text>
            )}
          </TouchableOpacity>

          {/* LOGIN LINK */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate(ROUTES.LOGIN)}
            activeOpacity={0.7}
          >
            <Text style={styles.loginText}>
              Zaten hesabın var mı?{' '}
              <Text style={styles.loginTextBold}>Giriş Yap</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  body: { paddingHorizontal: 24, paddingBottom: 40 },

  hero: { alignItems: 'center', marginTop: 32, marginBottom: 32 },
  appName: { fontSize: 36, fontWeight: '800', color: COLORS.primary, letterSpacing: -1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 4, marginBottom: 20 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  heroSub: { fontSize: 14, color: COLORS.textMuted },

  row: { flexDirection: 'row' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted, marginBottom: 6 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: COLORS.text },

  datePicker: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  datePickerBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  datePickerCancel: { color: COLORS.textMuted, fontSize: 15, padding: 8 },
  datePickerConfirm: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  datePickerConfirmText: { color: COLORS.white, fontWeight: '600' },

  genderRow: { flexDirection: 'row', gap: 8 },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  genderOptionActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  genderLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  genderLabelActive: { color: COLORS.primary },

  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  submitText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  loginLink: { alignItems: 'center', paddingVertical: 8 },
  loginText: { fontSize: 14, color: COLORS.textMuted },
  loginTextBold: { fontWeight: '700', color: COLORS.primary },
});

export default RegisterScreen;