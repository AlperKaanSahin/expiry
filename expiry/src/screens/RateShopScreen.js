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
import Icon from '@expo/vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { rateShop } from '../services/api';
import { COLORS } from '../theme/colors';

const RateShopScreen = ({ route, navigation }) => {
  const { shopId, orderId } = route.params;
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleRate = async () => {
    if (rating === 0) {
      Toast.show({ type: 'error', text1: 'Uyarı', text2: 'Lütfen bir puan seçin' });
      return;
    }
    try {
      setLoading(true);
      await rateShop(shopId, rating, orderId);
      Toast.show({ type: 'success', text1: 'Teşekkürler!', text2: 'Puanınız kaydedildi' });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Hata', text2: err.response?.data?.error || 'Puan gönderilemedi' });
    } finally {
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

      {/* CONTENT */}
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Icon name="store" size={40} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Marketi Değerlendir</Text>
        <Text style={styles.subtitle}>Deneyiminizi paylaşın</Text>

        {/* STARS */}
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setRating(item)}
              activeOpacity={0.7}
            >
              <Icon
                name="star"
                size={48}
                color={item <= rating ? '#F59E0B' : COLORS.border}
              />
            </TouchableOpacity>
          ))}
        </View>

        {rating > 0 && (
          <Text style={styles.ratingLabel}>
            {['', 'Çok Kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'][rating]}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
          onPress={handleRate}
          disabled={loading || rating === 0}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitText}>Gönder</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Şimdi Değil</Text>
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
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 32 },

  stars: { flexDirection: 'row', gap: 8, marginBottom: 16 },

  ratingLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 32,
  },

  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  submitButtonDisabled: { opacity: 0.4 },
  submitText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  skipButton: { paddingVertical: 10 },
  skipText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
});

export default RateShopScreen;