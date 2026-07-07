import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ShopPanelScreen from '../screens/ShopPanelScreen';
import ShopProductsScreen from '../screens/ShopProductsScreen';
import ShopPackagesScreen from '../screens/ShopPackagesScreen';
import ShopOrdersScreen from '../screens/ShopOrdersScreen';
import ShopProfileScreen from '../screens/ShopProfileScreen';
import ShopApplyScreen from '../screens/ShopApplyScreen';
import RateShopScreen from '../screens/RateShopScreen';

const Stack = createStackNavigator();

export default function ShopStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ShopPanel" component={ShopPanelScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ShopProducts" component={ShopProductsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ShopPackages" component={ShopPackagesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ShopOrders" component={ShopOrdersScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ShopProfile" component={ShopProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ShopApply" component={ShopApplyScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RateShopScreen"component={RateShopScreen}options={{ headerShown: false }}/>
    </Stack.Navigator>
  );
}