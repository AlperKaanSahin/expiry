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
  ScrollView,
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
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useWorkspace } from '../context/WorkspaceContext';

const ROLE_LABELS = {
  user: 'Kullanıcı',
  market: 'Market',
  admin: 'Admin',
};

export default function UserProfileScreen({ navigation }) {
  const { logout } = useAuth();
const { currentWorkspace, switchWorkspace } = useWorkspace();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const tabBarHeight = useBottomTabBarHeight();

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

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: tabBarHeight + 30 }]}
        showsVerticalScrollIndicator={false}
      >
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
        <Text style={styles.sectionLabel}>HESAP BİLGİLERİ</Text>
        <View style={styles.list}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Icon name="email" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowSubtitle}>E-posta</Text>
              <Text style={styles.rowTitle}>{user?.email}</Text>
            </View>
          </View>
        </View>

{/* Admin kendi panelindeyken: normal kullanıcı gibi gezinme seçeneği */}
{user?.role === 'admin' && currentWorkspace === 'admin' && (
  <>
    <Text style={styles.sectionLabel}>YÖNETİM</Text>
    <View style={styles.list}>
      <TouchableOpacity
        style={styles.row}
        onPress={() => switchWorkspace('user')}
        activeOpacity={0.6}
      >
        <View style={styles.rowIcon}>
          <Icon name="storefront" size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.rowTitleOnly}>Normal Kullanıcı Olarak Gez</Text>
        <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  </>
)}

{/* Market/Admin, normal kullanıcı modunda geziniyorken: panele dönüş */}
{(user?.role === 'market' || user?.role === 'admin') && currentWorkspace === 'user' && (
  <>
    <Text style={styles.sectionLabel}>YÖNETİM</Text>
    <View style={styles.list}>
      <TouchableOpacity
        style={styles.row}
        onPress={() => switchWorkspace(user.role === 'market' ? 'shop' : 'admin')}
        activeOpacity={0.6}
      >
        <View style={styles.rowIcon}>
          <Icon
            name={user.role === 'market' ? 'store' : 'admin-panel-settings'}
            size={18}
            color={COLORS.primary}
          />
        </View>
        <Text style={styles.rowTitleOnly}>
          {user.role === 'market' ? 'Market Panelim' : 'Admin Paneli'}
        </Text>
        <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  </>
)}
        {user?.role === 'user' && (
  <>
    <Text style={styles.sectionLabel}>MARKET SAHİBİ MİSİN?</Text>
    <View style={styles.list}>
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('HomeTab', { screen: 'ShopApply' })}
        activeOpacity={0.6}
      >
        <View style={styles.rowIcon}>
          <Icon name="storefront" size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.rowTitleOnly}>Market Başvurusu Yap</Text>
        <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  </>
)}

        {/* GENERAL */}
        <Text style={styles.sectionLabel}>GENEL</Text>
        <View style={styles.list}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.6}
          >
            <View style={styles.rowIcon}>
              <Icon name="edit" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.rowTitleOnly}>Profili Düzenle</Text>
            <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.6}
          >
            <View style={styles.rowIcon}>
              <Icon name="settings" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.rowTitleOnly}>Ayarlar</Text>
            <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* SESSION */}
        <Text style={styles.sectionLabel}>OTURUM</Text>
        <View style={styles.list}>
          <TouchableOpacity
            style={styles.row}
            onPress={logout}
            activeOpacity={0.6}
          >
            <View style={styles.rowIconDanger}>
              <Icon name="logout" size={18} color={COLORS.red} />
            </View>
            <Text style={styles.rowTitleDanger}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>

        {/* DANGER ZONE */}
        <TouchableOpacity
          style={styles.deleteAccountLink}
          onPress={() => setDeleteModal(true)}
          activeOpacity={0.6}
        >
          <Text style={styles.deleteAccountText}>Hesabımı Kalıcı Olarak Sil</Text>
        </TouchableOpacity>
      </ScrollView>

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

  body: {
  paddingHorizontal: 20,
  paddingBottom: 110,   // tab bar yüksekliği (~68) + güvenlik payı + safe area
},

  avatarSection: { alignItems: 'center', marginTop: 8, marginBottom: 28 },
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

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 20,
  },

  list: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 58,
  },
  rowIcon: {
    width: 38, height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowIconDanger: {
    width: 38, height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.redLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  rowSubtitle: { fontSize: 12, color: COLORS.textMuted, marginBottom: 2 },
  rowTitleOnly: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
  rowTitleDanger: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.red },

  deleteAccountLink: {
    alignSelf: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  deleteAccountText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.red,
    textDecorationLine: 'underline',
  },

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