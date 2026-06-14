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
      <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
      <Stack.Screen name="UserListScreen" component={UserListScreen} />
      <Stack.Screen name="ShopListScreen" component={ShopListScreen} />
      <Stack.Screen name="AuditLogsScreen" component={AuditLogsScreen} />
      <Stack.Screen name ="UserDetailsScreen" component={UserDetailsScreen} />

    </Stack.Navigator>
  );
}