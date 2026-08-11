import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import { COLORS } from '../theme/colors';

const DeliveryConfirmedScreen = ({ route, navigation }) => {
  const { order } = route.params;
  const customerName = order.User ? `${order.User.firstName} ${order.User.lastName}` : 'Müşteri';
  const packages = order.OrderPackages || [];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.body}>
        <View style={styles.successIcon}>
          <Icon name="check-circle" size={56} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Teslimat Onaylandı</Text>
        <Text style={styles.subtitle}>Sipariş #{order.id}</Text>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Icon name="person" size={18} color={COLORS.textMuted} />
            <Text style={styles.cardText}>{customerName}</Text>
          </View>

          {packages.length > 0 && (
            <View style={styles.packageList}>
              <Text style={styles.packageListTitle}>Teslim Edilen Paketler</Text>
              {packages.map((pkg, index) => (
                <View key={index} style={styles.packageRow}>
                  <Icon name="inventory-2" size={16} color={COLORS.primary} />
                  <Text style={styles.packageText}>
                    {pkg.Package?.name || 'Paket'} × {pkg.quantity}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.navigate('ShopMain', { screen: 'ShopOrders' })}
          activeOpacity={0.8}
        >
          <Text style={styles.doneButtonText}>Tamam</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  successIcon: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 24 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  cardText: { fontSize: 15, fontWeight: '700', color: COLORS.text },

  packageList: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 14, gap: 10 },
  packageListTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  packageRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  packageText: { fontSize: 14, color: COLORS.text },

  doneButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 48,
    borderRadius: 14,
  },
  doneButtonText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});

export default DeliveryConfirmedScreen;