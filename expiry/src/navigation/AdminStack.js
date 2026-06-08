import UserListScreen from '../screens/UserListScreen';
import MarketListScreen from '../screens/MarketListScreen';
import { createStackNavigator } from '@react-navigation/stack';

import AdminPanelScreen from '../screens/AdminPanelScreen';

const Stack = createStackNavigator();

export default function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
      <Stack.Screen name="UserListScreen" component={UserListScreen} />
      <Stack.Screen name="MarketListScreen" component={MarketListScreen} />

    </Stack.Navigator>
  );
}