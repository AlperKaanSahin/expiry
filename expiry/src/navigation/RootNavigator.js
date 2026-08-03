import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

import AuthStack from './AuthStack';
import BottomTabs from './tabs/BottomTabs';
import ShopRoot from './shop/ShopRoot';
import AdminRoot from './admin/AdminRoot';

export default function RootNavigator() {
  const { userToken, user, loading } = useAuth();
  const { currentWorkspace, switchWorkspace, resetToDefault } = useWorkspace();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const seen = await AsyncStorage.getItem('@hasSeenOnboarding');
      setHasSeenOnboarding(seen === 'true');
    };
    checkOnboarding();
  }, [userToken]);

  // Login/logout olduğunda workspace'i role'e göre doğru başlangıç noktasına ayarla
  useEffect(() => {
    if (!userToken) {
      resetToDefault();
      return;
    }
    if (user?.role === 'market' || user?.role === 'admin') {
      switchWorkspace(user.role === 'market' ? 'shop' : 'admin');
    } else {
      switchWorkspace('user');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userToken, user?.role]);

  if (loading || hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (userToken) {
    if (currentWorkspace === 'shop') {
      return <ShopRoot />;
    }
    if (currentWorkspace === 'admin') {
      return <AdminRoot />;
    }
    return <BottomTabs />;
  }

  return <AuthStack initialRouteName={hasSeenOnboarding ? 'Welcome' : 'Onboarding'} />;
}