import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';

const App = () => {
  const [userToken, setUserToken] = useState(null);

  const checkToken = async () => {
    const token = await AsyncStorage.getItem('@token');
    if (isTokenValid(token)) {
      setUserToken(token);
    } else {
      await AsyncStorage.removeItem('@token');
      setUserToken(null);
    }
  };

  function isTokenValid(token) {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch (e) {
      return false;
    }
  }

  useEffect(() => {
    checkToken();
    const interval = setInterval(checkToken, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      <Toast /> 
    </>
  );
};



export default App;
