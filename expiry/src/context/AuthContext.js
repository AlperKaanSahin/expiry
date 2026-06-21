import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, fetchShopProfile } from '../services/api';
import { authEvents } from '../events/authEvents';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('@token');
      const userData = await AsyncStorage.getItem('@user');

      setUserToken(token);

      const parsedUser = userData ? JSON.parse(userData) : null;
      setUser(parsedUser);

      if (parsedUser?.role === 'market') {
        const shopData = await fetchShopProfile();
        setShop(shopData?.shop || shopData);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuth();

    const unsubscribe = authEvents.subscribe((event) => {
      if (event === 'LOGOUT') {
        setUserToken(null);
        setUser(null);
        setShop(null);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });

    await AsyncStorage.setItem('@token', res.accessToken);
    await AsyncStorage.setItem('@refreshToken', res.refreshToken);
    await AsyncStorage.setItem('@user', JSON.stringify(res.user));
    await AsyncStorage.setItem('@userId', res.user.id.toString());

    setUserToken(res.accessToken);
    setUser(res.user);

    if (res.user.role === 'market') {
      const shopData = await fetchShopProfile();
      setShop(shopData?.shop || shopData);
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['@token', '@refreshToken', '@user', '@userId']);
    setUserToken(null);
    setUser(null);
    setShop(null);
  };

  const isAdmin = user?.role === 'admin';
  const isMarket = user?.role === 'market';
  const isMarketActive = isMarket && shop?.status?.toLowerCase() === 'active';

  return (
    <AuthContext.Provider
      value={{
        userToken,
        user,
        shop,
        login,
        logout,
        loading,
        isAdmin,
        isMarket,
        isMarketActive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};