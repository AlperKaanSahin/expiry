import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Keyboard
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { ROUTES } from '../navigation/routes';
import { registerUser } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      handleChange('birthDate', formattedDate);
    }
  };

  const handleRegister = async () => {
    const { firstName, lastName, email, password, phone, birthDate, gender } = formData;

    if (!firstName || !lastName || !email || !password || !phone || !birthDate || !gender) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Geçersiz Email', 'Lütfen geçerli bir email adresi girin');
      return;
    }

    try {
      setLoading(true);
      await registerUser(formData);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: ROUTES.WELCOME, params: { registered: true } }],
        })
      );
    } catch (error) {
      Alert.alert('Hata', error.message || 'Kayıt sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const GenderOption = ({ value, label, icon }) => (
    <TouchableOpacity
      style={[
        styles.genderOption,
        formData.gender === value && styles.genderOptionSelected
      ]}
      onPress={() => handleChange('gender', value)}
      activeOpacity={0.7}
    >
      <Icon
        name={icon}
        size={24}
        color={formData.gender === value ? '#4361EE' : '#6c757d'}
      />
      <Text style={[
        styles.genderLabel,
        formData.gender === value && styles.genderLabelSelected
      ]}>
        {label}
      </Text>
      <View style={[
        styles.radioOuter,
        formData.gender === value && styles.radioOuterSelected
      ]}>
        {formData.gender === value && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            source={require('../assets/label.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Hesap Oluştur</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Ad */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ad*</Text>
            <View style={styles.inputContainer}>
              <Icon name="person" size={20} color="#6c757d" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Adınız"
                placeholderTextColor="#adb5bd"
                value={formData.firstName}
                onChangeText={(text) => handleChange('firstName', text)}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Soyad */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Soyad*</Text>
            <View style={styles.inputContainer}>
              <Icon name="person" size={20} color="#6c757d" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Soyadınız"
                placeholderTextColor="#adb5bd"
                value={formData.lastName}
                onChangeText={(text) => handleChange('lastName', text)}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email*</Text>
            <View style={styles.inputContainer}>
              <Icon name="email" size={20} color="#6c757d" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                placeholderTextColor="#adb5bd"
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Telefon */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefon*</Text>
            <View style={styles.inputContainer}>
              <Icon name="phone" size={20} color="#6c757d" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="5__ ___ __ __"
                placeholderTextColor="#adb5bd"
                value={formData.phone}
                onChangeText={(text) => {
                  // Sadece ilk 10 karakteri al
                  if (text.length <= 10) {
                    handleChange('phone', text);
                  }
                }}
                keyboardType="phone-pad"
                maxLength={10}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Doğum Tarihi */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Doğum Tarihi*</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="calendar-today" size={20} color="#6c757d" style={styles.icon} />
              <Text style={[styles.input, !formData.birthDate && { color: '#adb5bd' }]}>
                {formData.birthDate || 'GG-AA-YYYY'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={formData.birthDate ? new Date(formData.birthDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  locale="tr-TR"
                />
                {Platform.OS === 'ios' && (
                  <View style={styles.datePickerButtons}>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.datePickerButtonText}>Vazgeç</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.datePickerButton, styles.datePickerButtonConfirm]}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.datePickerButtonConfirmText}>Tamam</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Cinsiyet */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cinsiyet*</Text>
            <View style={styles.genderOptionsContainer}>
              <GenderOption value="Erkek" label="Erkek" icon="male" />
              <GenderOption value="Kadın" label="Kadın" icon="female" />
              <GenderOption value="Diğer" label="Diğer" icon="transgender" />
            </View>
            {!formData.gender && (
              <Text style={styles.errorText}>Lütfen cinsiyetinizi seçiniz</Text>
            )}
          </View>

          {/* Şifre */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre*</Text>
            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#6c757d" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="En az 6 karakter"
                placeholderTextColor="#adb5bd"
                value={formData.password}
                onChangeText={(text) => handleChange('password', text)}
                secureTextEntry={secureTextEntry}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={() => setSecureTextEntry(!secureTextEntry)}
                style={styles.eyeIcon}
              >
                <Icon
                  name={secureTextEntry ? 'visibility-off' : 'visibility'}
                  size={20}
                  color="#6c757d"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Kayıt Butonu */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Hesap Oluştur</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Giriş Yap Linki */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Zaten hesabınız var mı?</Text>
          <TouchableOpacity onPress={() => navigation.navigate(ROUTES.LOGIN)}>
            <Text style={styles.footerLink}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212529',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#212529',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#4361EE',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#6C757D',
    fontSize: 14,
  },
  footerLink: {
    color: '#4361EE',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  datePickerContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginTop: 10,
    overflow: 'hidden',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  datePickerButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  datePickerButtonConfirm: {
    backgroundColor: '#4361EE',
    borderRadius: 5,
    marginLeft: 10,
  },
  datePickerButtonText: {
    color: '#4361EE',
    fontSize: 16,
  },
  datePickerButtonConfirmText: {
    color: '#FFF',
  },
  genderOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  genderOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    backgroundColor: '#F8F9FA',
  },
  genderOptionSelected: {
    borderColor: '#4361EE',
    backgroundColor: '#E6F0FF',
  },
  genderLabel: {
    flex: 1,
    marginLeft: 8,
    color: '#6c757d',
  },
  genderLabelSelected: {
    color: '#4361EE',
    fontWeight: '500',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6c757d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#4361EE',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4361EE',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
});

export default RegisterScreen;