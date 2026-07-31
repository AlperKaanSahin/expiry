import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

import AuthStack from './AuthStack';
import BottomTabs from './tabs/BottomTabs';
import ShopRoot from './shop/ShopRoot';
import AdminRoot from './admin/AdminRoot';

export default function RootNavigator() {
  const { userToken, loading, isAdmin, isMarket, viewMode } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const seen = await AsyncStorage.getItem('@hasSeenOnboarding');
      setHasSeenOnboarding(seen === 'true');
    };
    checkOnboarding();
  }, [userToken]);

  if (loading || hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (userToken) {
    if (isMarket && viewMode === 'panel') {
      return <ShopRoot />;
    }
    if (isAdmin && viewMode === 'panel') {
      return <AdminRoot />;
    }
    return <BottomTabs />;
  }

  return <AuthStack initialRouteName={hasSeenOnboarding ? 'Welcome' : 'Onboarding'} />;
}