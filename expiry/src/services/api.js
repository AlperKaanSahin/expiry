import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_HOST = '192.168.1.114';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});


// Her istekte token'ı header'a ekle
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const registerUser = async (userData) => {
  try {
    console.log('Register request:', userData);
    const response = await api.post('/users/register', userData);
    console.log('Register response:', response.data);
    await AsyncStorage.setItem('@token', response.data.token);
    return response.data.user;
  } catch (error) {
    console.log('Register error:', error.response?.data || error);
    throw error.response?.data?.error || 'Kayıt başarısız';
  }
};
export const rateShop = async (shopId, rating) => {
  try {
    const response = await api.post('/shops/rate', { shopId, rating });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Puan gönderilemedi';
  }
};

export const loginUser = async ({ email, password }) => {
  try {
    console.log('Login request:', { email, password });

    const response = await api.post('/users/login', { email, password });

    console.log('Login response:', response.data);

    return response.data; // 🔥 TEK DOĞRU SATIR
  } catch (error) {
    console.log('Login error:', error.response?.data || error);
    throw error.response?.data?.error || 'Giriş başarısız';
  }
};

export const createOrder = async ({ shopId, packages }) => {

  const totalPrice = packages.reduce((sum, pkg) => sum + (pkg.price * pkg.quantity), 0);
  const response = await api.post('/orders', {
    shopId,
    packages,
    totalPrice
  });
  return response.data;
};

export const fetchShops = async () => {
  try {
    const response = await api.get('/shops');
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Marketler yüklenemedi';
  }

};

export const fetchUserOrders = async (userId) => {
  const response = await api.get(`/orders/user/${userId}`);
  return response.data;
};
export const getShopOrders = async (shopId) => {
  try {
    const response = await api.get(`/orders/shop/${shopId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Siparişler alınamadı';
  }
};
export const fetchShopPackages = async (shopId) => {
  const response = await api.get(`/packages/shop/${shopId}/packages`);
  return response.data;
};
export const fetchPackageDetail = async (packageId) => {
  try {
    const response = await api.get(`/packages/${packageId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Kutu detayları yüklenemedi';
  }
};
export const fetchMarketProducts = async () => {
  try {
    const response = await api.get('/market/products');
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Ürünler yüklenemedi';
  }
};

export const addMarketProduct = async (product) => {
  try {
    const response = await api.post('/market/products', product);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Ürün eklenemedi';
  }
};

export const updateMarketProduct = async (id, product) => {
  try {
    const response = await api.put(`/market/products/${id}`, product);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Ürün güncellenemedi';
  }
};

export const deleteMarketProduct = async (id) => {
  try {
    await api.delete(`/market/products/${id}`);
    return true;
  } catch (error) {
    throw error.response?.data?.error || 'Ürün silinemedi';
  }
};
export const fetchMarketPackages = async () => {
  const response = await api.get('/market/packages');
  return response.data;
};

export const addMarketPackage = async (pkg) => {
  const response = await api.post('/market/packages', pkg);
  return response.data;
};

export const updateMarketPackage = async (id, pkg) => {
  const response = await api.put(`/market/packages/${id}`, pkg);
  return response.data;
};

export async function deleteMarketPackage(id, count) {
  return await api.delete(`/market/packages/${id}`, {
    data: count ? { count } : undefined
  });
}
export const fetchMarketOrders = async (shopId) => {
  const response = await api.get(`/orders/shop/${shopId}`);
  return response.data;
};

export const updateMarketOrderStatus = async (id, status) => {
  const response = await api.put(`/market/orders/${id}`, { status });
  return response.data;
};
export const fetchMarketProfile = async () => {
  const response = await api.get('/market/profile');
  return response.data;
};

export const updateMarketProfile = async (profile) => {
  const response = await api.put('/market/profile', profile);
  return response.data;
};

export const changeMarketPassword = async ({ password, newPassword }) => {
  const response = await api.put('/market/profile/password', { password, newPassword });
  return response.data;
};
export const confirmReceivedByUser = async (orderId) => {
  return api.post(`/orders/${orderId}/confirm-user`);
};

export const confirmReceivedByMarket = async (orderId) => {
  return api.post(`/orders/${orderId}/confirm-market`);
};
export const fetchAllUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const deleteUser = async (userId) => {
  return api.delete(`/admin/users/${userId}`);
};
export const fetchAllMarkets = async () => {
  const response = await api.get('/admin/markets');
  return response.data;
};
export const createMarket = async (market) => {
  const response = await api.post('/admin/markets', market);
  return response.data;
};
export const updateMarket = async (id, market) => {
  const response = await api.put(`/admin/markets/${id}`, market);
  return response.data;
};
export const deleteMarket = async (id) => {
  return api.delete(`/admin/markets/${id}`);
};
export const createMarketWithUser = async (marketData) => {
  const response = await api.post('/admin/markets', marketData);
  return response.data;
};
export { api };

