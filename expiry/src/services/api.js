import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL + '/api',
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
export const updateShopStatus = async (id, status) => {
  const res = await api.put(`/admin/shops/${id}/status`, { status });
  return res.data;
};
export const applyForShop = async (data) => {
  const response = await api.post('/shops/apply', data);
  return response.data;
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

    return response.data; 
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
export const fetchAllShopsAdmin = async () => {
  const res = await api.get('/admin/shops');
  return res.data;
};
export const getProfile = async () => {
  const res = await api.get('/users/profile');
  return res.data;
};

export const getUserById = async (id) => {
  const res = await api.get(`/admin/users/${id}`);
  return res.data;
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
export const fetchMyOrders = async () => {
  const res = await api.get('/orders/user/me');
  return res.data;
};

export const fetchShopOrders = async () => {
  const res = await api.get('/orders/shop/me');
  return res.data || [];   // 👈 kritik
};

export const addMarketProduct = async (product) => {
  try {
    const response = await api.post('/market/products', product);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Ürün eklenemedi';
  }
};
export const updateUserRole = async (id, role) => {
  const res = await api.put(`/admin/users/${id}/role`, {
    role
  });

  return res.data;
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



export const fetchShopProfile = async () => {
  const res = await api.get('/shops/me'); // 👈 
  return res.data;
};
export const updateMarketProfile = async (profile) => {
  const response = await api.put('/market/profile', profile);
  return response.data;
};

export const changeMarketPassword = async ({ password, newPassword }) => {
  const response = await api.put('/market/profile/password', { password, newPassword });
  return response.data;
};
export const changeOrderStatus = async (orderId, status) => {
  const response = await api.post(`/orders/${orderId}/status`, {
    status
  });

  return response.data;
};
export const fetchAllUsers = async (page, limit, search) => {
    const res = await api.get(`/admin/users?page=${page}&limit=${limit}`);
    return res.data;
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
export const fetchNotifications = async () => {
  const res = await api.get('/notifications');
  return res.data;
};
export const markNotificationAsRead = async (id) => {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data;
};
export const fetchAuditLogs = () => {
  console.log("FETCH AUDIT LOGS");
  return api.get('/audit-logs');
};
export { api };

