import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import UserOrdersScreen from "../../screens/UserOrdersScreen";
import OrderQRScreen from "../../screens/OrderQRScreen";
import RateShopScreen from "../../screens/RateShopScreen";


const Stack = createStackNavigator();

export default function OrdersStack() {
  return (
    <Stack.Navigator
  screenOptions={{
    headerShown: false,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
  }}
>
        <Stack.Screen name="UserOrders" component={UserOrdersScreen} />
        <Stack.Screen name="OrderQRScreen" component={OrderQRScreen}  />
        <Stack.Screen name="RateShopScreen" component={RateShopScreen}  />
    </Stack.Navigator>
  );
}