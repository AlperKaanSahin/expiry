import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { fetchNotifications, markNotificationAsRead } from '../services/api';
import { MaterialIcons } from '@expo/vector-icons';
import{ fetchShopProfile } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { CommonActions } from '@react-navigation/native';



const NotificationScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);


useFocusEffect(
  useCallback(() => {
    setLoading(true);
    loadNotifications();
  }, [])
);
  const loadNotifications = async () => {
    try {
      const res = await fetchNotifications();
      console.log('Bildirimler yanıtı:', res); // Debug için
      setNotifications(res.data || []);
    } catch (err) {
      console.log('Bildirim yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

const getNavigationScreen = (item) => {
  switch (item.type) {

    case 'SHOP_APPLY':
      return {
        stack: 'ShopStack',
        screen: 'ShopListScreen'
      };

    case 'SHOP_REAPPLY':
      return {
        stack: 'ShopStack',
        screen: 'ShopListScreen'
      };

    case 'SHOP_APPROVED':
      return {
        stack: 'ShopStack',
        screen: 'ShopPanel'
      };

    case 'SHOP_REJECTED':
      return {
        stack: 'ShopStack',
        screen: 'ShopApply'
      };

    default:
      return null;
  }
};

const handlePress = async (item) => {
  try {
    console.log("NOTIFICATION TYPE:", item.type);

    // 1) mark as read
    await markNotificationAsRead(item.id);

    setNotifications(prev =>
      prev.map(n =>
        n.id === item.id ? { ...n, isRead: true } : n
      )
    );

    // 2) ADMIN FLOW
if (user.role === 'admin') {
  switch (item.type) {
    case 'SHOP_APPLY':
    case 'SHOP_REAPPLY':
      navigation.dispatch(
        CommonActions.navigate({
          name: 'AdminStack',
          params: { screen: 'ShopListScreen' },
        })
      );
      break;
    default:
      navigation.navigate('AdminStack');
  }
  return;
}

    // 3) USER FLOW
    const shop = await fetchShopProfile();

    switch (item.type) {
      case 'SHOP_APPROVED':
        navigation.navigate('ShopStack', {
          screen: 'ShopPanel'
        });
        break;

      case 'SHOP_REJECTED':
        navigation.navigate('ShopStack', {
          screen: 'ShopApply'
        });
        break;

      default:
        navigation.navigate('ShopStack', {
          screen: shop.status === 'active'
            ? 'ShopPanel'
            : 'ShopApply'
        });
    }

  } catch (err) {
    console.log("HANDLE PRESS ERROR:", err);
  }
};
  const getIconName = (type) => {
    if (type === 'SHOP_APPROVED') return 'check-circle';
    if (type === 'SHOP_REJECTED') return 'cancel';
    if (type === 'ORDER_CREATED') return 'shopping-cart';
    return 'notifications';
  };

  const getIconColor = (type) => {
    if (type === 'SHOP_APPROVED') return '#4CAF50';
    if (type === 'SHOP_REJECTED') return '#F44336';
    if (type === 'ORDER_CREATED') return '#FF9800';
    return '#6200EE';
  };  

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Şimdi';
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, item.isRead ? styles.readItem : styles.unreadItem]}
      onPress={() => handlePress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: getIconColor(item.type) }]}>
        <MaterialIcons name={getIconName(item.type)} size={22} color="#FFF" />
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <View style={styles.footer}>
          <MaterialIcons name="access-time" size={12} color="#999" />
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>

      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Bildirimler yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="notifications-none" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Henüz bildiriminiz yok</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  listContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  item: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#6200EE',
  },
  readItem: {
    opacity: 0.85,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6200EE',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
});

export default NotificationScreen;