import React, { useEffect, useState } from 'react';
import { View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  RefreshControl, 
  StyleSheet, 
  SafeAreaView } 
from 'react-native';
import { fetchMarketOrders, updateMarketOrderStatus } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MarketOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const shopId = await AsyncStorage.getItem('@shopId');
      if (!shopId) {
        throw new Error('Market ID bulunamadı, lütfen tekrar giriş yapın.');
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
  
  const activeOrders = orders.filter(order => order.status !== 'Teslim Edildi' && order.status !== 'completed');
  const pastOrders = orders.filter(order => order.status === 'Teslim Edildi' || order.status === 'completed');

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateMarketOrderStatus(orderId, newStatus);
      loadOrders();
      Alert.alert('Başarılı', 'Sipariş durumu güncellendi');
    } catch (error) {
      Alert.alert('Hata', error.toString());
    }
  };
  const handleMarketConfirm = async (orderId) => {
  try {
    await confirmReceivedByMarket(orderId);
    loadOrders();
    Alert.alert('Başarılı', 'Teslim onaylandı');
  } catch (error) {
    Alert.alert('Hata', error.toString());
  }
};

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'hazırlanıyor': return '#FFA000';
      case 'yolda': return '#2196F3';
      case 'teslim edildi': return '#4CAF50';
      case 'iptal edildi': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Sipariş #{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        {item.status === 'Hazırlanıyor' && (
          <TouchableOpacity
            style={[styles.button, styles.readyButton]}
            onPress={() => handleStatusUpdate(item.id, 'Yolda')}
          >
            <Text style={styles.buttonText}>Yola Çıktı</Text>
          </TouchableOpacity>
        )}

        {item.status === 'Yolda' && !item.isReceivedByMarket && (
          <TouchableOpacity
            style={[styles.button, styles.deliveredButton]}
            onPress={() => handleMarketConfirm(item.id)}
          >
            <Text style={styles.buttonText}>Teslim Ettim</Text>
          </TouchableOpacity>
        )}

        {/* Market teslim ettiyse ve kullanıcı henüz teslim almadıysa bilgi gösterebilirsin */}
        {item.status === 'Yolda' && item.isReceivedByMarket && !item.isReceivedByUser && (
          <Text style={{ color: '#2196F3', fontWeight: 'bold', marginLeft: 8 }}>
            Teslimat bekleniyor...
          </Text>
        )}

        
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Aktif Siparişler</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#6200EE" style={styles.loader} />
      ) : activeOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aktif sipariş yok</Text>
        </View>
      ) : (
        <FlatList
          data={activeOrders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6200EE']}
            />
          }
        />
      )}

      <Text style={styles.title}>Geçmiş Siparişler</Text>
      {pastOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Geçmiş sipariş yok</Text>
        </View>
      ) : (
        <FlatList
          data={pastOrders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  readyButton: {
    backgroundColor: '#2196F3',
  },
  deliveredButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MarketOrdersScreen;