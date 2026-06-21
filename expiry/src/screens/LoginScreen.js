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
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Email ve şifre zorunlu' });
      return;
    }
    try {
      setLoading(true);
      await login(email, password);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Giriş Başarısız', text2: err.toString() });
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
            <Text style={styles.heroTitle}>Tekrar hoş geldin</Text>
            <Text style={styles.heroSub}>Devam etmek için giriş yap</Text>
          </View>

          {/* FORM */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputBox}>
                <Icon name="email" size={18} color={COLORS.textMuted} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ornek@email.com"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Şifre</Text>
              <View style={styles.inputBox}>
                <Icon name="lock" size={18} color={COLORS.textMuted} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Şifreniz"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
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
          </View>

          {/* SUBMIT */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>

          {/* REGISTER LINK */}
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}
          >
            <Text style={styles.registerText}>
              Hesabın yok mu?{' '}
              <Text style={styles.registerTextBold}>Kayıt Ol</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  body: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },

  hero: { alignItems: 'center', marginBottom: 40 },
  appName: { fontSize: 36, fontWeight: '800', color: COLORS.primary, letterSpacing: -1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 4, marginBottom: 24 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  heroSub: { fontSize: 14, color: COLORS.textMuted },

  form: { gap: 16, marginBottom: 24 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
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

  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  registerLink: { alignItems: 'center', paddingVertical: 8 },
  registerText: { fontSize: 14, color: COLORS.textMuted },
  registerTextBold: { fontWeight: '700', color: COLORS.primary },
});

export default LoginScreen;