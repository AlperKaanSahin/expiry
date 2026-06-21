import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView
} from 'react-native';

import { StyleSheet } from 'react-native';
import { fetchMarketOrders, changeOrderStatus } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MarketOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);

      const shopId = await AsyncStorage.getItem('@shopId');

      if (!shopId) {
        throw new Error('Market ID bulunamadı');
      }

      const data = await fetchMarketOrders(shopId);
      setOrders(data);

    } catch (error) {
      Alert.alert('Hata', error.toString());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

const activeOrders = orders.filter(o =>
  ['pending', 'paid', 'delivered'].includes(o.status)
);

const pastOrders = orders.filter(o =>
  ['confirmed', 'released'].includes(o.status)
);

  const handleDeliver = async (orderId) => {
    console.log("CLICKED ORDER ID:", orderId);
    try {
      await changeOrderStatus(orderId, 'delivered');
      loadOrders();
    } catch (error) {
      Alert.alert('Hata', error.toString());
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#9E9E9E';
      case 'paid': return '#FFA000';
      case 'delivered': return '#2196F3';
      case 'confirmed': return '#4CAF50';
      case 'released': return '#673AB7';
      default: return '#9E9E9E';
    }
  };

const renderOrderItem = ({ item }) => {
  

  return (
    <View style={styles.orderItem}>

      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Sipariş #{item.id}</Text>

        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>

        {item.status === 'paid' && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.deliveredButton]}
              onPress={() => handleDeliver(item.id)}
            >
              <Text style={styles.buttonText}>TESLİM ETTİM</Text>
            </TouchableOpacity>

            <Text style={styles.preparingText}>
              Sipariş hazırlanıyor
            </Text>
          </>
        )}

        {item.status === 'delivered' && (
          <Text style={styles.waitText}>
            Kullanıcı onayı bekleniyor
          </Text>
        )}

        {item.status === 'confirmed' && (
          <Text style={styles.doneText}>
            Kullanıcı onayladı
          </Text>
        )}

      </View>
    </View>
  );
};

const [tab, setTab] = useState('active');
const filteredOrders =
  tab === 'active' ? activeOrders : pastOrders;

return (
  <SafeAreaView style={styles.container}>

    {/* TAB BAR */}
    <View style={styles.tabContainer}>

      <TouchableOpacity onPress={() => setTab('active')}>
        <Text style={[
          styles.tab,
          tab === 'active' && styles.activeTab
        ]}>
          Aktif Siparişler
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setTab('past')}>
        <Text style={[
          styles.tab,
          tab === 'past' && styles.activeTab
        ]}>
          Geçmiş Siparişler
        </Text>
      </TouchableOpacity>

    </View>

    {/* LIST */}
    {loading ? (
      <ActivityIndicator />
    ) : (
      <FlatList
        data={filteredOrders}
        keyExtractor={i => i.id.toString()}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
      />
    )}

  </SafeAreaView>
);
};
const styles = StyleSheet.create({
  
  tabContainer: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  marginBottom: 15,
},

tab: {
  fontSize: 16,
  color: '#888',
  padding: 8,
},

activeTab: {
  color: '#6200EE',
  fontWeight: 'bold',
  borderBottomWidth: 2,
  borderBottomColor: '#6200EE',
},
container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },

  listContent: {
    paddingBottom: 20,
  },

  orderItem: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  actionButtons: {
    marginTop: 10,
  },

  button: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },

  deliveredButton: {
    backgroundColor: '#4CAF50',
  },

  buttonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },

  preparingText: {
    color: '#FFA000',
    fontWeight: 'bold',
  },

  waitText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },

  doneText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

export default MarketOrdersScreen;