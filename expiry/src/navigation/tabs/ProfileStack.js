import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import UserProfileScreen from '../../screens/UserProfileScreen';
import SettingsScreen from '../../screens/SettingsScreen';
import EditProfileScreen from '../../screens/EditProfileScreen';

const Stack = createStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator
  screenOptions={{
    headerShown: false,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
  }}
>
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}