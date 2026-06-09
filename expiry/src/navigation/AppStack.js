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
import AdminStack from './AdminStack';
import MarketStack from './MarketStack';
import NotificationScreen from '../screens/NotificationScreen';

const Stack = createStackNavigator();

const AppStack = () => (
  <Stack.Navigator>
    
    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Shops" component={ShopScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ShopDetail" component={ShopDetailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="PackageDetail" component={PackageDetailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="PaymentScreen" component={PaymentScreen} options={{ headerShown: false }} />
    <Stack.Screen name="UserOrders" component={UserOrdersScreen} options={{ headerShown: false }} />
    <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen}/>
    <Stack.Screen name="MarketApply" component={MarketApplyScreen} />
    <Stack.Screen name="AdminStack" component={AdminStack} options={{ headerShown: false }} />
    <Stack.Screen name="MarketStack" component={MarketStack} options={{ headerShown: false }} />
    <Stack.Screen name="Notifications" component={NotificationScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

export default AppStack;