import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Dimensions,
  TextInput,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { fetchShopPackages, rateShop } from '../services/api';
import api from '../services/api';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ShopDetailScreen = ({ route, navigation }) => {
  const { shopId, shopName, ratingAverage, ratingCount } = route.params;
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [canRate, setCanRate] = useState(false);

  const loadPackages = async () => {
    try {
      setRefreshing(true);
      const data = await fetchShopPackages(shopId);
      setPackages(data);
    } catch (error) {
      console.error('Kutu yükleme hatası:', error);
      Alert.alert('Hata', 'Paket bilgileri yüklenirken bir sorun oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadPackages();

      // Marketi puanlayabilir mi kontrolü
      const checkCanRate = async () => {
        try {
          const res = await api.get(`/shops/${shopId}/can-rate`);
          setCanRate(res.data.canRate);
        } catch (e) {
          setCanRate(false);
        }
      };
      checkCanRate();
    }
  }, [isFocused, shopId]);

  const filteredPackages = packages
    .filter(pkg => Number(pkg.quantity) > 0)
    .filter(pkg =>
      (pkg.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pkg.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

  const renderPackageItem = ({ item }) => {
    const totalProductPrice = item.products
      ? item.products.reduce((sum, product) => sum + (product.price * product.quantity), 0)
      : 0;

    const discountPercentage = item.originalPrice
      ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
      : 0;

    return (
      <TouchableOpacity
        style={styles.packageCard}
        onPress={() => navigation.navigate('PackageDetail', { packageId: item.id })}
        activeOpacity={0.9}
      >
        <Image
          source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/placeholder_box.jpg')}
          style={styles.packageImage}
          resizeMode="cover"
        />

        <View style={styles.packageInfo}>
          <Text style={styles.packageName}>{item.name}</Text>
          <Text style={styles.packageDescription} numberOfLines={2}>{item.description}</Text>
          {/* Kutu adeti */}
          <Text style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>
            Kalan Kutu Adeti: {item.quantity ?? '-'}
          </Text>
          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.packagePrice}>{item.price} ₺</Text>
              {item.originalPrice && (
                <Text style={styles.originalPrice}>{item.originalPrice} ₺</Text>
              )}
            </View>

            {discountPercentage > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>%{discountPercentage}</Text>
              </View>
            )}
          </View>


        </View>
      </TouchableOpacity>
    );
  };

  const handleRate = async () => {
    setRatingSubmitting(true);
    try {
      await rateShop(shopId, userRating);
      Alert.alert('Teşekkürler!', 'Puanınız kaydedildi.');
      loadPackages(); // Puanı güncellemek için verileri yeniden yükle
    } catch (err) {
      console.log('Puan gönderme hatası:', err);
      Alert.alert('Hata', 'Puan verilirken bir sorun oluştu');
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{shopName}</Text>
        <TouchableOpacity>
          <Icon name="shopping-cart" size={24} color="#FF6B00" />
        </TouchableOpacity>
      </View>

      {/* Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          placeholder="Paket ara..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Market Bilgileri */}
      <View style={styles.shopInfoContainer}>
        <View style={styles.ratingSummary}>
          <Icon name="star" size={24} color="#FFD700" />
          <Text style={styles.ratingText}>
            {ratingAverage ? ratingAverage.toFixed(1) : '-'}
            <Text style={styles.ratingCount}> ({ratingCount || 0} oy)</Text>
          </Text>
        </View>
      </View>

      {/* Paket Listesi */}
      <FlatList
        data={filteredPackages}
        renderItem={renderPackageItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadPackages}
            colors={['#FF6B00']}
            tintColor="#FF6B00"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="inventory" size={50} color="#888" />
            <Text style={styles.emptyText}>Paket bulunamadı</Text>
          </View>
        }
      />

      {/* Puan Verme Bölümü */}
      <View style={styles.ratingSection}>
        <Text style={styles.ratingTitle}>Bu marketi puanla</Text>

        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity
              key={star}
              onPress={() => setUserRating(star)}
              activeOpacity={0.7}
            >
              <Icon
                name={userRating >= star ? 'star' : 'star-border'}
                size={36}
                color={userRating >= star ? '#FF6B00' : '#CCC'}
                style={styles.starIcon}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (userRating === 0 || ratingSubmitting) && styles.disabledButton
          ]}
          disabled={userRating === 0 || ratingSubmitting}
          onPress={handleRate}
        >
          {ratingSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>Puanı Gönder</Text>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 15,
    height: 45,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  shopInfoContainer: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 5,
  },
  ratingCount: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  packageCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 3,
  },
  packageImage: {
    width: '100%',
    height: 150,
  },
  packageInfo: {
    padding: 15,
  },
  packageName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  packageDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
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
  totalPriceText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
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
  ratingSection: {
    backgroundColor: '#FFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  starIcon: {
    marginHorizontal: 5,
  },
  submitButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
    width: '80%',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ShopDetailScreen;