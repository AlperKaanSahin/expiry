import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { fetchShopProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MarketPanelScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [status, setStatus] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShopProfile = async () => {
      try {
        const data = await fetchShopProfile();
        console.log("SHOP:", data.shop);
        setStatus(data.status);
        setShop(data.shop);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    loadShopProfile();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    { title: 'Ürünlerim', icon: 'shopping-basket', screen: 'MarketProducts', color: '#6200EE' },
    { title: 'Kutu Yönetimi', icon: 'inventory', screen: 'MarketPackages', color: '#009688' },
    { title: 'Siparişlerim', icon: 'receipt', screen: 'MarketOrders', color: '#FF9800' },
    { title: 'Profilim', icon: 'store', screen: 'MarketProfile', color: '#2196F3' }
  ];

  // Yükleniyor durumu
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6200EE" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Onay bekleniyor durumu
  if (status === "PENDING") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Icon name="pending-actions" size={64} color="#FF9800" />
          <Text style={styles.pendingTitle}>Marketiniz henüz onaylanmadı</Text>
          <Text style={styles.pendingSubtitle}>Admin onayı bekleniyor</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Aktif market paneli
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Market Yönetim Paneli</Text>
        <Text style={styles.subtitle}>İşlemlerinizi seçiniz</Text>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuButton, { backgroundColor: item.color }]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Icon name={item.icon} size={28} color="#FFF" />
            <Text style={styles.menuButtonText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={20} color="#FFF" />
        <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: '48%',
    height: 120,
    borderRadius: 12,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  pendingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  pendingSubtitle: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default MarketPanelScreen;