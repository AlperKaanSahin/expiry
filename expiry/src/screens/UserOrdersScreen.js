import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native';
import { fetchUserOrders } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserOrdersScreen = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const userId = await AsyncStorage.getItem('@userId');
            const data = await fetchUserOrders(userId);
            setOrders(data);
        } catch (error) {
            Alert.alert('Hata', error.toString());
        } finally {
            setLoading(false);
        }
    };
    const activeOrders = orders.filter(order => order.status !== 'completed' && order.status.toLowerCase() !== 'teslim edildi');
    const pastOrders = orders.filter(order => order.status === 'completed' || order.status.toLowerCase() === 'teslim edildi');
    const handleUserConfirm = async (orderId) => {
        try {
            await confirmReceivedByUser(orderId);
            loadOrders();
            Alert.alert('Başarılı', 'Teslim alındı olarak işaretlendi');
        } catch (error) {
            Alert.alert('Hata', error.toString());
        }
    };
    useEffect(() => {
        loadOrders();
    }, []);

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'hazırlanıyor': return '#FFA000';
            case 'yolda': return '#2196F3';
            case 'teslim edildi': return '#4CAF50';
            case 'iptal edildi': return '#F44336';
            default: return '#9E9E9E';
        }
    };

    const renderOrderItem = ({ item }) => (
        <View style={styles.orderItem}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Sipariş #{item.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.orderFooter}>
                <Text style={styles.priceText}>{item.totalPrice} ₺</Text>
                {/* Teslim Aldım butonu: Sadece Yolda ve kullanıcı henüz teslim almadıysa */}
                {item.status.toLowerCase() === 'yolda' && !item.isReceivedByUser && (
                    <TouchableOpacity
                        style={[styles.button, styles.deliveredButton]}
                        onPress={() => handleUserConfirm(item.id)}
                    >
                        <Text style={styles.buttonText}>Teslim Aldım</Text>
                    </TouchableOpacity>
                )}
                {/* Market teslim ettiyse ama kullanıcı henüz teslim almadıysa bilgi gösterebilirsin */}
                {item.status === 'Yolda' && item.isReceivedByMarket && !item.isReceivedByUser && (
                    <Text style={{ color: '#2196F3', fontWeight: 'bold', marginLeft: 8 }}>
                        Satıcı teslim etti, onayınızı bekliyor.
                    </Text>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Aktif Siparişlerim</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#6200EE" style={styles.loader} />
            ) : activeOrders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Aktif siparişiniz yok</Text>
                </View>
            ) : (
                <FlatList
                    data={activeOrders}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderOrderItem}
                    contentContainerStyle={styles.listContent}
                />
            )}

            <Text style={styles.title}>Geçmiş Siparişlerim</Text>
            {pastOrders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Geçmiş siparişiniz yok</Text>
                </View>
            ) : (
                <FlatList
                    data={pastOrders}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderOrderItem}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        padding: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    loader: {
        marginTop: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
    },
    button: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        marginLeft: 8,
    },
    deliveredButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
    },
    listContent: {
        paddingBottom: 20,
    },
    orderItem: {
        backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    orderId: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6200EE',
    },
});

export default UserOrdersScreen;