import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authEvents } from '../events/authEvents';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL + '/api',
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const skipRefresh = originalRequest.url?.includes('/login') ||
                         originalRequest.url?.includes('/register') ||
                         originalRequest.url?.includes('/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !skipRefresh) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('@refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/api/users/refresh`,
          { refreshToken }
        );

        await AsyncStorage.setItem('@token', res.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.multiRemove(['@token', '@refreshToken', '@user', '@userId']);
        authEvents.emit('LOGOUT');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ─── AUTH ────────────────────────────────────────────────
export const registerUser = async (userData) => {
  const response = await api.post('/users/register', userData);
  await AsyncStorage.setItem('@token', response.data.accessToken);
  await AsyncStorage.setItem('@refreshToken', response.data.refreshToken);
  return response.data.user;
};

export const loginUser = async ({ email, password }) => {
  const response = await api.post('/users/login', { email, password });
  await AsyncStorage.setItem('@token', response.data.accessToken);
  await AsyncStorage.setItem('@refreshToken', response.data.refreshToken);
  return response.data;
};

export const getProfile = async () => {
  const res = await api.get('/users/profile');
  return res.data;
};

export const updateProfile = async (data) => {
  const res = await api.put('/users/profile', data);
  return res.data;
};

export const forgotPassword = async (email) => {
  const res = await api.post('/users/forgot-password', { email });
  return res.data;
};

export const resetPassword = async (email, token, newPassword) => {
  const res = await api.post('/users/reset-password', { email, token, newPassword });
  return res.data;
};

export const deleteAccount = async (password) => {
  const res = await api.delete('/users/account', { data: { password } });
  return res.data;
};

// ─── SHOPS ───────────────────────────────────────────────
export const fetchShops = async () => {
  const response = await api.get('/shops');
  return response.data;
};

export const fetchShopProfile = async () => {
  const res = await api.get('/shops/me');
  return res.data;
};

export const applyForShop = async (data) => {
  const response = await api.post('/shops/apply', data);
  return response.data;
};

export const rateShop = async (shopId, rating, orderId) => {
  const response = await api.post('/shops/rate', { shopId, rating, orderId });
  return response.data;
};

export const canRateShop = async (shopId) => {
  const res = await api.get(`/shops/${shopId}/can-rate`);
  return res.data;
};

export const updateShopProfile = async (data) => {
  const res = await api.put('/shops/profile', data);
  return res.data;
};

export const changePassword = async (data) => {
  const res = await api.put('/users/change-password', data);
  return res.data;
};

export const deleteShop = async (id) => {
  const res = await api.delete(`/admin/shops/${id}`);
  return res.data;
};

// ─── PACKAGES ────────────────────────────────────────────
export const fetchShopPackages = async (shopId) => {
  const response = await api.get(`/packages/shop/${shopId}/packages`);
  return response.data;
};

export const fetchPackageDetail = async (packageId) => {
  const response = await api.get(`/packages/${packageId}`);
  return response.data;
};

// ─── SHOP PRODUCTS ───────────────────────────────────────
export const fetchShopProducts = async () => {
  const response = await api.get('/shop/products');
  return response.data;
};

export const addShopProduct = async (product) => {
  const response = await api.post('/shop/products', product);
  return response.data;
};

export const updateShopProduct = async (id, product) => {
  const response = await api.put(`/shop/products/${id}`, product);
  return response.data;
};

export const deleteShopProduct = async (id) => {
  await api.delete(`/shop/products/${id}`);
  return true;
};

// ─── SHOP PACKAGES ───────────────────────────────────────
export const fetchShopOwnPackages = async () => {
  const response = await api.get('/shop/packages');
  return response.data;
};

export const addShopPackage = async (pkg) => {
  const response = await api.post('/shop/packages', pkg);
  return response.data;
};

export const updateShopPackage = async (id, pkg) => {
  const response = await api.put(`/shop/packages/${id}`, pkg);
  return response.data;
};

export const deleteShopPackage = async (id, count) => {
  return await api.delete(`/shop/packages/${id}`, {
    data: count ? { count } : undefined
  });
};

// ─── ORDERS ──────────────────────────────────────────────
export const createOrder = async ({ shopId, packages }) => {
  const response = await api.post('/orders', { shopId, packages });
  return response.data;
};

export const fetchMyOrders = async () => {
  const res = await api.get('/orders/user/me');
  return res.data;
};

export const fetchShopOrders = async () => {
  const res = await api.get('/orders/shop/me');
  return res.data || [];
};

export const changeOrderStatus = async (orderId, status) => {
  const response = await api.post(`/orders/${orderId}/status`, { status });
  return response.data;
};

export const simulatePayment = async (orderId) => {
  const response = await api.post('/orders/simulate-payment', { orderId });
  return response.data;
};

export const confirmOrder = async (orderId) => {
  const response = await api.post(`/orders/${orderId}/confirm`);
  return response.data;
};

export const markOrderDelivered = async (orderId) => {
  const response = await api.post(`/orders/${orderId}/deliver`);
  return response.data;
};

// ─── NOTIFICATIONS ───────────────────────────────────────
export const fetchNotifications = async () => {
  const res = await api.get('/notifications');
  return res.data;
};

export const markNotificationAsRead = async (id) => {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data;
};

export const markAllNotificationsAsRead = async () => {
  const res = await api.patch('/notifications/read-all');
  return res.data;
};

// ─── ADMIN ───────────────────────────────────────────────
export const fetchAllUsers = async (page = 1, limit = 10) => {
  const res = await api.get(`/admin/users?page=${page}&limit=${limit}`);
  return res.data;
};

export const getUserById = async (id) => {
  const res = await api.get(`/admin/users/${id}`);
  return res.data;
};

export const updateUserRole = async (id, role) => {
  const res = await api.put(`/admin/users/${id}/role`, { role });
  return res.data;
};

export const deleteUser = async (userId) => {
  return api.delete(`/admin/users/${userId}`);
};

export const fetchAllShopsAdmin = async () => {
  const res = await api.get('/admin/shops');
  return res.data;
};

export const updateShopStatus = async (id, status) => {
  const res = await api.put(`/admin/shops/${id}/status`, { status });
  return res.data;
};

export const fetchAuditLogs = () => {
  return api.get('/audit-logs');
};

export { api };