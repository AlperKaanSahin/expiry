import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Fraunces_500Medium, Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import Toast from 'react-native-toast-message';

import { AuthProvider } from './src/context/AuthContext';
import { WorkspaceProvider } from './src/context/WorkspaceContext';
import RootNavigator from './src/navigation/RootNavigator';
import NotificationTapHandler from './src/components/NotificationTapHandler';
import * as Sentry from '@sentry/react-native';
import { setupTokenRefreshListener } from './src/utils/pushNotifications';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  release: '1.0.0',
});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });

  useEffect(() => {
    if (fontError) {
      console.log('FONT ERROR:', fontError);
    }
  }, [fontError]);

  useEffect(() => {
    const unsubscribe = setupTokenRefreshListener();
    return unsubscribe;
  }, []);

  if (fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text>{String(fontError)}</Text>
      </View>
    );
  }

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <NotificationTapHandler />
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </WorkspaceProvider>
      </AuthProvider>
      <Toast />
    </SafeAreaProvider>
  );
}