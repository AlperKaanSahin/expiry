
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';

export default function AdminPanelScreen({ navigation }) {

  const { logout } = useAuth();

  const adminFeatures = [
    {
      title: 'Kullanıcı Yönetimi',
      icon: 'people',
      screen: 'UserListScreen',
      color: '#6200EE'
    },
    {
      title: 'Market Yönetimi',
      icon: 'store',
      screen: 'MarketListScreen',
      color: '#03DAC6'
    },
    {
      title: 'Ürün Onayları',
      icon: 'check-circle',
      screen: 'ProductApprovalScreen',
      color: '#FF9800'
    },
    {
      title: 'Raporlar',
      icon: 'analytics',
      screen: 'ReportsScreen',
      color: '#FF5252'
    },
    {
      title: 'Sistem Ayarları',
      icon: 'settings',
      screen: 'SystemSettingsScreen',
      color: '#9C27B0'
    },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.header}>
          <Text style={styles.title}>Admin Paneli</Text>
          <Text style={styles.subtitle}>Yönetim işlemlerinizi gerçekleştirin</Text>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Icon name="logout" size={24} color="#FFF" />
            <Text style={styles.logoutText}>Çıkış</Text>
          </TouchableOpacity>

        </View>

        <View style={styles.gridContainer}>
          {adminFeatures.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.featureCard, { backgroundColor: feature.color }]}
              onPress={() => navigation.navigate(feature.screen)}
            >
              <Icon name={feature.icon} size={32} color="#FFF" style={styles.icon} />
              <Text style={styles.featureText}>{feature.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  header: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
    logoutButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5252',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
  },
    logoutText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginBottom: 12,
  },
  featureText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});