import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ShopScreen from '../../screens/ShopScreen';
import ShopDetailScreen from '../../screens/ShopDetailScreen';
import PackageDetailScreen from '../../screens/PackageDetailScreen';
import PaymentScreen from '../../screens/PaymentScreen';
import RateShopScreen from '../../screens/RateShopScreen';

const Stack = createStackNavigator();

export default function BrowseStack() {
  return (
    <Stack.Navigator
  screenOptions={{
    headerShown: false,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
  }}
>
      <Stack.Screen name="Shops" component={ShopScreen} />
      <Stack.Screen name="ShopDetail" component={ShopDetailScreen} />
      <Stack.Screen name="PackageDetail" component={PackageDetailScreen} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen name="RateShopScreen" component={RateShopScreen} />
    </Stack.Navigator>
  );
}