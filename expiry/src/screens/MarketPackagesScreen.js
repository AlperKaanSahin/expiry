import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, StyleSheet, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { fetchMarketPackages, addMarketPackage, updateMarketPackage, deleteMarketPackage } from '../services/api';
import { fetchMarketProducts } from '../services/api';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Switch } from 'react-native';
import { ScrollView } from 'react-native';
import { Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert } from 'react-native';

const MarketPackagesScreen = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [deliveryStart, setDeliveryStart] = useState(new Date());
  const [deliveryEnd, setDeliveryEnd] = useState(new Date());
  const [autoPriceDropEnabled, setAutoPriceDropEnabled] = useState(false);
  const [priceDropInterval, setPriceDropInterval] = useState('');
  const [priceDropAmount, setPriceDropAmount] = useState('');
  const [minPriceDropLimit, setMinPriceDropLimit] = useState('');
  const [modalError, setModalError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    quantity: 1
  });
  
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownItems, setDropdownItems] = useState([]);


  const loadPackages = async () => {
    try {
      setRefreshing(true);
      const data = await fetchMarketPackages();
      setPackages(data);
    } catch (error) {
      Alert.alert('Hata', error.toString());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const handleDelete = async (id, quantity) => {
    if (quantity > 1) {
      
      Alert.prompt(
        'Kaç kutu silinsin?',
        `Bu pakette ${quantity} kutu var. Kaç tanesini silmek istiyorsunuz?`,
        [
          {
            text: 'İptal',
            style: 'cancel'
          },
          {
            text: 'Sil',
            onPress: async (countStr) => {
              const count = parseInt(countStr, 10);
              if (isNaN(count) || count < 1 || count > quantity) {
                Toast.show({ type: 'error', text1: 'Geçersiz sayı' });
                return;
              }
              await deleteMarketPackage(id, count);
              await loadPackages();
              Toast.show({ type: 'success', text1: 'Başarılı', text2: `${count} kutu silindi` });
            }
          }
        ],
        'plain-text'
      );
    } else {
      
      await deleteMarketPackage(id);
      await loadPackages();
      Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Kutu silindi' });
    }
  };
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('tr-TR');
  };
  const formatDeliveryRange = (start, end) => {
    if (!start || !end) return '-';
    const startDate = new Date(start);
    const endDate = new Date(end);

    
    const sameDay =
      startDate.getDate() === endDate.getDate() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear();

    const dateStr = startDate.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const startTime = startDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const endTime = endDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    if (sameDay) {
      return `${dateStr} ${startTime} - ${endTime}`;
    } else {
      const endDateStr = endDate.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      return `${dateStr} ${startTime} - ${endDateStr} ${endTime}`;
    }
  };

  const openModal = async (packageItem = null) => {
    console.log('EDITLENEN PAKET:', packageItem);
    if (packageItem) {
      console.log(
        'autoPriceDropEnabled:', packageItem.autoPriceDropEnabled,
        'priceDropInterval:', packageItem.priceDropInterval,
        'priceDropAmount:', packageItem.priceDropAmount
      );
    }
    const products = await fetchMarketProducts();
    setAllProducts(products);
    setDropdownItems(products.map(p => ({ label: p.name, value: p.id })));
    setSelectedProducts(
      packageItem && packageItem.products
        ? packageItem.products.map(p => ({ id: p.id, quantity: p.quantity }))
        : []
    );
    setSelectedPackage(packageItem);
    setFormData({
      name: packageItem ? packageItem.name : '',
      price: packageItem && packageItem.price != null ? packageItem.price.toString() : '',
      description: packageItem ? packageItem.description : '',
      quantity: packageItem && packageItem.quantity != null ? packageItem.quantity.toString() : '1'
    });


   
    const isAutoDrop =
      packageItem &&
      (
        packageItem.autoPriceDropEnabled === true ||
        packageItem.autoPriceDropEnabled === 1 ||
        packageItem.autoPriceDropEnabled === '1' ||
        packageItem.autoPriceDropEnabled === 'true'
      );

    setAutoPriceDropEnabled(!!isAutoDrop);
    setPriceDropInterval(
      isAutoDrop && packageItem.priceDropInterval != null
        ? packageItem.priceDropInterval.toString()
        : ''
    );
    setPriceDropAmount(
      isAutoDrop && packageItem.priceDropAmount != null
        ? packageItem.priceDropAmount.toString()
        : ''
    );
    setMinPriceDropLimit(packageItem && packageItem.minPriceDropLimit != null ? packageItem.minPriceDropLimit.toString() : '');
    setDeliveryStart(packageItem && packageItem.deliveryStart ? new Date(packageItem.deliveryStart) : new Date());
    setDeliveryEnd(packageItem && packageItem.deliveryEnd ? new Date(packageItem.deliveryEnd) : new Date());
    setModalVisible(true);
  };
 
  const handleProductSelect = (productId) => {
    if (selectedProducts.some(p => p.id === productId)) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, { id: productId, quantity: 1 }]);
    }
  };
  const handleQuantityChange = (productId, quantity) => {
    setSelectedProducts(selectedProducts.map(p =>
      p.id === productId ? { ...p, quantity: quantity.replace(/[^0-9]/g, '') } : p
    ));
  };

  const handleSubmit = async () => {
    try {
      
      const cleanedProducts = selectedProducts.map(p => {
        const productInfo = allProducts.find(prod => prod.id === p.id);
        return {
          id: p.id,
          quantity: p.quantity && parseInt(p.quantity) > 0 ? parseInt(p.quantity) : 1,
          price: productInfo ? parseFloat(productInfo.price) : 0 // <-- price ekle!
        };
      });

      const totalProductsPrice = cleanedProducts.reduce((sum, p) => {
        const productInfo = allProducts.find(prod => prod.id === p.id);
        const price = productInfo ? parseFloat(productInfo.price) : 0;
        return sum + price * p.quantity;
      }, 0);

     
      if (autoPriceDropEnabled) {
        const minLimit = parseFloat(minPriceDropLimit);
        const packagePrice = formData.price ? parseFloat(formData.price) : null;

        if (!minPriceDropLimit || isNaN(minLimit) || minLimit <= 0) {
          setModalError('Minimum fiyat 0’dan büyük olmalı!');
          return;
        }
        // Eğer paket fiyatı girildiyse, minPriceDropLimit bundan büyük olamaz
        if (packagePrice !== null && minLimit > packagePrice) {
          setModalError('Minimum fiyat, paket fiyatından fazla olamaz!');
          return;
        }
        // Eğer paket fiyatı girilmediyse, minPriceDropLimit ürünlerin toplamından büyük olamaz
        if (packagePrice === null && minLimit > totalProductsPrice) {
          setModalError('Minimum fiyat, ürünlerin toplam fiyatından fazla olamaz!');
          return;
        }
      }

      const packageData = {
        name: formData.name,
        price: formData.price ? parseFloat(formData.price) : null,
        description: formData.description,
        quantity: formData.quantity ? parseInt(formData.quantity) : 1,
        deliveryStart: deliveryStart ? deliveryStart.toISOString() : null,
        deliveryEnd: deliveryEnd ? deliveryEnd.toISOString() : null,
        products: cleanedProducts,
        autoPriceDropEnabled,
        priceDropAmount: autoPriceDropEnabled ? parseFloat(priceDropAmount) : null,
        priceDropInterval: autoPriceDropEnabled ? parseInt(priceDropInterval) : null,
        minPriceDropLimit: autoPriceDropEnabled ? parseFloat(minPriceDropLimit) : null,
      };
      console.log('Gönderilen packageData:', packageData);

      if (selectedPackage) {
        await updateMarketPackage(selectedPackage.id, packageData);
        setModalVisible(false);
        Toast.show({
          type: 'success',
          text1: 'Başarılı',
          text2: 'Paket başarıyla güncellendi'
        });
      } else {
        await addMarketPackage(packageData);
        setModalVisible(false);
        Toast.show({
          type: 'success',
          text1: 'Başarılı',
          text2: 'Paket başarıyla eklendi'
        });
      }

      loadPackages();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: error.toString()
      });
    }
  };
  const handleCloseModal = () => {
    setModalVisible(false);
    setModalError('');
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kutu/Paketlerim</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openModal()}
        >
          <Icon name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#6200EE" style={styles.loader} />
      ) : (

        <FlatList
          data={packages}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => {
            console.log('PAKET:', item);
            return (
              <View style={styles.packageCard}>
                <View style={styles.packageInfo}>
                  <Text style={styles.packageName}>{item.name}</Text>
                  <Text style={styles.packagePrice}>
                    Toplam: {(item.price !== null && item.price !== undefined && item.price !== '') ? item.price : item.totalPrice} ₺
                  </Text>
                  <Text style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>
                    Kalan Kutu Adeti: {item.quantity ?? '-'}
                  </Text>
                  <Text style={styles.packageDescription}>
                    Teslimat: {formatDeliveryRange(item.deliveryStart, item.deliveryEnd)}
                  </Text>
                  <Text style={styles.packageDescription} numberOfLines={2}>
                    {item.products && item.products.length > 0
                      ? item.products.map(p => `${p.name} (${p.quantity} adet)`).join(', ')
                      : 'Ürün yok'}
                  </Text>
                  <Text style={styles.packageDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openModal(item)}
                  >
                    <Icon name="edit" size={20} color="#6200EE" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id, item.quantity)}
                  >
                    <Icon name="delete" size={20} color="#FF5252" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadPackages}
              colors={['#6200EE']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="package" size={50} color="#888" />
              <Text style={styles.emptyText}>Paket bulunamadı</Text>
            </View>
          }
        />
      )}

      {/* Paket Ekleme/Düzenleme Modalı */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView
              style={{ maxHeight: 500 }} // Yüksekliği isteğe göre ayarlayabilirsin
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>
                {selectedPackage ? 'Paket Düzenle' : 'Yeni Paket Ekle'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Paket Adı</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Paket adı girin"
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
                <Text style={styles.inputLabel}>Açıklama</Text>
                <TextInput
                  style={[styles.input, { height: 100 }]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Açıklama girin (örn: paket içeriği, teslimat notu...)"
                  multiline
                  blurOnSubmit={true}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                  maxLength={250}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Otomatik Fiyat Düşüşü</Text>
                <Switch
                  value={autoPriceDropEnabled}
                  onValueChange={setAutoPriceDropEnabled}
                />
              </View>
              {autoPriceDropEnabled && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Kaç saatte bir düşsün?</Text>
                    <TextInput
                      style={styles.input}
                      value={priceDropInterval}
                      onChangeText={setPriceDropInterval}
                      keyboardType="numeric"
                      placeholder="Örn: 1"
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Her seferinde kaç TL düşsün?</Text>
                    <TextInput
                      style={styles.input}
                      value={priceDropAmount}
                      onChangeText={setPriceDropAmount}
                      keyboardType="numeric"
                      placeholder="Örn: 5"
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  </View>
                  {autoPriceDropEnabled && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Düşebileceği Minimum Fiyat</Text>
                      <TextInput
                        style={styles.input}
                        value={minPriceDropLimit}
                        onChangeText={setMinPriceDropLimit}
                        keyboardType="numeric"
                        placeholder="Örn: 50"
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                      />
                    </View>
                  )}
                </>
              )}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ürünler ve Adetleri</Text>
                {allProducts.map(item => {
                  const selected = selectedProducts.find(p => p.id === item.id);
                  return (
                    <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <TouchableOpacity
                        onPress={() => handleProductSelect(item.id)}
                        style={{
                          width: 24, height: 24, borderWidth: 2, borderColor: '#6200EE',
                          backgroundColor: selected ? '#6200EE' : '#fff',
                          marginRight: 10, borderRadius: 6, justifyContent: 'center', alignItems: 'center'
                        }}
                      >
                        {selected && <Icon name="check" size={18} color="#fff" />}
                      </TouchableOpacity>
                      <Text style={{ flex: 1 }}>{item.name}</Text>
                      {selected && (
                        <TextInput
                          value={selected.quantity?.toString() || ''}
                          onChangeText={q => handleQuantityChange(item.id, q)}
                          keyboardType="numeric"
                          style={{
                            borderWidth: 1, borderColor: '#ccc', width: 50, marginLeft: 8,
                            padding: 4, borderRadius: 6, textAlign: 'center', backgroundColor: '#fff'
                          }}
                          placeholder="Adet"
                        />
                      )}
                    </View>
                  );
                })}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Adet (quantity)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text.replace(/[^0-9]/g, '') })}
                  keyboardType="numeric"
                  placeholder="Adet girin"
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Teslimat Başlangıç Saati</Text>
                <DateTimePicker
                  value={deliveryStart}
                  mode="datetime"
                  display="default"
                  onChange={(event, date) => date && setDeliveryStart(date)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Teslimat Bitiş Saati</Text>
                <DateTimePicker
                  value={deliveryEnd}
                  mode="datetime"
                  display="default"
                  onChange={(event, date) => date && setDeliveryEnd(date)}
                />
              </View>
              {modalError ? (
                <Text style={{ color: 'red', marginBottom: 10, textAlign: 'center' }}>
                  {modalError}
                </Text>
              ) : null}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCloseModal}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleSubmit}
                >
                  <Text style={styles.submitButtonText}>
                    {selectedPackage ? 'Güncelle' : 'Ekle'}
                  </Text>
                </TouchableOpacity>

              </View>
            </ScrollView>
          </View>

        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
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
  packageCard: {
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
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200EE',
    marginBottom: 8,
  },
  packageDescription: {
    fontSize: 14,
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

export default MarketPackagesScreen;