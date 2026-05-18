import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Alert } from 'react-native';
import { ROUTES } from '../navigation/routes';
import { loginUser } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchMarketProfile } from '../services/api';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);



const handleLogin = async () => {
  try {
    setLoading(true);
    const user = await loginUser({ email, password });
    await AsyncStorage.setItem('@userId', user.id.toString());

    if (user.role === 'market') {
      const profile = await fetchMarketProfile();
      const shopId = profile?.id;
      if (shopId) {
        await AsyncStorage.setItem('@shopId', shopId.toString());
        console.log('Kaydedilen shopId:', shopId);
      } else {
        console.warn('shopId bulunamadı!');
      }
      navigation.replace('MarketPanel');
    }
    else if (user.role === 'admin') {
      navigation.replace('AdminPanel');
    } else {
      navigation.replace('Home');
    }
  } catch (error) {
    Alert.alert('Giriş Hatası', error.toString());
  } finally {
    setLoading(false);
  }
};


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        {/* Logo/Header Alanı */}
        <Image
          source={require('../assets/label.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Hoş Geldiniz</Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Icon name="email" size={20} color="#6200EE" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email adresiniz"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Şifre Input */}
        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color="#6200EE" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Şifreniz"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setSecureTextEntry(!secureTextEntry)}
          >
            <Icon
              name={secureTextEntry ? 'visibility-off' : 'visibility'}
              size={20}
              color="#888"
            />
          </TouchableOpacity>
        </View>

        {/* Giriş Butonu */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.loginButtonText}>Giriş Yap</Text>
          )}
        </TouchableOpacity>

        {/* Kayıt Ol Linki */}
        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate(ROUTES.REGISTER)}
        >
          <Text style={styles.registerText}>
            Hesabınız yok mu? <Text style={styles.registerBold}>Kayıt Olun</Text>
          </Text>
        </TouchableOpacity>

        {/* Şifremi Unuttum */}
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  innerContainer: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  loginButton: {
    backgroundColor: '#6200EE',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#6200EE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerLink: {
    marginTop: 20,
    alignSelf: 'center',
  },
  registerText: {
    color: '#666',
  },
  registerBold: {
    fontWeight: 'bold',
    color: '#6200EE',
  },
  forgotPassword: {
    marginTop: 15,
    alignSelf: 'center',
  },
  forgotPasswordText: {
    color: '#6200EE',
    fontSize: 14,
  },
});

export default LoginScreen;