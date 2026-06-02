import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';

const SettingsScreen = ({ navigation }) => {

  const { logout } = useAuth();

  const settingsItems = [
    {
      title: 'Profil Bilgileri',
      icon: 'person',
      onPress: () => navigation.navigate('UserProfile'),
    },
    {
      title: 'Şifre Değiştir',
      icon: 'lock',
      onPress: () => console.log('Şifre değiştir'),
    },
    {
      title: 'Bildirimler',
      icon: 'notifications',
      onPress: () => console.log('Bildirimler'),
    },
    {
      title: 'Dark Mode',
      icon: 'dark-mode',
      onPress: () => console.log('Dark mode'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>

        <Text style={styles.header}>Ayarlar</Text>

        {settingsItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.item}
            onPress={item.onPress}
          >
            <View style={styles.left}>
              <Icon name={item.icon} size={24} color="#333" />
              <Text style={styles.itemText}>{item.title}</Text>
            </View>

            <Icon name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
        >
          <Icon name="logout" size={22} color="#FFF" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },

  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#333',
  },

  item: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    elevation: 2,
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  itemText: {
    marginLeft: 14,
    fontSize: 16,
    color: '#333',
  },

  logoutButton: {
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 12,

    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

    marginTop: 30,
  },

  logoutText: {
    color: '#FFF',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});