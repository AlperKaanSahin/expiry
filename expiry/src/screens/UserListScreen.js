import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { fetchAllUsers, deleteUser } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { TextInput } from 'react-native-gesture-handler';
export default function UserListScreen({ navigation }) {
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const roleStyles = {
  admin: styles.adminBadge,
  user: styles.userBadge,
  market: styles.marketBadge,
};
const [search, setSearch] = useState('');
const [filteredUsers, setFilteredUsers] = useState([]); // Bunu da ekle

const loadUsers = async (pageNumber = 1) => {
    try {
        setLoading(true);
        const data = await fetchAllUsers(pageNumber, limit);
        setUsers(data.users);
        setFilteredUsers(data.users); // BURASI ÖNEMLİ - filtreli listeyi de güncelle
        setTotal(data.total);
        setPage(data.page);
    } catch (error) {
        Alert.alert('Hata', error.toString());
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
    if (search.trim() === '') {
        setFilteredUsers(users);
    } else {
        const filtered = users.filter(user => 
            user.email.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredUsers(filtered);
    }
}, [search, users]);

useFocusEffect(
    React.useCallback(() => {
        loadUsers();
        setSearch(''); // Sayfa her açıldığında aramayı temizle (isteğe bağlı)
    }, [])
);

    const handleDelete = async (userId) => {
        Alert.alert(
            'Silme Onayı',
            'Bu kullanıcıyı silmek istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteUser(userId);
                            loadUsers();
                            Alert.alert('Başarılı', 'Kullanıcı silindi');
                        } catch (error) {
                            Alert.alert('Hata', error.toString());
                        }
                    }
                }
            ]
        );
    };

    const nextPage = () => {
        const maxPage = Math.ceil(total / limit);
        if (page < maxPage) {
            loadUsers(page + 1);
        }
    };

    const prevPage = () => {
        if (page > 1) {
            loadUsers(page - 1);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.userItem}
            onPress={() =>
                navigation.navigate('UserDetailsScreen', {
                    userId: item.id
                })
            }
            activeOpacity={0.7}
        >
            <View style={styles.userContent}>
                <View style={styles.userHeader}>
                    <View style={styles.userIdContainer}>
                        <Text style={styles.userId}>#{item.id}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
                        style={styles.deleteButton}
                    >
                        <Text style={styles.deleteText}>🗑️</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.userInfoContainer}>
                    <Text style={styles.emailLabel}>📧 Email:</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                </View>
                <View style={styles.userInfoContainer}>
                    <Text style={styles.roleLabel}>👤 Rol:</Text>
<View style={[
  styles.roleBadge,
  roleStyles[item.role] || styles.userBadge
]}>
  <Text style={styles.roleText}>{item.role}</Text>
</View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const maxPage = Math.ceil(total / limit);

return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>👥 Kullanıcılar</Text>
            <View style={styles.statsContainer}>
                <Text style={styles.statsText}>Toplam: {total} kullanıcı</Text>
            </View>
        </View>
        
        {loading ? (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200EE" />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        ) : (
            <>
                <TextInput
                    placeholder="Email ile ara..."
                    value={search}
                    onChangeText={(text) => setSearch(text)}
                    style={styles.searchInput}
                    placeholderTextColor="#999"
                />
                <FlatList
                    data={filteredUsers}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContainer}
                />
                
                {total > 0 && (
                    <View style={styles.paginationContainer}>
                        <TouchableOpacity 
                            onPress={prevPage} 
                            style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                            disabled={page === 1}
                        >
                            <Text style={styles.pageBtnText}>◀ Geri</Text>
                        </TouchableOpacity>
                        
                        <View style={styles.pageInfo}>
                            <Text style={styles.pageNumber}>{page}</Text>
                            <Text style={styles.pageSeparator}>/</Text>
                            <Text style={styles.totalPages}>{maxPage}</Text>
                        </View>
                        
                        <TouchableOpacity 
                            onPress={nextPage} 
                            style={[styles.pageBtn, page >= maxPage && styles.pageBtnDisabled]}
                            disabled={page >= maxPage}
                        >
                            <Text style={styles.pageBtnText}>İleri ▶</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </>
        )}
    </SafeAreaView>
);
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#F8F9FA'
    },
    header: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: { 
        fontSize: 24, 
        fontWeight: '700',
        color: '#212529',
    },
    searchInput: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
},
    statsContainer: {
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statsText: {
        fontSize: 12,
        color: '#6C757D',
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6C757D',
    },
    listContainer: {
        padding: 16,
    },
    userItem: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 12, 
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    userContent: {
        padding: 16,
    },
    userHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    userIdContainer: {
        backgroundColor: '#E7F3FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    userId: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0066CC',
    },
    userInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    emailLabel: {
        fontSize: 14,
        color: '#6C757D',
        width: 45,
    },
    userEmail: {
        fontSize: 14,
        color: '#212529',
        flex: 1,
    },
    roleLabel: {
        fontSize: 14,
        color: '#6C757D',
        width: 45,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
    },
    adminBadge: {
        backgroundColor: '#FFF3E0',
    },
    userBadge: {
        backgroundColor: '#E8F5E9',
    },
    marketBadge: {
  backgroundColor: '#4caf50',
},
    roleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FEE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteText: { 
        fontSize: 18,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E9ECEF',
    },
    pageBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#6200EE',
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    pageBtnDisabled: {
        backgroundColor: '#D3D3D3',
        opacity: 0.6,
    },
    pageBtnText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    pageInfo: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    pageNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#6200EE',
    },
    pageSeparator: {
        fontSize: 16,
        color: '#6C757D',
        marginHorizontal: 4,
    },
    totalPages: {
        fontSize: 14,
        color: '#6C757D',
    },
});