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
      <Stack.Screen name="ShopPanel" component={ShopPanelScreen} />
      <Stack.Screen name="ShopProducts" component={ShopProductsScreen} />
      <Stack.Screen name="ShopPackages" component={ShopPackagesScreen} />
      <Stack.Screen name="ShopOrders" component={ShopOrdersScreen} />
      <Stack.Screen name="ShopProfile" component={ShopProfileScreen} />
      <Stack.Screen name="ShopApply" component={ShopApplyScreen} />
      <Stack.Screen name="RateShopScreen"component={RateShopScreen}options={{ headerShown: false }}/>
    </Stack.Navigator>
  );
}