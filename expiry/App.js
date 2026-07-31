import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { useFonts, Fraunces_500Medium, Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthProvider, useAuth } from './src/context/AuthContext';

import AuthStack from './src/navigation/AuthStack';
import AppStack from './src/navigation/AppStack';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  release: '1.0.0',
});

const RootNavigator = () => {
  const { userToken, loading } = useAuth();
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
    return <AppStack />;
  }

  return <AuthStack initialRouteName={hasSeenOnboarding ? 'Welcome' : 'Onboarding'} />;
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
      <Toast />
    </>
  );
}