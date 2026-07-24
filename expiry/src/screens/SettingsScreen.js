import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Switch,
  Linking,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../services/api';
import { showErrorToast } from '../utils/errorHandler';
import { COLORS } from '../theme/colors';

const APP_VERSION = '1.0.0';
const EMPTY_PASSWORD = { currentPassword: '', newPassword: '', confirmPassword: '' };

const SettingsScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [passwordData, setPasswordData] = useState(EMPTY_PASSWORD);
  const [saving, setSaving] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleContact = () => {
    Linking.openURL('mailto:destek@expiryapp.com');
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: logout }
      ]
    );
  };

  // 📌 VALİDASYON FONKSİYONLARI
  const validateField = (name, value) => {
    if (name === 'currentPassword') {
      if (!value.trim()) return 'Mevcut şifre zorunlu';
    }
    if (name === 'newPassword') {
      if (!value.trim()) return 'Yeni şifre zorunlu';
      if (value.length < 6) return 'Şifre en az 6 karakter olmalı';
    }
    if (name === 'confirmPassword') {
      if (!value.trim()) return 'Şifre tekrarı zorunlu';
      if (value !== passwordData.newPassword) return 'Şifreler eşleşmiyor';
    }
    return null;
  };

  const handleBlur = (name, value) => {
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const getFieldError = (name) => {
    return errors[name];
  };

  const handlePasswordChange = async () => {
    // Tüm alanları validate et
    const currentError = validateField('currentPassword', passwordData.currentPassword);
    const newError = validateField('newPassword', passwordData.newPassword);
    const confirmError = validateField('confirmPassword', passwordData.confirmPassword);

    if (currentError || newError || confirmError) {
      setErrors({
        currentPassword: currentError,
        newPassword: newError,
        confirmPassword: confirmError,
      });
      return;
    }

    try {
      setSaving(true);
      await changePassword({
        password: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      Toast.show({ type: 'success', text1: 'Güncellendi', text2: 'Şifre başarıyla değiştirildi' });
      setPasswordData(EMPTY_PASSWORD);
      setErrors({});
      setPasswordModalVisible(false);
    } catch (err) {
      showErrorToast(err, Toast);
    } finally {
      setSaving(false);
    }
  };

  const renderPasswordInput = (name, label, value, onChange, placeholder, secure, setShow) => {
    const error = getFieldError(name);
    const isValid = value.length > 0 && !error;

    return (
      <View style={styles.inputGroup}>
        <View style={styles.inputLabelRow}>
          <Text style={styles.inputLabel}>{label}</Text>
          {value.length > 0 && (
            <View style={styles.validationIcon}>
              <Icon 
                name={error ? 'error-outline' : 'check-circle'} 
                size={16} 
                color={error ? COLORS.red : COLORS.success} 
              />
            </View>
          )}
        </View>
        <View style={[
          styles.inputWrapper, 
          error && styles.inputWrapperError,
          isValid && styles.inputWrapperValid
        ]}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={t => {
              onChange(t);
              // Anında validasyon (opsiyonel)
              const err = validateField(name, t);
              setErrors(prev => ({ ...prev, [name]: err }));
            }}
            onBlur={() => handleBlur(name, value)}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry={!secure}
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShow(!secure)}
            activeOpacity={0.7}
          >
            <Icon name={secure ? 'visibility-off' : 'visibility'} size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.appName}>expiry</Text>
          <View style={styles.dot} />
        </View>
        <TouchableOpacity
          style={styles.headerRightButton}
          onPress={() => setPasswordModalVisible(true)}
          activeOpacity={0.7}
        >
          <Icon name="lock-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.body} 
        keyboardShouldPersistTaps="handled"
      >

        {/* HERO */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Hesabım</Text>
          <Text style={styles.heroName}>Ayarlar</Text>
        </View>

        {/* BİLDİRİMLER */}
        <Text style={styles.sectionTitle}>Bildirimler</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <Icon name="notifications-none" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.rowText}>Bildirimleri Aç</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={notificationsEnabled ? COLORS.primary : COLORS.textMuted}
            />
          </View>
        </View>

        {/* HAKKINDA */}
        <Text style={styles.sectionTitle}>Hakkında</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.row} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <Icon name="privacy-tip" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.rowText}>Gizlilik Politikası</Text>
            </View>
            <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <Icon name="description" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.rowText}>Kullanım Şartları</Text>
            </View>
            <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={handleContact} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <Icon name="mail-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.rowText}>Bize Ulaşın</Text>
            </View>
            <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <Icon name="info-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.rowText}>Versiyon</Text>
            </View>
            <Text style={styles.versionText}>{APP_VERSION}</Text>
          </View>
        </View>

        {/* ŞİFRE DEĞİŞTİR BUTONU */}
        <TouchableOpacity
          style={styles.passwordButton}
          onPress={() => setPasswordModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="lock-outline" size={20} color={COLORS.primary} />
          <Text style={styles.passwordButtonText}>Şifre Değiştir</Text>
          <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* ÇIKIŞ */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Icon name="logout" size={18} color={COLORS.red} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ŞİFRE DEĞİŞTİR MODAL */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setPasswordData(EMPTY_PASSWORD);
          setErrors({});
          setPasswordModalVisible(false);
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <Text style={styles.modalTitle}>Şifre Değiştir</Text>
            <Text style={styles.modalSubtitle}>Hesap güvenliğiniz için şifrenizi güncelleyin</Text>

            {renderPasswordInput(
              'currentPassword',
              'Mevcut Şifre',
              passwordData.currentPassword,
              t => setPasswordData({ ...passwordData, currentPassword: t }),
              'Mevcut şifreniz',
              showCurrentPassword,
              setShowCurrentPassword
            )}

            {renderPasswordInput(
              'newPassword',
              'Yeni Şifre',
              passwordData.newPassword,
              t => setPasswordData({ ...passwordData, newPassword: t }),
              'En az 6 karakter',
              showNewPassword,
              setShowNewPassword
            )}

            {renderPasswordInput(
              'confirmPassword',
              'Yeni Şifre (Tekrar)',
              passwordData.confirmPassword,
              t => setPasswordData({ ...passwordData, confirmPassword: t }),
              'Yeni şifrenizi tekrar girin',
              showConfirmPassword,
              setShowConfirmPassword
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setPasswordData(EMPTY_PASSWORD);
                  setErrors({});
                  setPasswordModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handlePasswordChange}
                disabled={saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Güncelle</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerRightButton: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: { fontSize: 22, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginBottom: 2 },

  body: { paddingHorizontal: 20, paddingBottom: 40 },

  hero: { marginTop: 8, marginBottom: 24 },
  heroLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 4 },
  heroName: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 8,
  },

  section: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: {
    width: 32, height: 32,
    borderRadius: 9,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowText: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  versionText: { fontSize: 13, color: COLORS.textMuted },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 60 },

  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  passwordButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginLeft: 12,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: COLORS.redLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: COLORS.red },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
  inputGroup: { marginBottom: 14 },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  validationIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputWrapperError: {
    borderColor: COLORS.red,
    borderWidth: 1,
  },
  inputWrapperValid: {
    borderColor: COLORS.success,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.red,
    marginTop: 4,
  },
  successText: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default SettingsScreen;