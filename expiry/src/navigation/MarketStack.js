import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MarketPanelScreen from '../screens/MarketPanelScreen';

const Stack = createStackNavigator();

export default function MarketStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MarketPanel" component={MarketPanelScreen} />
    </Stack.Navigator>
  );
}