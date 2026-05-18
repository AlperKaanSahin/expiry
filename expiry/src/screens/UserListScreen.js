import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { fetchAllUsers, deleteUser } from '../services/api';

export default function UserListScreen({ navigation }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await fetchAllUsers();
            // Sadece silinmemiş kullanıcıları göster
            setUsers(data.filter(user => !user.deletedAt));
        } catch (error) {
            Alert.alert('Hata', error.toString());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleDelete = async (userId) => {
        try {
            await deleteUser(userId);
            loadUsers();
            Alert.alert('Başarılı', 'Kullanıcı silindi');
        } catch (error) {
            Alert.alert('Hata', error.toString());
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.userItem}>
            <View>

                <Text style={styles.userInfo}>ID: {item.id}</Text>
                <Text style={styles.userInfo}>İsim: {item.firstName || 'N/A'}</Text>
                <Text style={styles.userInfo}>Soyisim: {item.lastName || 'N/A'}</Text>
                <Text style={styles.userInfo}>E-posta: {item.email || 'N/A'}</Text>
                <Text style={styles.userInfo}>Telefon: {item.phone || 'N/A'}</Text>
                <Text style={styles.userInfo}>Adres: {item.address || 'N/A'}</Text>
                <Text style={styles.userInfo}>Rol: {item.role}</Text>
                <Text style={styles.userInfo}>Oluşturulma: {item.createdAt}</Text>
                <Text style={styles.userInfo}>
                    Güncelleme: {item.updatedAt === item.createdAt ? 'N/A' : item.updatedAt}
                </Text>
            </View>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>Sil</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}> Kullanıcılar</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#6200EE" />
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#333' },
    userItem: { backgroundColor: '#FFF', padding: 16, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    userName: { fontSize: 16, color: '#333' },
    deleteButton: { backgroundColor: '#FF5252', padding: 8, borderRadius: 6 },
    deleteText: { color: '#FFF', fontWeight: 'bold' },
});