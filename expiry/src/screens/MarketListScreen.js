import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';

import {
    fetchAllShopsAdmin,
    deleteShop,
    updateShop,
    updateShopStatus
} from '../services/api';
import {
    actionsByStatus,
    actionToStatus,
    actionLabels,
    actionColors
} from '../constants/shopWorkflow';


export default function MarketListScreen({ navigation }) {
    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedShop, setSelectedShop] = useState(null);

    useEffect(() => {
        loadShops();
    }, []);

    const loadShops = async () => {
        setLoading(true);
        try {
            const data = await fetchAllShopsAdmin();
            setMarkets(data);
        } catch (error) {
            Alert.alert('Hata', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatus = async (id, status) => {
        try {
            await updateShopStatus(id, status);
            Alert.alert('Başarılı', 'İşlem tamamlandı');
            loadShops();
        } catch (err) {
            Alert.alert('Hata', err.message);
        }
    };

    const handleEditMarket = async () => {
        try {
            await updateShop(selectedShop.id, selectedShop);
            setEditModalVisible(false);
            setSelectedShop(null);
            loadShops();
        } catch (error) {
            Alert.alert('Hata', error.message);
        }
    };

    const handleDeleteMarket = async (id) => {
        Alert.alert(
            'Silme Onayı',
            'Bu marketi silmek istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                { 
                    text: 'Sil', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteShop(id);
                            loadShops();
                        } catch (error) {
                            Alert.alert('Hata', error.message);
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status) => {
        if (status === 'active') return '#4CAF50';
        if (status === 'pending') return '#FF9800';
        if (status === 'inactive') return '#F44336';
        if (status === 'rejected') return '#9E9E9E';
        return '#6200EE';
    };

    const getStatusText = (status) => {
        if (status === 'active') return 'Aktif';
        if (status === 'pending') return 'Beklemede';
        if (status === 'inactive') return 'Pasif';
        if (status === 'rejected') return 'Reddedildi';
        return status;
    };

const renderActions = (item) => {
    const actions = actionsByStatus[item.status] || [];

    return actions.map((action) => (
        <TouchableOpacity
            key={action}
            onPress={() => handleStatus(item.id, actionToStatus[action])}
            style={[
                styles.actionButton,
                { backgroundColor: actionColors[action] }
            ]}
        >
            <Text style={styles.actionButtonText}>
                {actionLabels[action]}
            </Text>
        </TouchableOpacity>
    ));
};

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.shopName}>{item.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                </View>
            </View>

            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Adres:</Text>
                <Text style={styles.infoValue}>{item.address}</Text>
            </View>

            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Telefon:</Text>
                <Text style={styles.infoValue}>{item.phone || 'Belirtilmemiş'}</Text>
            </View>

            <View style={styles.actionContainer}>
                {renderActions(item)}
                <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteMarket(item.id)}
                >
                    <Text style={styles.deleteButtonText}>Sil</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6200EE" />
                <Text style={styles.loadingText}>Marketler yükleniyor...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>


            <FlatList
                data={markets}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🏪</Text>
                        <Text style={styles.emptyText}>Henüz market bulunmuyor</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 24,
        color: '#333',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerRight: {
        width: 40,
    },
    listContent: {
        padding: 12,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    shopName: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    statusText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    infoLabel: {
        width: 55,
        fontSize: 13,
        color: '#666',
    },
    infoValue: {
        flex: 1,
        fontSize: 13,
        color: '#333',
    },
    actionContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginRight: 8,
        marginBottom: 4,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '500',
    },
    deleteButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F44336',
        borderRadius: 6,
    },
    deleteButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#666',
    },
});