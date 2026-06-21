import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, fetchShopProfile } from '../services/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  // -------------------------
  // LOAD FROM STORAGE
  // -------------------------
const loadAuth = async () => {
  try {
    const token = await AsyncStorage.getItem('@token');
    const userData = await AsyncStorage.getItem('@user');

    setUserToken(token);

    const parsedUser = userData ? JSON.parse(userData) : null;
    setUser(parsedUser);

    if (parsedUser?.role === 'market') {
      const shopData = await fetchShopProfile();
      const normalizedShop = shopData?.shop || shopData;
      setShop(normalizedShop);
    }

  } catch (err) {
    console.log('Auth load error:', err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadAuth();
  }, []);

  // -------------------------
  // LOGIN
  // -------------------------
  const login = async (email, password) => {
    const res = await loginUser({ email, password });

    await AsyncStorage.setItem('@token', res.token);
    await AsyncStorage.setItem('@user', JSON.stringify(res.user));
    await AsyncStorage.setItem('@userId', res.user.id.toString());

    setUserToken(res.token);
    setUser(res.user);

    // MARKET ise shop çek
    if (res.user.role === 'market') {
      const shopData = await fetchShopProfile();
      setShop(shopData);
    }
  };

  // -------------------------
  // LOGOUT
  // -------------------------
  const logout = async () => {
    await AsyncStorage.multiRemove(['@token', '@user', '@userId']);

    setUserToken(null);
    setUser(null);
    setShop(null);
  };

  // -------------------------
  // COMPUTED FLAGS (EN ÖNEMLİ KISIM)
  // -------------------------
const isAdmin = user?.role === 'admin';
const isMarket = user?.role === 'market';

const isMarketActive =
  isMarket && shop?.status?.toLowerCase() === 'active';

  return (
    <AuthContext.Provider
      value={{
        userToken,
        user,
        shop,
        login,
        logout,
        loading,

        // 👇 computed flags
        isAdmin,
        isMarket,
        isMarketActive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};