import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getProfile } from '../services/api';

export default function UserProfileScreen({ navigation }) {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      setUser(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Icon name="person" size={64} color="#6200EE" />
        <Text style={styles.title}>Profilim</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Ad Soyad:</Text>
        <Text style={styles.value}>
          {user?.firstName} {user?.lastName}
        </Text>

        <Text style={styles.label}>E-posta:</Text>
        <Text style={styles.value}>{user?.email}</Text>

        <Text style={styles.label}>Rol:</Text>
        <Text style={styles.value}>{user?.role}</Text>
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Icon name="edit" size={20} color="#FFF" />
        <Text style={styles.editText}>Profili Düzenle</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200EE',
    marginTop: 8,
  },
  infoBox: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 32,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  value: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6200EE',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 2,
  },
  editText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  }
});