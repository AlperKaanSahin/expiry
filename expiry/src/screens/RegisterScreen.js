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
import Toast from 'react-native-toast-message';
import { registerUser } from '../services/api';
import { ROUTES } from '../navigation/routes';
import { COLORS } from '../theme/colors';
import { showErrorToast } from '../utils/errorHandler';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegisterScreen = ({ navigation }) => {
const [formData, setFormData] = useState({
  firstName: '', lastName: '', email: '', password: ''
});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

const validateField = (name, value) => {
  switch (name) {
    case 'firstName':
      return !value.trim() ? 'Ad zorunlu' : null;
    case 'lastName':
      return !value.trim() ? 'Soyad zorunlu' : null;
    case 'email':
      if (!value.trim()) return 'Email zorunlu';
      if (!EMAIL_REGEX.test(value)) return 'Geçerli bir email girin';
      return null;
    case 'password':
      if (!value) return 'Şifre zorunlu';
      if (value.length < 6) return 'Şifre en az 6 karakter olmalı';
      return null;
    default:
      return null;
  }
};

  const handleBlur = (name) => {
    const error = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };


  const validateAll = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateAll()) {
      Toast.show({ type: 'error', text1: 'Eksik Bilgi', text2: 'Lütfen formu kontrol edin' });
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
      showErrorToast(err, Toast);
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
              <View style={[styles.inputBox, errors.firstName && styles.inputBoxError]}>
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={t => handleChange('firstName', t)}
                  onBlur={() => handleBlur('firstName')}
                  placeholder="Adınız"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
              {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Soyad *</Text>
              <View style={[styles.inputBox, errors.lastName && styles.inputBoxError]}>
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={t => handleChange('lastName', t)}
                  onBlur={() => handleBlur('lastName')}
                  placeholder="Soyadınız"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
              {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
            </View>
          </View>

          {/* EMAIL */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email *</Text>
            <View style={[styles.inputBox, errors.email && styles.inputBoxError]}>
              <Icon name="email" size={18} color={COLORS.textMuted} />
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={t => handleChange('email', t)}
                onBlur={() => handleBlur('email')}
                placeholder="ornek@email.com"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>
          {/* ŞİFRE */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Şifre *</Text>
            <View style={[styles.inputBox, errors.password && styles.inputBoxError]}>
              <Icon name="lock" size={18} color={COLORS.textMuted} />
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={t => handleChange('password', t)}
                onBlur={() => handleBlur('password')}
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
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
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
  inputBoxError: { borderColor: COLORS.red },
  input: { flex: 1, fontSize: 15, color: COLORS.text },
  errorText: { fontSize: 12, color: COLORS.red, marginTop: 4 },
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