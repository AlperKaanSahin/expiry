import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import ShopScreen from '../screens/ShopScreen'; 
import ShopDetailScreen from '../screens/ShopDetailScreen'; 
import PackageDetailScreen from '../screens/PackageDetailScreen';
import MarketPanelScreen from '../screens/MarketPanelScreen';
import MarketProductsScreen from '../screens/MarketProductsScreen';
import MarketPackagesScreen from '../screens/MarketPackagesScreen';
import MarketOrdersScreen from '../screens/MarketOrdersScreen';
import MarketProfileScreen from '../screens/MarketProfileScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import PaymentScreen from '../screens/PaymentScreen'; 
import UserOrdersScreen from '../screens/UserOrdersScreen'; 
import UserListScreen from '../screens/UserListScreen'; 
import MarketListScreen from '../screens/MarketListScreen'; 
import UserProfileScreen from '../screens/UserProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import UserDetailsScreen from '../screens/UserDetailsScreen';
import MarketApplyScreen from '../screens/MarketApplyScreen';

const Stack = createStackNavigator();

const AppStack = () => (
  <Stack.Navigator>
    
    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Shops" component={ShopScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ShopDetail" component={ShopDetailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="PackageDetail" component={PackageDetailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="MarketPanel" component={MarketPanelScreen} />
    <Stack.Screen name="MarketProducts" component={MarketProductsScreen} />
    <Stack.Screen name="MarketPackages" component={MarketPackagesScreen} />
    <Stack.Screen name="MarketOrders" component={MarketOrdersScreen} />
    <Stack.Screen name="MarketProfile" component={MarketProfileScreen} />
    <Stack.Screen name="AdminPanel" component={AdminPanelScreen} options={{ headerShown: false }} />
    <Stack.Screen name="PaymentScreen" component={PaymentScreen} options={{ headerShown: false }} />
    <Stack.Screen name="UserOrders" component={UserOrdersScreen} options={{ headerShown: false }} />
    <Stack.Screen name="UserListScreen" component={UserListScreen} options={{ headerShown: false }} />
    <Stack.Screen name="UserDetailsScreen" component={UserDetailsScreen} options={{ headerShown: false }} /> 
    <Stack.Screen name="MarketListScreen" component={MarketListScreen} options={{ headerShown: false }} />
    <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    <Stack.Screen name="MarketApply" component={MarketApplyScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen}
/>

  </Stack.Navigator>
);

export default AppStack;