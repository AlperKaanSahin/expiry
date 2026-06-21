import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MarketPanelScreen from '../screens/MarketPanelScreen';
import MarketProductsScreen from '../screens/MarketProductsScreen';
import MarketPackagesScreen from '../screens/MarketPackagesScreen';
import MarketOrdersScreen from '../screens/MarketOrdersScreen';
import MarketProfileScreen from '../screens/MarketProfileScreen';
import MarketApplyScreen from '../screens/MarketApplyScreen';

const Stack = createStackNavigator();

export default function MarketStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MarketPanel" component={MarketPanelScreen} />
      <Stack.Screen name="MarketProducts" component={MarketProductsScreen} />
      <Stack.Screen name="MarketPackages" component={MarketPackagesScreen} />
      <Stack.Screen name="MarketOrders" component={MarketOrdersScreen} />
      <Stack.Screen name="MarketProfile" component={MarketProfileScreen} />
      <Stack.Screen name="MarketApply" component={MarketApplyScreen} />
    </Stack.Navigator>
  );
}