import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:3000/api'
});

// TOKEN varsa ekle
API.interceptors.request.use(async (config) => {
    const token = await require('@react-native-async-storage/async-storage')
        .default.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// ORDERS
export const fetchUserOrders = (userId) =>
    API.get(`/orders/user/${userId}`).then(res => res.data);

export const confirmReceivedByUser = (orderId) =>
    API.post(`/orders/${orderId}/confirm-user`).then(res => res.data);