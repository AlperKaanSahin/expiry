import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { fetchPackageDetail, createOrder } from '../services/api';

const { width } = Dimensions.get('window');

const PackageDetailScreen = ({ route, navigation }) => {
  const { packageId } = route.params;
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);


  useEffect(() => {
    const loadPackage = async () => {
      try {
        const data = await fetchPackageDetail(packageId);
        console.log('PAKET DETAY:', data);
        setPackageData(data);
      } catch (error) {
        console.error('Kutu detay yüklenemedi:', error);
        Alert.alert('Hata', 'Paket bilgileri yüklenirken bir sorun oluştu');
      } finally {
        setLoading(false);
      }
    };
    loadPackage();
  }, [packageId]);

  const handleOrder = async () => {
    try {
      const order = await createOrder({
        shopId: packageData.shopId,
        packages: [
          { packageId: packageData.id, quantity, price: packageData.price }
        ],
        totalPrice: packageData.price * quantity
      });
      // Sipariş sonrası paket detayını güncelle
      const updatedData = await fetchPackageDetail(packageData.id);
      setPackageData(updatedData);

      navigation.navigate('PaymentScreen', { orderId: order.id });
    } catch (error) {
      Alert.alert('Sipariş Hatası', 'Sipariş oluşturulurken bir hata oluştu');
    }
  };
  const maxQuantity = packageData?.quantity || 1;
  const handleIncrease = () => {
    if (quantity < maxQuantity) setQuantity(quantity + 1);
  };

  const handleDecrease = () => {
    setQuantity(Math.max(1, quantity - 1));
  };

  const totalProductPrice = packageData?.products?.reduce(
    (sum, product) => sum + (product.price * product.quantity), 0
  ) || 0;

  const discountPercentage = packageData?.originalPrice
    ? Math.round(((packageData.originalPrice - packageData.price) / packageData.originalPrice) * 100)
    : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  if (!packageData) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="error-outline" size={50} color="#888" />
        <Text style={styles.emptyText}>Paket bulunamadı</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.favoriteButton}>
          <Icon name="favorite-border" size={24} color="#FF6B00" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ürün Resmi */}
        <Image
          source={packageData.imageUrl ? { uri: packageData.imageUrl } : require('../assets/placeholder_box.jpg')}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Ürün Detayları */}
        <View style={styles.detailCard}>
          <Text style={styles.name}>{packageData.name}</Text>
          <Text style={styles.description}>{packageData.description}</Text>

          {/* Fiyat Bilgileri */}
          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{packageData.price} ₺</Text>
              {packageData.originalPrice && (
                <Text style={styles.originalPrice}>{packageData.originalPrice} ₺</Text>
              )}
            </View>

            {discountPercentage > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>%{discountPercentage}</Text>
              </View>
            )}
          </View>
          {/* Kalan kutu sayısı */}
          <Text style={{ fontSize: 15, color: '#4CAF50', fontWeight: 'bold', marginBottom: 8 }}>
            Kalan kutu: {packageData.quantity ?? '-'}
          </Text>

          {/* Teslimat Bilgisi */}
          <View style={styles.deliveryCard}>
            <View style={styles.cardHeader}>
              <Icon name="hourglass-empty" size={20} color="#4CAF50" />
              <Text style={styles.cardTitle}>Teslimat Bilgisi</Text>
            </View>
            <View style={styles.timeSlot}>
              <Icon name="schedule" size={16} color="#FF9800" />
              <Text style={styles.timeRange}>
                {packageData.deliveryStart ? (
                  <>
                    {new Date(packageData.deliveryStart).toLocaleString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {' - '}
                    {new Date(packageData.deliveryEnd).toLocaleString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </>
                ) : (
                  'Teslimat zamanı belirtilmemiş'
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* Ürün İçeriği */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Kutu İçeriği</Text>

          {packageData.products?.map((product, index) => (
            <View key={index} style={styles.productItem}>
              <Image
                source={product.imageUrl ? { uri: product.imageUrl } : require('../assets/placeholder.png')}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <View style={styles.productMeta}>
                  <Text style={styles.productQuantity}>{product.quantity} adet</Text>
                  <Text style={styles.productPrice}>{product.price} ₺</Text>
                </View>
                {product.expiryDate && (
                  <View style={styles.expiryRow}>
                    <Icon name="event" size={16} color="#666" />
                    <Text style={styles.productExpiry}>
                      SKT: {new Date(product.expiryDate).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sepet Butonu */}
      <View style={styles.footer}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            onPress={handleDecrease}
            style={styles.quantityButton}
          >
            <Icon name="remove" size={24} color="#FF6B00" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            onPress={handleIncrease}
            style={styles.quantityButton}
          >
            <Icon name="add" size={24} color="#FF6B00" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.orderButton}
          onPress={handleOrder}
        >
          <Text style={styles.orderButtonText}>Sipariş Ver</Text>
          <Text style={styles.orderTotal}>
            {(packageData.price * quantity).toFixed(2)} ₺
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 5,
  },
  favoriteButton: {
    padding: 5,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  image: {
    width: '100%',
    height: width * 0.6,
  },
  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    margin: 15,
    marginTop: -30,
    elevation: 3,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    lineHeight: 22,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  originalPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 10,
  },
  discountBadge: {
    backgroundColor: '#FF6B00',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  totalValueText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  deliveryInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  contentSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  productItem: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productExpiry: {
    fontSize: 13,
    color: '#666',
    marginLeft: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    elevation: 5,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  quantityButton: {
    padding: 8,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  orderButton: {
    flex: 1,
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    padding: 15,
    marginLeft: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  orderTotal: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deliveryCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  timeRange: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555',
  },
});

export default PackageDetailScreen;