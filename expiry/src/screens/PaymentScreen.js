import React from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { api } from '../services/api';

const PaymentScreen = ({ route, navigation }) => {
  const { orderId, shopId } = route.params;

  const handleSimulatePayment = async () => {
    try {
      await api.post('/orders/simulate-payment', { orderId });
      Alert.alert('Ödeme başarılı', 'Siparişiniz onaylandı!');
      navigation.navigate('ShopDetail', { shopId });
    } catch (error) {
      Alert.alert('Ödeme hatası', error.toString());
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 22, marginBottom: 24 }}>Ödeme Ekranı</Text>
      <Button title="Ödemeyi Simüle Et" onPress={handleSimulatePayment} />
    </View>
  );
};

export default PaymentScreen;