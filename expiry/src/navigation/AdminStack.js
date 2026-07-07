import UserListScreen from '../screens/UserListScreen';
import ShopListScreen from '../screens/ShopListScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import AuditLogsScreen from '../screens/AuditLogsScreen';
import UserDetailsScreen from '../screens/UserDetailsScreen';

import { createStackNavigator } from '@react-navigation/stack';


const Stack = createStackNavigator();

export default function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminPanel" component={AdminPanelScreen} options={{ headerShown: false }} />
      <Stack.Screen name="UserListScreen" component={UserListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ShopListScreen" component={ShopListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AuditLogsScreen" component={AuditLogsScreen} options={{ headerShown: false }} />
      <Stack.Screen name ="UserDetailsScreen" component={UserDetailsScreen} options={{ headerShown: false }} />

    </Stack.Navigator>
  );
}