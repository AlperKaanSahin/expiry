import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  TextInput,
  RefreshControl,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { fetchShops } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ShopScreen = () => {
  const navigation = useNavigation();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadShops = async () => {
    try {
      setRefreshing(true);
      const data = await fetchShops();
      setShops(data);
    } catch (error) {
      console.error('Shop yükleme hatası:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadShops();
    }, [])
  );

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShopSelect = (shop) => {
    navigation.navigate('ShopDetail', {
      shopId: shop.id,
      shopName: shop.name
    });
  };

  const renderShopCard = ({ item }) => (
    <TouchableOpacity
      style={styles.shopCard}
      onPress={() => handleShopSelect(item)}
      activeOpacity={0.9}
    >
      <Image
        source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/placeholder_shops.jpg')}
        style={styles.shopImage}
        resizeMode="cover"
      />
      <View style={styles.shopInfo}>
        <Text style={styles.shopName}>{item.name}</Text>

        <View style={styles.shopMetaRow}>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>
              {item.ratingAverage ? item.ratingAverage.toFixed(1) : '4.5'}
            </Text>
          </View>
        </View>

        <View style={styles.shopMeta}>
          <Icon name="location-on" size={16} color="#666" />
          <Text style={styles.shopAddress} numberOfLines={1}>{item.address}</Text>
        </View>
      </View>
      <Icon name="chevron-right" size={24} color="#888" />
    </TouchableOpacity>
  );

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
        <Text style={styles.title}>Shoplar</Text>
        <TouchableOpacity style={styles.cartButton}>
          <Icon name="shopping-cart" size={24} color="#FF6B00" />
        </TouchableOpacity>
      </View>

      {/* Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          placeholder="Shop ara..."
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

      {/* Kategoriler */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {['Tümü', 'Süpermarket', 'Manav', 'Kasap', 'Şarküteri', 'Bakkal'].map((category, index) => (
          <TouchableOpacity key={index} style={styles.categoryItem}>
            <Text style={styles.categoryText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Market Listesi */}
      <FlatList
        data={filteredShops}
        renderItem={renderShopCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadShops}
            colors={['#FF6B00']}
            tintColor="#FF6B00"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="store" size={50} color="#888" />
            <Text style={styles.emptyText}>Shop bulunamadı</Text>
          </View>
        }
      />
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
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  cartButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginHorizontal: 15,
    marginBottom: 10,
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
  categoriesContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  categoryItem: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    elevation: 1,
  },
  categoryText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  shopCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shopImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  shopMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopAddress: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 14,
    color: '#FF6B00',
    marginLeft: 4,
    fontWeight: '600',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
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
});

export default ShopScreen;