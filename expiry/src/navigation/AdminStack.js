import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminPanelScreen from '../screens/AdminPanelScreen';

const Stack = createStackNavigator();

export default function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
    </Stack.Navigator>
  );
}