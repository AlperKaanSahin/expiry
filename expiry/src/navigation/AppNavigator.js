import { createStackNavigator } from '@react-navigation/stack';
import { ROUTES } from './routes';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import ShopScreen from '../screens/ShopScreen';
import ShopDetailScreen from '../screens/ShopDetailScreen'; 
import MarketPanelScreen from '../screens/MarketPanelScreen';
import MarketProductsScreen from '../screens/MarketProductsScreen';
import MarketPackagesScreen from '../screens/MarketPackagesScreen';
import MarketOrdersScreen from '../screens/MarketOrdersScreen';
import MarketProfileScreen from '../screens/MarketProfileScreen';
import PackageDetailScreen from '../screens/PackageDetailScreen';
import HomeScreen from '../screens/HomeScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import PaymentScreen from '../screens/PaymentScreen'; 
import UserOrdersScreen from '../screens/UserOrdersScreen'; 
import UserListScreen from '../screens/UserListScreen'; 
import MarketListScreen from '../screens/MarketListScreen'; 

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName={ROUTES.WELCOME}>
      <Stack.Screen
        name={ROUTES.WELCOME}
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
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
      <Stack.Screen name="MarketListScreen" component={MarketListScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default AppNavigator;