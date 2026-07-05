import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { COLORS } from '../theme/colors';
import { resetPassword } from '../services/api';
import { showErrorToast } from '../utils/errorHandler';

const ResetPasswordScreen = ({ route, navigation }) => {
  const { email } = route.params;
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!token || token.length !== 6) {
      Toast.show({ type: 'error', text1: 'Hata', text2: '6 haneli kodu giriniz' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Şifre en az 6 karakter olmalı' });
      return;
    }

try {
  setLoading(true);
  await resetPassword(email, token, newPassword);
  Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Şifreniz güncellendi' });
  navigation.navigate('Login');
} catch (err) {
  showErrorToast(err, Toast);
}finally {
      setLoading(false);
    }
  };

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

      <View style={styles.body}>
        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <Icon name="lock" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Yeni Şifre</Text>
          <Text style={styles.subtitle}>
            <Text style={styles.emailText}>{email}</Text>
            {' '}adresine gönderilen kodu ve yeni şifrenizi girin.
          </Text>
        </View>

        {/* KOD */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>6 Haneli Kod</Text>
          <View style={styles.inputBox}>
            <Icon name="pin" size={18} color={COLORS.textMuted} />
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={token}
              onChangeText={setToken}
              placeholder="000000"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="next"
            />
          </View>
        </View>

        {/* YENİ ŞİFRE */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Yeni Şifre</Text>
          <View style={styles.inputBox}>
            <Icon name="lock-outline" size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="En az 6 karakter"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity onPress={() => setShowPassword(p => !p)}>
              <Icon
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={18}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitText}>Şifreyi Güncelle</Text>
          )}
        </TouchableOpacity>

        {/* TEKRAR KOD İSTE */}
        <TouchableOpacity
          style={styles.resendLink}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.resendLinkText}>Kodu almadım, tekrar gönder</Text>
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

  body: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },

  hero: { alignItems: 'center', marginBottom: 32 },
  iconWrap: {
    width: 72, height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  emailText: { fontWeight: '700', color: COLORS.text },

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
  codeInput: { letterSpacing: 4, fontSize: 20, fontWeight: '700' },

  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  submitText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  resendLink: { alignItems: 'center', paddingVertical: 8 },
  resendLinkText: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
});

export default ResetPasswordScreen;