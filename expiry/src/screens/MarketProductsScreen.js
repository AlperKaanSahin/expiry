import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, StyleSheet, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { fetchMarketProducts, addMarketProduct, updateMarketProduct, deleteMarketProduct } from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { Keyboard } from 'react-native';

const MarketProductsScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    quantity: ''
  });

  const loadProducts = async () => {
    try {
      setRefreshing(true);
      const data = await fetchMarketProducts();
      setProducts(data);
    } catch (error) {
      Alert.alert('Hata', error.toString());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteMarketProduct(id);
      loadProducts();
      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Ürün başarıyla silindi'
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: error.toString()
      });
    }
  };
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR');
  };

  const openEditModal = (product = null) => {
    setSelectedProduct(product);
    setFormData({
      name: product ? product.name : '',
      price: product ? product.price.toString() : '',
      quantity: product ? product.quantity.toString() : ''
    });
    setExpiryDate(product && product.expiryDate ? new Date(product.expiryDate) : new Date());
    setEditModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        expiryDate: expiryDate ? expiryDate.toISOString() : null
      };

      if (selectedProduct) {
        await updateMarketProduct(selectedProduct.id, productData);
        Toast.show({
          type: 'success',
          text1: 'Başarılı',
          text2: 'Ürün başarıyla güncellendi'
        });
      } else {
        await addMarketProduct(productData);
        Toast.show({
          type: 'success',
          text1: 'Başarılı',
          text2: 'Ürün başarıyla eklendi'
        });
      }

      setEditModalVisible(false);
      loadProducts();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: error.toString()
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ürünlerim</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openEditModal()}
        >
          <Icon name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#6200EE" style={styles.loader} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <View style={styles.productMeta}>
                  <View style={styles.metaRow}>
                    <Icon name="attach-money" size={16} color="#6200EE" />
                    <Text style={styles.productPrice}>{item.price} ₺</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Icon name="inventory" size={16} color="#6200EE" />
                    <Text style={styles.productQuantity}>Stok: {item.quantity}</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Icon name="event" size={16} color="#6200EE" />
                    <Text style={styles.expiryDate}>
                      {item.expiryDate ? formatDate(item.expiryDate) : 'Tarih yok'}
                    </Text>
                  </View>

                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(item)}
                >
                  <Icon name="edit" size={20} color="#6200EE" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id)}
                >
                  <Icon name="delete" size={20} color="#FF5252" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadProducts}
              colors={['#6200EE']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="error-outline" size={50} color="#888" />
              <Text style={styles.emptyText}>Ürün bulunamadı</Text>
            </View>
          }
        />
      )}

      {/* Düzenleme/Ekleme Modalı */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {selectedProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ürün Adı</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Ürün adı girin"
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fiyat (₺)</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                keyboardType="numeric"
                placeholder="Fiyat girin"
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Stok Miktarı</Text>
              <TextInput
                style={styles.input}
                value={formData.quantity}
                onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                keyboardType="numeric"
                placeholder="Stok miktarı girin"
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Son Kullanma Tarihi</Text>
              <DateTimePicker
                value={expiryDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  if (date) setExpiryDate(date);
                }}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6200EE',
    marginLeft: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  expiryDate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  expiredDate: {
    color: '#FF5252',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#6200EE',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginTop: 20,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200EE',
    marginRight: 16,
  },
  productQuantity: {
    fontSize: 16,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    marginRight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#EEE',
  },
  cancelButtonText: {
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#6200EE',
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default MarketProductsScreen;