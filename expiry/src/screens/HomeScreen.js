import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import{useState} from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { fetchNotifications } from '../services/api';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

    const loadUnread = async () => {
    try {
      const res = await fetchNotifications();
      const data = res.data || [];

      const unread = data.filter(n => !n.isRead).length;
      setUnreadCount(unread);

    } catch (err) {
      console.log(err);
    }
  };

  // 👇 BURASI
  useFocusEffect(
    useCallback(() => {
      loadUnread();
    }, [])
  );
  const handleLogout = async () => {
    await logout();
  };



  // Rol bazlı buton yapılandırması
  const getRoleAction = () => {
    if (user?.role === 'user') {
      return { title: 'Shop Ol', icon: 'store', screen: 'ShopApply', color: '#4CAF50' };
    }
    if (user?.role === 'market') {
      return { title: 'Shop Panel', icon: 'dashboard', screen: 'ShopStack', color: '#4CAF50' };
    }
    if (user?.role === 'admin') {
      return { title: 'Admin Panel', icon: 'admin-panel-settings', screen: 'AdminStack', color: '#4CAF50' };
    }
    return null;
  };

  const quickActions = [
    { title: 'Shoplar', icon: 'storefront', screen: 'Shops', color: '#009688' },
    { title: 'Siparişler', icon: 'receipt', screen: 'UserOrders', color: '#FF9800' },
    { title: 'Profil', icon: 'person', screen: 'UserProfile', color: '#6200EE' }
  ];

  const roleAction = getRoleAction();
  const allActions = roleAction ? [...quickActions, roleAction] : quickActions;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER WITH NOTIFICATION */}
      <View style={styles.headerWrapper}>
        <View style={styles.headerLeft} />
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.7}
        >
          <Icon name="notifications-none" size={24} color="#333" />
{unreadCount > 0 && (
  <View style={styles.notificationBadge}>
    <Text style={styles.badgeText}>{unreadCount}</Text>
  </View>
)}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* LOGO & WELCOME */}
        <View style={styles.header}>
          <Image
            source={require('../assets/label.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>Hoş Geldiniz</Text>
          <Text style={styles.subtitle}>Hızlı erişim menüsü</Text>
        </View>

        {/* QUICK ACTIONS + ROL BUTONU */}
        <View style={styles.quickActionsContainer}>
          {allActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { backgroundColor: action.color }]}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={styles.actionIconContainer}>
                <Icon name={action.icon} size={28} color="#FFF" />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ÇIKIŞ BUTONU */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Icon name="logout" size={20} color="#FFF" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  headerLeft: {
    width: 40,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionCard: {
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
  actionIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
});

export default HomeScreen;