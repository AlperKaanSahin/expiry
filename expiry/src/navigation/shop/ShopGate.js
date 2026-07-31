import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import { fetchMyShop } from '../../services/api';
import { COLORS } from '../../theme/colors';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import ShopTabs from './ShopTabs';

export default function ShopGate() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadShopProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMyShop();
      setStatus(data.status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadShopProfile(); }, []);

  if (loading) return <LoadingState />;
  if (error) {
    return (
      <ErrorState
        message="Shop bilgileri yüklenirken bir hata oluştu."
        onRetry={loadShopProfile}
      />
    );
  }

  if (status === 'PENDING') {
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
          <Text style={styles.pendingTitle}>Shop'unuz onay bekliyor</Text>
          <Text style={styles.pendingSubtitle}>
            Admin inceledikten sonra shop panelinize erişebilirsiniz.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return <ShopTabs />;
}

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
        pendingSubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
});