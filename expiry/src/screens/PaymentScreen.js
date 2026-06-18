import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { simulatePayment } from '../services/api';
import { COLORS } from '../theme/colors';

const PaymentScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);
      await simulatePayment(orderId);
      setPaid(true);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Ödeme Hatası', text2: err.toString() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        {!paid && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
        )}
        <View style={styles.headerCenter}>
          <Text style={styles.appName}>expiry</Text>
          <View style={styles.dot} />
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.body}>
        {!paid ? (
          <>
            {/* ÖDEME BEKLİYOR */}
            <View style={styles.iconWrap}>
              <Icon name="payment" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Ödeme</Text>
            <Text style={styles.subtitle}>
              Sipariş #{orderId} için ödemenizi tamamlayın
            </Text>

            <View style={styles.infoCard}>
              <Icon name="info-outline" size={18} color={COLORS.textMuted} />
              <Text style={styles.infoText}>
                Bu bir simülasyon — gerçek ödeme entegrasyonu yakında eklenecek
              </Text>
            </View>

            <TouchableOpacity
              style={styles.payButton}
              onPress={handlePayment}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Icon name="lock" size={18} color={COLORS.white} />
                  <Text style={styles.payButtonText}>Ödemeyi Tamamla</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* ÖDEME TAMAM */}
            <View style={styles.successIcon}>
              <Icon name="check-circle" size={56} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Ödeme Alındı!</Text>
            <Text style={styles.subtitle}>
              Siparişiniz onaylandı. Teslimat saatinde markete gidin.
            </Text>

            <TouchableOpacity
              style={styles.payButton}
              onPress={() => navigation.navigate('UserOrders')}
              activeOpacity={0.8}
            >
              <Icon name="receipt-long" size={18} color={COLORS.white} />
              <Text style={styles.payButtonText}>Siparişlerimi Gör</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.7}
            >
              <Text style={styles.homeButtonText}>Ana Sayfaya Dön</Text>
            </TouchableOpacity>
          </>
        )}
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
    backgroundColor: COLORS.bg,
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

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

  iconWrap: {
    width: 80, height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: { marginBottom: 20 },

  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 32 },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 32,
    width: '100%',
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },

  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 14,
    width: '100%',
    marginBottom: 12,
  },
  payButtonText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  homeButton: { paddingVertical: 10 },
  homeButtonText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
});

export default PaymentScreen;