import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { ROUTES } from '../navigation/routes';
import { COLORS } from '../theme/colors';

const WelcomeScreen = ({ navigation, route }) => {
  const justRegistered = route.params?.registered === true;

  useEffect(() => {
    if (justRegistered) {
      Toast.show({ type: 'success', text1: 'Hesabınız oluşturuldu', text2: 'Giriş yaparak devam edebilirsiniz' });
    }
  }, [justRegistered]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.body}>
        {/* LOGO */}
        <View style={styles.logoArea}>
          <Text style={styles.appName}>expiry</Text>
          <View style={styles.dot} />
          <Text style={styles.tagline}>İsraf etme, kazan.</Text>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          {justRegistered ? (
            <View style={styles.successIcon}>
              <Icon name="check-circle" size={48} color={COLORS.primary} />
            </View>
          ) : null}

          <Text style={styles.title}>
            {justRegistered ? 'Kayıt Tamamlandı!' : 'Hoş Geldiniz'}
          </Text>
          <Text style={styles.subtitle}>
            {justRegistered
              ? 'Hesabınız oluşturuldu. Giriş yaparak devam edebilirsiniz.'
              : 'Son kullanma tarihi yaklaşan ürünleri indirimli fiyatlarla satın al.'}
          </Text>
        </View>

        {/* BUTTONS */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate(ROUTES.LOGIN)}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Giriş Yap</Text>
          </TouchableOpacity>

          {!justRegistered && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate(ROUTES.REGISTER)}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Kayıt Ol</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  body: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 40,
    paddingTop: 60,
  },

  logoArea: { alignItems: 'center' },
  appName: { fontSize: 48, fontWeight: '800', color: COLORS.primary, letterSpacing: -2 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginTop: 6, marginBottom: 16 },
  tagline: { fontSize: 16, color: COLORS.textMuted, fontWeight: '500' },

  content: { alignItems: 'center', paddingHorizontal: 16 },
  successIcon: { marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },

  buttons: { gap: 12 },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  secondaryButton: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
});

export default WelcomeScreen;