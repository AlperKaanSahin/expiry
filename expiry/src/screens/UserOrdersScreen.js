import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';

import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchMyOrders } from '../services/api';

const UserOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

const loadOrders = async () => {
  try {
    setLoading(true);

    const data = await fetchMyOrders();

    setOrders(data || []);

  } catch (error) {
    Alert.alert('Hata', error.toString());
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadOrders();
  }, []);

const safeOrders = Array.isArray(orders) ? orders : [];

const activeOrders = safeOrders.filter(o =>
  ['pending', 'paid', 'delivered'].includes(o.status)
);

const pastOrders = safeOrders.filter(o =>
  ['confirmed', 'released'].includes(o.status)
);

  const handleUserConfirm = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/status`, {
        status: 'confirmed'
      });

      Alert.alert('Başarılı', 'Sipariş onaylandı');
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
      case 'confirmed': return '#673AB7';
      case 'released': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Sipariş Alındı';
      case 'paid': return 'Ödeme Alındı';
      case 'delivered': return 'Market Teslim Etti';
      case 'confirmed': return 'Onaylandı';
      case 'released': return 'Tamamlandı';
      default: return status;
    }
  };
  

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>

      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Sipariş #{item.id}</Text>

        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <Text style={styles.priceText}>
        {item.totalPrice} ₺
      </Text>

      {/* USER ACTION */}
      {item.status === 'delivered' && !item.isReceivedByUser && (
        <TouchableOpacity
          style={[styles.button, styles.deliveredButton]}
          onPress={() => handleUserConfirm(item.id)}
        >
          <Text style={styles.buttonText}>Teslim Aldım</Text>
        </TouchableOpacity>
      )}

    </View>
  );
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
          Aktif
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setTab('past')}>
        <Text style={[
          styles.tab,
          tab === 'past' && styles.activeTab
        ]}>
          Geçmiş
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
    loader: {
        marginTop: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
    },
    button: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        marginLeft: 8,
    },
    deliveredButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
    },
    listContent: {
        paddingBottom: 20,
    },
    orderItem: {
        backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6200EE',
    },
});

export default UserOrdersScreen;