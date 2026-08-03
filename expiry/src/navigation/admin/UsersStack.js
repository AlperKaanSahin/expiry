import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import UserListScreen from '../../screens/UserListScreen';
import UserDetailsScreen from '../../screens/UserDetailsScreen';

const Stack = createStackNavigator();

export default function UsersStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="UserListScreen" component={UserListScreen} />
      <Stack.Screen name="UserDetailsScreen" component={UserDetailsScreen} />
    </Stack.Navigator>
  );
}