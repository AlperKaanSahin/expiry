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
import { fetchAllShopsAdmin, deleteShop, createShop, updateShop, createShopWithUser, updateShopStatus } from '../services/api';

const initialMarketState = {
    ownerEmail: '',
    ownerPassword: '',
    ownerFirstName: '',
    ownerLastName: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    taxNumber: '',
    ownerName: ''
};

export default function MarketListScreen() {
    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedShop, setSelectedShop] = useState(null);
    const [newShop, setNewShop] = useState({ ...initialMarketState });

    const loadShops = async () => {
        setLoading(true);
        try {
            const data = await fetchAllShopsAdmin();
            setMarkets(data);
        } catch (error) {
            Alert.alert('Hata', 'Mağazalar yüklenirken bir sorun oluştu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadShops();
    }, []);

    const handleStatus = async (id, status) => {
        try {
            await updateShopStatus(id, status);
            if (status === 'active') {
                Alert.alert('Başarılı', 'Market aktifleştirildi');
            } else if (status === 'rejected') {
                Alert.alert('Başarılı', 'Market reddedildi');
            }
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
            Alert.alert('Başarılı', 'Mağaza başarıyla güncellendi');
        } catch (error) {
            Alert.alert('Hata', 'Mağaza güncellenirken bir sorun oluştu: ' + error.message);
        }
    };

    const handleDeleteMarket = (marketId) => {
        Alert.alert(
            'Silme Onayı',
            'Bu mağazayı silmek istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteShop(marketId);
                            loadShops();
                            Alert.alert('Başarılı', 'Mağaza başarıyla silindi');
                        } catch (error) {
                            Alert.alert('Hata', 'Mağaza silinirken bir sorun oluştu: ' + error.message);
                        }
                    }
                }
            ]
        );
    };

    const getStatusStyle = (status) => {
        switch(status) {
            case 'active': return { bg: '#E8F5E9', color: '#4CAF50', text: 'AKTİF' };
            case 'pending': return { bg: '#FFF3E0', color: '#FF9800', text: 'BEKLEMEDE' };
            case 'rejected': return { bg: '#FFEBEE', color: '#F44336', text: 'REDDEDİLDİ' };
            default: return { bg: '#F5F5F5', color: '#9E9E9E', text: status?.toUpperCase() || 'BİLİNMİYOR' };
        }
    };

    const renderItem = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        const isPending = item.status === 'pending';
        const isActive = item.status === 'active';
        const isRejected = item.status === 'rejected';

        return (
            <View style={styles.marketItem}>
                <View style={styles.marketInfoContainer}>
                    <View style={styles.marketHeader}>
                        <Text style={styles.marketName}>{item.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                            <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.text}</Text>
                        </View>
                    </View>

                    <Text style={styles.marketInfo}>
                        📍 Adres: {item.address || 'Belirtilmemiş'}
                    </Text>

                    <Text style={styles.marketInfo}>
                        📞 Telefon: {item.phone || 'Belirtilmemiş'}
                    </Text>
                </View>

                <View style={styles.buttonContainer}>
                    {isPending && (
                        <>
                            <TouchableOpacity
                                style={styles.approveButton}
                                onPress={() => handleStatus(item.id, 'active')}
                            >
                                <Text style={styles.buttonText}>✓ Onayla</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.rejectButton}
                                onPress={() => handleStatus(item.id, 'rejected')}
                            >
                                <Text style={styles.buttonText}>✗ Reddet</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {isActive && (
                        <>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => {
                                    setSelectedShop(item);
                                    setEditModalVisible(true);
                                }}
                            >
                                <Text style={styles.buttonText}>✎ Düzenle</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteMarket(item.id)}
                            >
                                <Text style={styles.buttonText}>🗑 Sil</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.rejectButton}
                                onPress={() => handleStatus(item.id, 'rejected')}
                            >
                                <Text style={styles.buttonText}>✗ Reddet</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {isRejected && (
                        <>
                            <TouchableOpacity
                                style={styles.approveButton}
                                onPress={() => handleStatus(item.id, 'active')}
                            >
                                <Text style={styles.buttonText}>✓ Onayla</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteMarket(item.id)}
                            >
                                <Text style={styles.buttonText}>🗑 Sil</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        );
    };

    const renderInputField = (
        placeholder,
        value,
        onChange,
        key,
        secure = false,
        keyboardType = 'default',
        maxLength,
        required = false
    ) => (
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
                {placeholder}{required && <Text style={styles.requiredStar}> *</Text>}
            </Text>
            <TextInput
                placeholder={placeholder}
                placeholderTextColor="#999"
                style={styles.input}
                value={value}
                onChangeText={onChange}
                secureTextEntry={secure}
                key={key}
                keyboardType={keyboardType}
                maxLength={maxLength}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🏪 Marketler</Text>
                <View style={styles.statsContainer}>
                    <Text style={styles.statsText}>Toplam: {markets.length}</Text>
                </View>
            </View>



            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6200EE" />
                    <Text style={styles.loadingText}>Yükleniyor...</Text>
                </View>
            ) : (
                <FlatList
                    data={markets}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>🏪</Text>
                            <Text style={styles.emptyText}>Gösterilecek market bulunamadı</Text>
                        </View>
                    }
                />
            )}



            {/* Market Düzenle Modalı */}
            <Modal visible={editModalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Market Düzenle</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {renderInputField("Mağaza Adı", selectedShop?.name, (text) => setSelectedShop({ ...selectedShop, name: text }), "edit-name", false, "default", undefined, true)}
                            {renderInputField("Adres", selectedShop?.address, (text) => setSelectedShop({ ...selectedShop, address: text }), "edit-address")}
                            {renderInputField("Telefon", selectedShop?.phone, (text) => setSelectedShop({ ...selectedShop, phone: text }), "edit-phone", false, "phone-pad", 10, true)}
                            {renderInputField("E-posta", selectedShop?.email, (text) => setSelectedShop({ ...selectedShop, email: text }), "edit-email", false, "email-address")}
                            {renderInputField("Sahip Adı", selectedShop?.ownerFirstName, (text) => setSelectedShop({ ...selectedShop, ownerFirstName: text }), "edit-ownerFirstName")}
                            {renderInputField("Sahip Soyadı", selectedShop?.ownerLastName, (text) => setSelectedShop({ ...selectedShop, ownerLastName: text }), "edit-ownerLastName")}

                            <View style={styles.modalButtonContainer}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.saveButton]}
                                    onPress={handleEditMarket}
                                >
                                    <Text style={styles.modalButtonText}>Kaydet</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setEditModalVisible(false)}
                                >
                                    <Text style={styles.modalButtonText}>İptal</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#212529',
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
    addButton: {
        backgroundColor: '#6200EE',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    addButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6C757D',
    },
    marketItem: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    marketInfoContainer: {
        marginBottom: 12,
    },
    marketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    marketName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#212529',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    marketInfo: {
        fontSize: 13,
        color: '#6C757D',
        marginBottom: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    approveButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
    },
    rejectButton: {
        backgroundColor: '#F44336',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
    },
    editButton: {
        backgroundColor: '#FF9800',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: '#F44336',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 12,
    },
    inputContainer: {
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 13,
        color: '#495057',
        marginBottom: 4,
        fontWeight: '500',
    },
    requiredStar: {
        color: '#F44336',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E9ECEF',
        borderRadius: 10,
        padding: 12,
        backgroundColor: '#FFF',
        fontSize: 14,
        color: '#212529',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        width: '90%',
        maxHeight: '85%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#212529',
    },
    closeButton: {
        fontSize: 20,
        color: '#6C757D',
        fontWeight: '600',
        padding: 4,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 20,
        marginBottom: 10,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
    },
    cancelButton: {
        backgroundColor: '#F44336',
    },
    modalButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    listContent: {
        paddingTop: 12,
        paddingBottom: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 50,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#6C757D',
    },
});