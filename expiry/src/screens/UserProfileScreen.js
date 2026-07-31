import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { getProfile, deleteAccount } from '../services/api';
import { COLORS } from '../theme/colors';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { showErrorToast } from '../utils/errorHandler';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { useNavigation } from '@react-navigation/native';

const ROLE_LABELS = {
  user: 'Kullanıcı',
  market: 'Market',
  admin: 'Admin',
};

export default function UserProfileScreen({ navigation }) {
  const { logout, setViewMode } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

const loadProfile = async () => {
  try {
    setLoading(true);
    setError(null);

    const data = await getProfile();
    setUser(data);

  } catch (err) {
    setError(err.message);

  } finally {
    setLoading(false);
  }
};
useFocusEffect(
  useCallback(() => {
    loadProfile();
  }, [])
);

const handleDeleteAccount = async () => {
  if (!password) {
    Toast.show({ type: 'error', text1: 'Hata', text2: 'Şifrenizi girin' });
    return;
  }
  try {
    setDeleting(true);
    await deleteAccount(password);
    setDeleteModal(false);
    Toast.show({ type: 'success', text1: 'Hesabınız silindi' });
    await logout();
  } catch (err) {
    showErrorToast(err, Toast);
  } finally {
    setDeleting(false);
  }
};

if (loading) {
  return <LoadingState />;
}
if (error) {
  return (
    <ErrorState
      title="Profil yüklenemedi"
      subtitle="Profil bilgileri alınırken bir hata oluştu."
      onRetry={loadProfile}
    />
  );
}
  const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase();


  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appName}>expiry</Text>
          <View style={styles.dot} />
        </View>
      </View>

      {/* HERO */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Hesabım</Text>
        <Text style={styles.heroName}>Profil</Text>
      </View>

      {/* AVATAR */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.fullName}>{user?.firstName} {user?.lastName}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{ROLE_LABELS[user?.role] || user?.role}</Text>
        </View>
      </View>

      {/* INFO */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Icon name="email" size={18} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.infoLabel}>E-posta</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
        </View>

      </View>

      {/* FOOTER */}


{/* MANAGEMENT */}
{user?.role === 'market' && (
  <TouchableOpacity
    style={styles.settingsButton}
    onPress={() => setViewMode('panel')}
    activeOpacity={0.8}
  >
    <Icon name="store" size={18} color={COLORS.text} />
    <Text style={styles.settingsText}>Market Panelim</Text>
    <Icon name="chevron-right" size={18} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
  </TouchableOpacity>
)}

{user?.role === 'admin' && (
  <TouchableOpacity
    style={styles.settingsButton}
    onPress={() => setViewMode('panel')}
    activeOpacity={0.8}
  >
    <Icon name="admin-panel-settings" size={18} color={COLORS.text} />
    <Text style={styles.settingsText}>Admin Paneli</Text>
    <Icon name="chevron-right" size={18} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
  </TouchableOpacity>
)}

      <View style={styles.footer}>
        <TouchableOpacity
  style={styles.settingsButton}
  onPress={() => navigation.navigate('Settings')}
  activeOpacity={0.8}
>
  <Icon name="settings" size={18} color={COLORS.text} />
  <Text style={styles.settingsText}>Ayarlar</Text>
  <Icon name="chevron-right" size={18} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
</TouchableOpacity>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.8}
        >
          <Icon name="edit" size={18} color={COLORS.white} />
          <Text style={styles.editText}>Profili Düzenle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => setDeleteModal(true)}
          activeOpacity={0.8}
        >
          <Icon name="delete-forever" size={18} color={COLORS.red} />
          <Text style={styles.deleteText}>Hesabı Sil</Text>
        </TouchableOpacity>
      </View>

      {/* DELETE MODAL */}
      <Modal
        transparent
        visible={deleteModal}
        animationType="fade"
        onRequestClose={() => setDeleteModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setDeleteModal(false)}>
          <Pressable style={styles.modalBox} onPress={() => {}}>
            <View style={styles.warningIcon}>
              <Icon name="warning" size={32} color="#D97706" />
            </View>
            <Text style={styles.modalTitle}>Hesabı Sil</Text>
            <Text style={styles.modalMessage}>
              Bu işlem geri alınamaz. Tüm verileriniz silinecektir. Devam etmek için şifrenizi girin.
            </Text>

            <View style={styles.modalInputBox}>
              <Icon name="lock" size={16} color={COLORS.textMuted} />
              <TextInput
                style={styles.modalInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Şifreniz"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(p => !p)}>
                <Icon
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={16}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setDeleteModal(false);
                  setPassword('');
                }}
              >
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Sil</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.bg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appName: { fontSize: 22, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginBottom: 2 },

  hero: { paddingHorizontal: 20, marginBottom: 24 },
  heroLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 2 },
  heroName: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },

  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 80, height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  fullName: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  roleText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },

  infoSection: {
    marginHorizontal: 20,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoIcon: {
    width: 38, height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },

  footer: {
    paddingHorizontal: 20,
    marginTop: 'auto',
    paddingBottom: 24,
    paddingTop: 24,
    gap: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 14,
  },
  editText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: COLORS.redLight,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteText: { fontSize: 15, fontWeight: '600', color: COLORS.red },

  // MODAL
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  warningIcon: {
    width: 64, height: 64,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  modalMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
    width: '100%',
    marginBottom: 20,
  },
  modalInput: { flex: 1, fontSize: 15, color: COLORS.text },
  modalActions: { flexDirection: 'row', gap: 10, width: '100%' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  settingsButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  backgroundColor: COLORS.white,
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: COLORS.border,
  marginBottom: 12,
},
settingsText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.red,
    alignItems: 'center',
  },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});
