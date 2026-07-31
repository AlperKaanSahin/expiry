import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ShopGate from './ShopGate';
import NotificationScreen from '../../screens/NotificationScreen';
import ScanQRScreen from '../../screens/ScanQRScreen';
import DeliveryConfirmedScreen from '../../screens/DeliveryConfirmedScreen';

const Stack = createStackNavigator();

export default function ShopRoot() {
  return (
    <Stack.Navigator
  screenOptions={{
    headerShown: false,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
  }}
>
      <Stack.Screen name="ShopMain" component={ShopGate} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="ScanQRScreen" component={ScanQRScreen} />
      <Stack.Screen name="DeliveryConfirmedScreen" component={DeliveryConfirmedScreen} />
    </Stack.Navigator>
  );
}