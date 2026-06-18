import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import ShopScreen from '../screens/ShopScreen'; 
import ShopDetailScreen from '../screens/ShopDetailScreen'; 
import PackageDetailScreen from '../screens/PackageDetailScreen';
import ShopPanelScreen from '../screens/ShopPanelScreen';
import ShopProductsScreen from '../screens/ShopProductsScreen';
import ShopPackagesScreen from '../screens/ShopPackagesScreen';
import ShopOrdersScreen from '../screens/ShopOrdersScreen';
import ShopProfileScreen from '../screens/ShopProfileScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import PaymentScreen from '../screens/PaymentScreen'; 
import UserOrdersScreen from '../screens/UserOrdersScreen'; 
import UserListScreen from '../screens/UserListScreen'; 
import ShopListScreen from '../screens/ShopListScreen'; 
import UserProfileScreen from '../screens/UserProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import UserDetailsScreen from '../screens/UserDetailsScreen';
import ShopApplyScreen from '../screens/ShopApplyScreen';
import AdminStack from './AdminStack';
import ShopStack from './ShopStack';
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
    <Stack.Screen name="ShopApply" component={ShopApplyScreen} />
    <Stack.Screen name="AdminStack" component={AdminStack} options={{ headerShown: false }} />
    <Stack.Screen name="ShopStack" component={ShopStack} options={{ headerShown: false }} />
    <Stack.Screen name="Notifications" component={NotificationScreen} options={{ headerShown: false }} />

  </Stack.Navigator>
);

export default AppStack;