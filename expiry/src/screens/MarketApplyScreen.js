import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { applyForShop } from '../services/api';

export default function MarketApplyScreen({ navigation }) {

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      Alert.alert('Hata', 'Zorunlu alanları doldur');
      return;
    }

    try {
      setLoading(true);

      const res = await applyForShop(form);

      console.log("APPLY RESPONSE:", res);

      setSuccess(true);

      Alert.alert(
        'Başarılı',
        'Market başvurunuz alındı, admin onayı bekleniyor'
      );

      navigation.goBack();

    } catch (err) {
      console.log(err);
      Alert.alert('Hata', err.message || 'Başvuru başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>

      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>
        Market Başvurusu
      </Text>

      <TextInput
        placeholder="Market Adı"
        value={form.name}
        onChangeText={(text) => handleChange('name', text)}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Adres"
        value={form.address}
        onChangeText={(text) => handleChange('address', text)}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Telefon"
        value={form.phone}
        onChangeText={(text) => handleChange('phone', text)}
        keyboardType="phone-pad"
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        style={{
          backgroundColor: '#6200EE',
          padding: 15,
          alignItems: 'center',
          borderRadius: 8
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff' }}>Başvuru Yap</Text>
        )}
      </TouchableOpacity>

    </View>
  );
}