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
import { COLORS, SPACING, RADIUS, SHADOWS, TYPE_SCALE } from '../theme';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { showErrorToast } from '../utils/errorHandler';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import ScreenHeader from '../components/common/ScreenHeader';
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
    return <LoadingState text="Yükleniyor..." />;
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

      <ScreenHeader title="Profilim" />

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: tabBarHeight + SPACING.xxxl }]}
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

  body: { paddingHorizontal: SPACING.xxl },

  avatarSection: { alignItems: 'center', marginTop: SPACING.sm, marginBottom: SPACING.xxxl - 4 },
  avatar: {
    width: 80, height: 80,
    borderRadius: RADIUS.xxl,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  fullName: { ...TYPE_SCALE.h1, fontSize: 20, color: COLORS.text, marginBottom: SPACING.sm },
  roleBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primaryLight,
  },
  roleText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    marginBottom: SPACING.sm + 2,
    marginTop: SPACING.xl,
  },

  // Tasarım sistemindeki "shadow-based, border yok" prensibine göre:
  // border yerine gölge kullanılıyor.
  list: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg - 2,
    paddingHorizontal: SPACING.lg - 2,
    gap: SPACING.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 58,
  },
  rowIcon: {
    width: 38, height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowIconDanger: {
    width: 38, height: 38,
    borderRadius: RADIUS.md,
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
    marginTop: SPACING.xl,
    paddingVertical: SPACING.sm,
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
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    width: '85%',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  warningIcon: {
    width: 64, height: 64,
    borderRadius: RADIUS.lg,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: { ...TYPE_SCALE.h3, fontSize: 18, color: COLORS.text, marginBottom: SPACING.sm },
  modalMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  modalInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg - 2,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm + 2,
    width: '100%',
    marginBottom: SPACING.xl,
  },
  modalInput: { flex: 1, fontSize: 15, color: COLORS.text },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, width: '100%' },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm + 2,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  confirmBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm + 2,
    backgroundColor: COLORS.red,
    alignItems: 'center',
  },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});