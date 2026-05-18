import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ROUTES } from '../navigation/routes';

const WelcomeScreen = ({ navigation, route }) => {
  const justRegistered = route.params?.registered === true;

  useEffect(() => {
    if (justRegistered) {
      Alert.alert('Başarılı', 'Hesabınız başarıyla oluşturuldu');
    }
  }, [justRegistered]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {justRegistered ? 'Kayıt Tamamlandı!' : 'Hoş Geldiniz!'}
      </Text>
      <Text style={styles.subtitle}>
        {justRegistered
          ? 'Hesabınız oluşturuldu. Giriş yaparak devam edebilirsiniz.'
          : 'Devam etmek için giriş yapın veya kayıt olun.'}
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate(ROUTES.LOGIN)}
      >
        <Text style={styles.buttonText}>Giriş Yap</Text>
      </TouchableOpacity>
      {!justRegistered && (
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate(ROUTES.REGISTER)}
        >
          <Text style={styles.buttonText}>Kayıt Ol</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    width: 220,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#6200EE',
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButton: {
    backgroundColor: '#03DAC6',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default WelcomeScreen;
