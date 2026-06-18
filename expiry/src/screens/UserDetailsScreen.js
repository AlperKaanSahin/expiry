import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  PanResponder,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getUserById, updateUserRole, deleteUser } from '../services/api';
import { COLORS } from '../theme/colors';

const ROLES = [
  { key: 'user',   label: 'Kullanıcı', desc: 'Standart kullanıcı yetkileri', icon: 'person' },
  { key: 'market', label: 'Market',     desc: 'Market yönetim yetkileri',     icon: 'store' },
  { key: 'admin',  label: 'Admin',      desc: 'Tüm yetkilere sahip',          icon: 'admin-panel-settings' },
];

const ROLE_CONFIG = {
  admin:  { color: '#D97706', bg: '#FEF3C7' },
  market: { color: '#2563EB', bg: '#EFF6FF' },
  user:   { color: '#16A34A', bg: '#F0FDF4' },
};

const formatDate = (dateString) => {
  if (!dateString) return 'Belirtilmemiş';
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
};

const UserDetailsScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [roleModal, setRoleModal] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dy) < 50,
      onPanResponderRelease: (_, g) => { if (g.dx > 50) navigation.goBack(); },
    })
  ).current;

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await getUserById(userId);
      setUser(res);
      setRole(res.role);
    } catch (err) {
      Alert.alert('Hata', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, []);

  const handleRoleChange = async (newRole) => {
    try {
      await updateUserRole(user.id, newRole);
      setRole(newRole);
      setRoleModal(false);
      fetchUser();
    } catch (err) {
      Alert.alert('Hata', err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(user.id);
      setDeleteModal(false);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Hata', err.message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Icon name="error-outline" size={48} color={COLORS.border} />
          <Text style={styles.emptyText}>Kullanıcı bulunamadı</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const roleConfig = ROLE_CONFIG[role] || { color: COLORS.primary, bg: COLORS.primaryLight };
  const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.appName}>expiry</Text>
            <View style={styles.dot} />
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>

          {/* AVATAR */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials || '?'}</Text>
            </View>
            <Text style={styles.fullName}>{user.firstName} {user.lastName}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={[styles.roleBadge, { backgroundColor: roleConfig.bg }]}>
              <Text style={[styles.roleText, { color: roleConfig.color }]}>
                {ROLES.find(r => r.key === role)?.label || role}
              </Text>
            </View>
          </View>

          {/* INFO */}
          <View style={styles.section}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Icon name="tag" size={16} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Kullanıcı ID</Text>
                <Text style={styles.infoValue}>#{user.id}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <View style={styles.infoIcon}>
                <Icon name="calendar-today" size={16} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Kayıt Tarihi</Text>
                <Text style={styles.infoValue}>{formatDate(user.createdAt)}</Text>
              </View>
            </View>
          </View>

          {/* ROLE */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => setRoleModal(true)}
            activeOpacity={0.8}
          >
            <View>
              <Text style={styles.infoLabel}>Kullanıcı Rolü</Text>
              <View style={[styles.roleBadgeSmall, { backgroundColor: roleConfig.bg }]}>
                <Text style={[styles.roleTextSmall, { color: roleConfig.color }]}>
                  {ROLES.find(r => r.key === role)?.label || role}
                </Text>
              </View>
            </View>
            <View style={styles.changeRow}>
              <Text style={styles.changeText}>Değiştir</Text>
              <Icon name="chevron-right" size={18} color={COLORS.primary} />
            </View>
          </TouchableOpacity>

          {/* DELETE */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setDeleteModal(true)}
            activeOpacity={0.8}
          >
            <Icon name="delete" size={18} color={COLORS.red} />
            <Text style={styles.deleteText}>Kullanıcıyı Sil</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* DELETE MODAL */}
        <Modal transparent visible={deleteModal} animationType="fade" onRequestClose={() => setDeleteModal(false)}>
          <Pressable style={styles.overlay} onPress={() => setDeleteModal(false)}>
            <View style={styles.modalBox}>
              <View style={styles.warningIcon}>
                <Icon name="warning" size={32} color="#D97706" />
              </View>
              <Text style={styles.modalTitle}>Kullanıcıyı Sil</Text>
              <Text style={styles.modalMessage}>
                Bu işlem geri alınamaz. "{user.email}" kullanıcısını silmek istediğinizden emin misiniz?
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setDeleteModal(false)}
                >
                  <Text style={styles.cancelBtnText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleDelete}>
                  <Text style={styles.confirmBtnText}>Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>

        {/* ROLE MODAL */}
        <Modal visible={roleModal} animationType="slide" transparent={false} onRequestClose={() => setRoleModal(false)}>
          <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => setRoleModal(false)}>
                <Icon name="arrow-back" size={22} color={COLORS.text} />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.appName}>expiry</Text>
                <View style={styles.dot} />
              </View>
              <View style={{ width: 36 }} />
            </View>

            <View style={styles.roleModalHero}>
              <Text style={styles.heroName}>Rol Seçimi</Text>
            </View>

            <ScrollView contentContainerStyle={styles.roleList}>
              {ROLES.map(r => {
                const cfg = ROLE_CONFIG[r.key];
                const selected = role === r.key;
                return (
                  <TouchableOpacity
                    key={r.key}
                    style={[styles.roleItem, selected && { borderColor: COLORS.primary, borderWidth: 1.5 }]}
                    onPress={() => handleRoleChange(r.key)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.roleItemIcon, { backgroundColor: cfg.bg }]}>
                      <Icon name={r.icon} size={22} color={cfg.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roleName}>{r.label}</Text>
                      <Text style={styles.roleDesc}>{r.desc}</Text>
                    </View>
                    {selected && <Icon name="check-circle" size={22} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
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
    backgroundColor: COLORS.bg,
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
  appName: { fontSize: 22, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginBottom: 2 },

  body: { paddingHorizontal: 20, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 72, height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: COLORS.primary },
  fullName: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  email: { fontSize: 13, color: COLORS.textMuted, marginBottom: 10 },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  roleText: { fontSize: 12, fontWeight: '700' },

  section: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoIcon: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },

  roleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  roleBadgeSmall: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  roleTextSmall: { fontSize: 12, fontWeight: '700' },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  changeText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

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

  // DELETE MODAL
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
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
  modalMessage: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 10, width: '100%' },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.red, alignItems: 'center' },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },

  // ROLE MODAL
  roleModalHero: { paddingHorizontal: 20, marginBottom: 16 },
  heroName: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  roleList: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  roleItemIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  roleName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  roleDesc: { fontSize: 12, color: COLORS.textMuted },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 20 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
  backBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  backBtnText: { color: COLORS.white, fontWeight: '600' },
});

export default UserDetailsScreen;