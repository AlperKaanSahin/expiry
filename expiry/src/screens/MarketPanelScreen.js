import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { fetchMarketProfile } from '../services/api';

const MarketPanelScreen = ({ navigation }) => {
  useEffect(() => {
    const saveShopId = async () => {
      try {
        const profile = await fetchMarketProfile();
        await AsyncStorage.setItem('@shopId', profile.shopId?.toString() || profile.id?.toString());
      } catch (error) {
        console.error('Profil yüklenirken hata:', error);
      }
    };
    saveShopId();
  }, []);
  
  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  const menuItems = [
    { 
      title: 'Ürünlerim', 
      icon: 'shopping-basket',
      onPress: () => navigation.navigate('MarketProducts'),
      color: '#6200EE'
    },
    { 
      title: 'Kutu Yönetimi', 
      icon: 'inventory',
      onPress: () => navigation.navigate('MarketPackages'),
      color: '#009688'
    },
    { 
      title: 'Siparişlerim', 
      icon: 'receipt',
      onPress: () => navigation.navigate('MarketOrders'),
      color: '#FF9800'
    },
    { 
      title: 'Profilim', 
      icon: 'store',
      onPress: () => navigation.navigate('MarketProfile'),
      color: '#2196F3'
    },
  ];

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
            onPress={item.onPress}
          >
            <Icon name={item.icon} size={24} color="#FFF" style={styles.icon} />
            <Text style={styles.menuButtonText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="exit-to-app" size={20} color="#FFF" />
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
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
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
    fontSize: 18,
    fontWeight: '500',
    marginTop: 10,
  },
  icon: {
    marginBottom: 5,
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
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 10,
  },
});

export default MarketPanelScreen;