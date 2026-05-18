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
import { fetchAllMarkets, deleteMarket, createMarket, updateMarket, createMarketWithUser } from '../services/api';

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
    const [selectedMarket, setSelectedMarket] = useState(null);
    const [newMarket, setNewMarket] = useState({ ...initialMarketState });

    const loadMarkets = async () => {
        setLoading(true);
        try {
            const data = await fetchAllMarkets();
            setMarkets(data);
        } catch (error) {
            Alert.alert('Hata', 'Marketler yüklenirken bir sorun oluştu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMarkets();
    }, []);

    const handleAddMarket = async () => {
        try {
            await createMarketWithUser(newMarket);
            setAddModalVisible(false);
            setNewMarket({ ...initialMarketState });
            loadMarkets();
            Alert.alert('Başarılı', 'Market başarıyla eklendi');
        } catch (error) {
            Alert.alert('Hata', 'Market eklenirken bir sorun oluştu: ' + error.message);
        }
    };

    const handleEditMarket = async () => {
        try {
            await updateMarket(selectedMarket.id, selectedMarket);
            setEditModalVisible(false);
            setSelectedMarket(null);
            loadMarkets();
            Alert.alert('Başarılı', 'Market başarıyla güncellendi');
        } catch (error) {
            Alert.alert('Hata', 'Market güncellenirken bir sorun oluştu: ' + error.message);
        }
    };

    const handleDeleteMarket = (marketId) => {
        Alert.alert(
            'Silme Onayı',
            'Bu marketi silmek istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    onPress: async () => {
                        try {
                            await deleteMarket(marketId);
                            loadMarkets();
                            Alert.alert('Başarılı', 'Market başarıyla silindi');
                        } catch (error) {
                            Alert.alert('Hata', 'Market silinirken bir sorun oluştu: ' + error.message);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <View style={styles.marketItem}>
            <View style={styles.marketInfoContainer}>
                <Text style={styles.marketName}>{item.name}</Text>
                <Text style={styles.marketInfo}>Adres: {item.address || 'Belirtilmemiş'}</Text>
                <Text style={styles.marketInfo}>Telefon: {item.phone || 'Belirtilmemiş'}</Text>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                        setSelectedMarket(item);
                        setEditModalVisible(true);
                    }}
                >
                    <Text style={styles.buttonText}>Düzenle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteMarket(item.id)}
                >
                    <Text style={styles.buttonText}>Sil</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderInputField = (
        placeholder,
        value,
        onChange,
        key,
        secure = false,
        keyboardType = 'default',
        maxLength,
        extraProps = {}
    ) => (
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
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Market Listesi</Text>

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setAddModalVisible(true)}
            >
                <Text style={styles.addButtonText}>+ Yeni Market Ekle</Text>
            </TouchableOpacity>

            {loading ? (
                <ActivityIndicator size="large" color="#6200EE" style={styles.loader} />
            ) : (
                <FlatList
                    data={markets}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Gösterilecek market bulunamadı</Text>
                    }
                />
            )}

            {/* Market Ekle Modalı */}
            <Modal visible={addModalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <ScrollView keyboardShouldPersistTaps="handled">
                            <Text style={styles.modalTitle}>Yeni Market Ekle</Text>

                            {renderInputField(
                                "Market Adı *",
                                newMarket.name,
                                (text) => setNewMarket({ ...newMarket, name: text }),
                                "name"
                            )}
                            {renderInputField(
                                "Market Sahibi Adı *",
                                newMarket.ownerFirstName,
                                (text) => setNewMarket({ ...newMarket, ownerFirstName: text }),
                                "ownerFirstName"
                            )}

                            {renderInputField(
                                "Market Sahibi Soyadı *",
                                newMarket.ownerLastName,
                                (text) => setNewMarket({ ...newMarket, ownerLastName: text }),
                                "ownerLastName"
                            )}
                            {renderInputField(
                                "Market Sahibi E-posta *",
                                newMarket.ownerEmail,
                                (text) => setNewMarket({ ...newMarket, ownerEmail: text }),
                                "ownerEmail",
                                false,
                                "email-address" 
                            )}

                            {renderInputField(
                                "Market Sahibi Şifre *",
                                newMarket.ownerPassword,
                                (text) => setNewMarket({ ...newMarket, ownerPassword: text }),
                                "ownerPassword",
                                true
                            )}


                            {renderInputField(
                                "Adres",
                                newMarket.address,
                                (text) => setNewMarket({ ...newMarket, address: text }),
                                "address"
                            )}

                            {renderInputField(
                                "Telefon *",
                                newMarket.phone,
                                (text) => {
                                    if (text.length <= 10) {
                                        setNewMarket({ ...newMarket, phone: text });
                                    }
                                },
                                "phone",
                                false,
                                "phone-pad", 
                                10,           
                                { returnKeyType: 'done' }
                            )}

                            <View style={styles.modalButtonContainer}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.saveButton]}
                                    onPress={handleAddMarket}
                                >
                                    <Text style={styles.modalButtonText}>Kaydet</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => {
                                        setAddModalVisible(false);
                                        setNewMarket({ ...initialMarketState });
                                    }}
                                >
                                    <Text style={styles.modalButtonText}>İptal</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Market Düzenle Modalı */}
            <Modal visible={editModalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Market Düzenle</Text>

                        {renderInputField(
                            "Market Adı *",
                            selectedMarket?.name,
                            (text) => setSelectedMarket({ ...selectedMarket, name: text }),
                            "edit-name"
                        )}

                        {renderInputField(
                            "Adres",
                            selectedMarket?.address,
                            (text) => setSelectedMarket({ ...selectedMarket, address: text }),
                            "edit-address"
                        )}

                        {renderInputField(
                            "Telefon *",
                            selectedMarket?.phone,
                            (text) => setSelectedMarket({ ...selectedMarket, phone: text }),
                            "edit-phone"
                        )}
                        {renderInputField(
                            "E-posta",
                            selectedMarket?.email,
                            (text) => setSelectedMarket({ ...selectedMarket, email: text }),
                            "edit-email",
                            false,
                            "email-address" 
                        )}
                        {renderInputField(
                            "Market Sahibi Adı *",
                            selectedMarket?.ownerFirstName,
                            (text) => setSelectedMarket({ ...selectedMarket, ownerFirstName: text }),
                            "ownerFirstName"
                        )}

                        {renderInputField(
                            "Market Sahibi Soyadı *",
                            selectedMarket?.ownerLastName,
                            (text) => setSelectedMarket({ ...selectedMarket, ownerLastName: text }),
                            "ownerLastName"
                        )}

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
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        padding: 16
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center'
    },
    addButton: {
        backgroundColor: '#6200EE',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        alignItems: 'center',
        elevation: 3
    },
    addButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16
    },
    marketItem: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 10,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2
    },
    marketInfoContainer: {
        flex: 1,
        marginRight: 10
    },
    marketName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4
    },
    marketInfo: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2
    },
    buttonContainer: {
        flexDirection: 'row'
    },
    editButton: {
        backgroundColor: '#FFA000',
        padding: 8,
        borderRadius: 6,
        marginRight: 8,
        minWidth: 70,
        alignItems: 'center'
    },
    deleteButton: {
        backgroundColor: '#FF5252',
        padding: 8,
        borderRadius: 6,
        minWidth: 70,
        alignItems: 'center'
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold'
    },
    input: {
        borderWidth: 1,
        borderColor: '#CCC',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        backgroundColor: '#FFF',
        fontSize: 16,
        color: '#333'
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modalContent: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 10,
        width: '90%',
        maxHeight: '90%'
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center'
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10
    },
    modalButton: {
        padding: 12,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 5
    },
    saveButton: {
        backgroundColor: '#4CAF50'
    },
    cancelButton: {
        backgroundColor: '#FF5252'
    },
    modalButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16
    },
    listContent: {
        paddingBottom: 20
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#666'
    },
    loader: {
        marginTop: 40
    }
});