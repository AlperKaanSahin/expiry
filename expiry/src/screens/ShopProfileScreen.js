import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Icon from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPE_SCALE } from '../theme';
import { showErrorToast } from '../utils/errorHandler';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import ScreenHeader from '../components/common/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { fetchShopProfile, updateShopProfile, changeShopPassword, uploadShopCoverPhoto } from '../services/api';

const EMPTY_PASSWORD = { currentPassword: '', newPassword: '', confirmPassword: '' };

const ShopProfileScreen = () => {
  const { logout } = useAuth();
  const { switchWorkspace } = useWorkspace();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Salt-okunur kaynak veri — bilgi satırlarında gösterilen bu, form değil.
  const [shopInfo, setShopInfo] = useState({ name: '', address: '', phone: '', email: '' });

  const [coverImageUrl, setCoverImageUrl] = useState(null);
  const [coverImagePendingUrl, setCoverImagePendingUrl] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Düzenleme modalı — shopInfo'dan ayrı bir taslak, iptal edilirse gerçek veri bozulmaz.
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editDraft, setEditDraft] = useState({ name: '', address: '', phone: '', email: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // Şifre değiştirme modalı
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordData, setPasswordData] = useState(EMPTY_PASSWORD);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchShopProfile();

      setShopInfo({
        name: data.shop?.name || '',
        address: data.shop?.address || '',
        phone: data.shop?.phone || '',
        email: data.shop?.email || '',
      });
      setCoverImageUrl(data.shop?.coverImageUrl || null);
      setCoverImagePendingUrl(data.shop?.coverImagePendingUrl || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const openEditModal = () => {
    setEditDraft(shopInfo);
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
  };

  const handleProfileUpdate = async () => {
    try {
      setSavingEdit(true);
      await updateShopProfile(editDraft);
      setShopInfo(editDraft);
      Toast.show({ type: 'success', text1: 'Güncellendi', text2: 'Profil bilgileri güncellendi' });
      setEditModalVisible(false);
    } catch (err) {
      showErrorToast(err, Toast);
    } finally {
      setSavingEdit(false);
    }
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'İzin gerekli', text2: 'Galeriye erişim izni vermelisin' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (result.canceled) return;

    try {
      setUploadingPhoto(true);
      const res = await uploadShopCoverPhoto(result.assets[0].uri);
      setCoverImagePendingUrl(res.shop.coverImagePendingUrl);
      Toast.show({
        type: 'success',
        text1: 'Fotoğraf gönderildi',
        text2: 'Admin onayından sonra yayınlanacak',
      });
    } catch (err) {
      showErrorToast(err, Toast);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const openPasswordModal = () => {
    setPasswordData(EMPTY_PASSWORD);
    setPasswordModalVisible(true);
  };

  const closePasswordModal = () => {
    setPasswordModalVisible(false);
    setPasswordData(EMPTY_PASSWORD);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Yeni şifreler eşleşmiyor' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Şifre en az 6 karakter olmalı' });
      return;
    }
    try {
      setSavingPassword(true);
      await changeShopPassword({
        password: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      Toast.show({ type: 'success', text1: 'Güncellendi', text2: 'Şifre başarıyla değiştirildi' });
      setPasswordModalVisible(false);
      setPasswordData(EMPTY_PASSWORD);
    } catch (err) {
      showErrorToast(err, Toast);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return (
      <ErrorState
        subtitle="Shop bilgileri yüklenirken bir hata oluştu."
        onRetry={loadProfile}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <ScreenHeader title="Profilim" />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* KAPAK FOTOĞRAFI + SHOP ADI */}
        <View style={styles.coverSection}>
          <TouchableOpacity
            style={styles.coverBox}
            onPress={handlePickPhoto}
            activeOpacity={0.8}
            disabled={uploadingPhoto}
          >
            {coverImageUrl ? (
              <Image source={{ uri: coverImageUrl }} style={styles.coverPreview} />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Icon name="add-a-photo" size={26} color={COLORS.textMuted} />
                <Text style={styles.coverPlaceholderText}>Fotoğraf eklemek için dokun</Text>
              </View>
            )}
            {uploadingPhoto && (
              <View style={styles.coverUploadingOverlay}>
                <ActivityIndicator color={COLORS.white} />
              </View>
            )}
          </TouchableOpacity>

          {coverImagePendingUrl && (
            <View style={styles.pendingBadge}>
              <Icon name="pending-actions" size={14} color="#D97706" />
              <Text style={styles.pendingBadgeText}>Yeni fotoğrafın admin onayı bekleniyor</Text>
            </View>
          )}

          <Text style={styles.shopName}>{shopInfo.name || 'Shop Adı'}</Text>
        </View>

        {/* MARKET BİLGİLERİ — salt okunur */}
        <Text style={styles.sectionLabel}>MARKET BİLGİLERİ</Text>
        <View style={styles.list}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Icon name="place" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowSubtitle}>Adres</Text>
              <Text style={styles.rowTitle}>{shopInfo.address || '-'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Icon name="call" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowSubtitle}>Telefon</Text>
              <Text style={styles.rowTitle}>{shopInfo.phone || '-'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Icon name="email" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowSubtitle}>Email</Text>
              <Text style={styles.rowTitle}>{shopInfo.email || '-'}</Text>
            </View>
          </View>
        </View>

        {/* GENEL — düzenleme aksiyonları, varsayılan görünümde açık değil */}
        <Text style={styles.sectionLabel}>GENEL</Text>
        <View style={styles.list}>
          <TouchableOpacity style={styles.row} onPress={openEditModal} activeOpacity={0.6}>
            <View style={styles.rowIcon}>
              <Icon name="edit" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.rowTitleOnly}>Bilgilerini Düzenle</Text>
            <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={openPasswordModal} activeOpacity={0.6}>
            <View style={styles.rowIcon}>
              <Icon name="lock" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.rowTitleOnly}>Şifre Değiştir</Text>
            <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* PANEL */}
        <Text style={styles.sectionLabel}>PANEL</Text>
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

        {/* OTURUM */}
        <Text style={styles.sectionLabel}>OTURUM</Text>
        <View style={styles.list}>
          <TouchableOpacity style={styles.row} onPress={logout} activeOpacity={0.6}>
            <View style={styles.rowIconDanger}>
              <Icon name="logout" size={18} color={COLORS.red} />
            </View>
            <Text style={styles.rowTitleDanger}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* BİLGİLERİNİ DÜZENLE — bottom sheet */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeEditModal}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Bilgilerini Düzenle</Text>
              <TouchableOpacity onPress={closeEditModal}>
                <Icon name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Shop Adı</Text>
                <TextInput
                  style={styles.input}
                  value={editDraft.name}
                  onChangeText={text => setEditDraft({ ...editDraft, name: text })}
                  placeholder="Shop adınız"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Adres</Text>
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={editDraft.address}
                  onChangeText={text => setEditDraft({ ...editDraft, address: text })}
                  placeholder="Shop adresi"
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telefon</Text>
                <TextInput
                  style={styles.input}
                  value={editDraft.phone}
                  onChangeText={text => setEditDraft({ ...editDraft, phone: text })}
                  placeholder="05XX XXX XX XX"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={editDraft.email}
                  onChangeText={text => setEditDraft({ ...editDraft, email: text })}
                  placeholder="Email adresi"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </ScrollView>

            <View style={styles.sheetButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeEditModal}>
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleProfileUpdate}
                disabled={savingEdit}
                activeOpacity={0.8}
              >
                {savingEdit ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ŞİFRE DEĞİŞTİR — bottom sheet */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closePasswordModal}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Şifre Değiştir</Text>
              <TouchableOpacity onPress={closePasswordModal}>
                <Icon name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mevcut Şifre</Text>
                <TextInput
                  style={styles.input}
                  value={passwordData.currentPassword}
                  onChangeText={text => setPasswordData({ ...passwordData, currentPassword: text })}
                  placeholder="Mevcut şifreniz"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Yeni Şifre</Text>
                <TextInput
                  style={styles.input}
                  value={passwordData.newPassword}
                  onChangeText={text => setPasswordData({ ...passwordData, newPassword: text })}
                  placeholder="En az 6 karakter"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Yeni Şifre (Tekrar)</Text>
                <TextInput
                  style={styles.input}
                  value={passwordData.confirmPassword}
                  onChangeText={text => setPasswordData({ ...passwordData, confirmPassword: text })}
                  placeholder="Yeni şifreyi tekrar girin"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.showPasswordToggle}
                onPress={() => setShowPassword(p => !p)}
              >
                <Icon
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={16}
                  color={COLORS.textMuted}
                />
                <Text style={styles.showPasswordToggleText}>
                  {showPassword ? 'Şifreleri gizle' : 'Şifreleri göster'}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.sheetButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={closePasswordModal}>
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handlePasswordChange}
                disabled={savingPassword}
                activeOpacity={0.8}
              >
                {savingPassword ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Değiştir</Text>
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

  body: { paddingHorizontal: SPACING.xxl, paddingBottom: SPACING.xxxl + SPACING.md },

  // KAPAK + AD — avatar bölümünün UserProfileScreen'deki karşılığı
  coverSection: { alignItems: 'center', marginTop: SPACING.sm, marginBottom: SPACING.xxxl - 4 },
  coverBox: {
    width: '100%', height: 140,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
    marginBottom: SPACING.md,
  },
  coverPreview: { width: '100%', height: '100%' },
  coverPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.xs + 2 },
  coverPlaceholderText: { fontSize: 12, color: COLORS.textMuted },
  coverUploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  pendingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: '#FEF3C7', borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    marginBottom: SPACING.md, alignSelf: 'stretch',
  },
  pendingBadgeText: { fontSize: 12, color: '#92400E', fontWeight: '600', flex: 1 },
  shopName: { ...TYPE_SCALE.h1, fontSize: 20, color: COLORS.text },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    marginBottom: SPACING.sm + 2,
    marginTop: SPACING.xl,
  },

  // Tasarım sistemindeki "shadow-based, border yok" prensibine göre:
  // border yerine gölge kullanılıyor — UserProfileScreen ile aynı.
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

  // BOTTOM SHEET (Düzenle / Şifre Değiştir)
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    paddingBottom: SPACING.xxxl,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  sheetTitle: { ...TYPE_SCALE.h3, fontSize: 18, color: COLORS.text },

  inputGroup: { marginBottom: SPACING.lg },
  inputLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted, marginBottom: SPACING.xs + 2 },
  input: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
  },
  multiline: { height: 84, textAlignVertical: 'top' },

  showPasswordToggle: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    alignSelf: 'flex-start', marginBottom: SPACING.md,
  },
  showPasswordToggleText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },

  sheetButtons: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  cancelButton: {
    flex: 1, paddingVertical: SPACING.md + 2, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 15, fontWeight: '600', color: COLORS.textMuted },
  saveButton: {
    flex: 1, paddingVertical: SPACING.md + 2, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  saveButtonText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});

export default ShopProfileScreen;