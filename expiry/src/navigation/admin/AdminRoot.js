import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminStack from './AdminStack';
import NotificationScreen from '../../screens/NotificationScreen';

const Stack = createStackNavigator();

export default function AdminRoot() {
  return (
    <Stack.Navigator
  screenOptions={{
    headerShown: false,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
  }}
>
      <Stack.Screen name="AdminMain" component={AdminStack} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
    </Stack.Navigator>
  );
}