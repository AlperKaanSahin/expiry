import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAuth = async () => {
    const token = await AsyncStorage.getItem('@token');
    const userData = await AsyncStorage.getItem('@user');

    setUserToken(token);
    setUser(userData ? JSON.parse(userData) : null);

    setLoading(false);
  };

  useEffect(() => {
    loadAuth();
  }, []);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });

    await AsyncStorage.setItem('@token', res.token);
    await AsyncStorage.setItem('@user', JSON.stringify(res.user));
    await AsyncStorage.setItem('@userId', res.user.id.toString());

    setUserToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@token');
    await AsyncStorage.removeItem('@user');

    setUserToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ userToken, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};