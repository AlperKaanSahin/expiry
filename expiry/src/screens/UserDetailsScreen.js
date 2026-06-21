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
  PanResponder
} from 'react-native';
import { getUserById, updateUserRole, deleteUser } from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const UserDetailsScreen = ({ route, navigation }) => {
  const { userId } = route.params;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [roleModal, setRoleModal] = useState(false);

  // PanResponder ile sola kaydırma
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50) {
          navigation.goBack();
        }
      },
    })
  ).current;

  useEffect(() => {
    fetchUser();
  }, []);

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

  const handleRoleChange = async (newRole) => {
    try {
      setRole(newRole);
      await updateUserRole(user.id, newRole);
      setRoleModal(false);
      Alert.alert('Başarılı', 'Rol başarıyla değiştirildi');
      fetchUser();
    } catch (err) {
      Alert.alert('Hata', err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(user.id);
      setModalVisible(false);
      Alert.alert('Başarılı', 'Kullanıcı silindi');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Hata', err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return '#FF6B35';
      case 'market': return '#4CAF50';
      default: return '#6200EE';
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return '👑';
      case 'market': return '🏪';
      default: return '👤';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Kullanıcı bilgileri yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Kullanıcı bulunamadı</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Geri Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButtonHeader}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonHeaderText}>← Geri</Text>
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user.email ? user.email[0].toUpperCase() : '?'}
                </Text>
              </View>
              <Text style={styles.title}>{user.email}</Text>
              <View style={[styles.roleBadge, { backgroundColor: getRoleColor(role) + '15' }]}>
                <Text style={[styles.roleBadgeText, { color: getRoleColor(role) }]}>
                  {getRoleIcon(role)} {role.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.placeholderIcon} />
          </View>

          {/* INFO CARD */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 Kullanıcı Bilgileri</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID:</Text>
              <Text style={styles.infoValue}>#{user.id}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kayıt Tarihi:</Text>
              <Text style={styles.infoValue}>{formatDate(user.createdAt)}</Text>
            </View>
          </View>

          {/* ROLE ACTION CARD */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setRoleModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.actionCardContent}>
              <View>
                <Text style={styles.actionLabel}>Kullanıcı Rolü</Text>
                <View style={[styles.currentRoleBadge, { backgroundColor: getRoleColor(role) + '20' }]}>
                  <Text style={[styles.currentRoleText, { color: getRoleColor(role) }]}>
                    {getRoleIcon(role)} {role}
                  </Text>
                </View>
              </View>
              <Text style={styles.changeText}>Değiştir →</Text>
            </View>
          </TouchableOpacity>

          {/* DELETE BUTTON */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteText}>🗑️ Kullanıcıyı Sil</Text>
          </TouchableOpacity>

        </ScrollView>

        {/* DELETE MODAL */}
        <Modal
          transparent
          visible={modalVisible}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
            <View style={styles.modalBox}>
              <Text style={styles.modalIcon}>⚠️</Text>
              <Text style={styles.modalTitle}>Kullanıcıyı Sil</Text>
              <Text style={styles.modalMessage}>
                Bu işlem geri alınamaz. "{user.email}" kullanıcısını silmek istediğinizden emin misiniz?
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.confirmDeleteBtn]}
                  onPress={handleDelete}
                >
                  <Text style={styles.confirmDeleteText}>Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>

        {/* ROLE MODAL */}
        <Modal
          visible={roleModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setRoleModal(false)}
        >
          <SafeAreaView style={styles.fullModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => setRoleModal(false)} 
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>← Geri</Text>
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.modalHeaderTitle}>Rol Seçimi</Text>
              </View>
              <View style={styles.placeholder} />
            </View>
            
            <ScrollView 
              style={styles.roleList} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.roleListContent}
            >
              <TouchableOpacity
                style={[styles.roleItem, role === 'user' && styles.selectedRole]}
                onPress={() => handleRoleChange('user')}
                activeOpacity={0.7}
              >
                <Text style={styles.roleIcon}>👤</Text>
                <View style={styles.roleInfo}>
                  <Text style={styles.roleName}>Kullanıcı</Text>
                  <Text style={styles.roleDesc}>Standart kullanıcı yetkileri</Text>
                </View>
                {role === 'user' && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleItem, role === 'admin' && styles.selectedRole]}
                onPress={() => handleRoleChange('admin')}
                activeOpacity={0.7}
              >
                <Text style={styles.roleIcon}>👑</Text>
                <View style={styles.roleInfo}>
                  <Text style={styles.roleName}>Admin</Text>
                  <Text style={styles.roleDesc}>Tüm yetkilere sahip</Text>
                </View>
                {role === 'admin' && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleItem, role === 'market' && styles.selectedRole]}
                onPress={() => handleRoleChange('market')}
                activeOpacity={0.7}
              >
                <Text style={styles.roleIcon}>🏪</Text>
                <View style={styles.roleInfo}>
                  <Text style={styles.roleName}>Market</Text>
                  <Text style={styles.roleDesc}>Market yönetim yetkileri</Text>
                </View>
                {role === 'market' && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  safeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6C757D'
  },
  errorText: {
    fontSize: 16,
    color: '#DC3545',
    marginBottom: 16
  },
  backBtn: {
    backgroundColor: '#6200EE',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: '600'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  backButtonHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    zIndex: 10
  },
  backButtonHeaderText: {
    fontSize: 14,
    color: '#6200EE',
    fontWeight: '600'
  },
  headerContent: {
    flex: 1,
    alignItems: 'center'
  },
  placeholderIcon: {
    width: 60
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#6200EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF'
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 6
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600'
  },
  card: {
    backgroundColor: '#FFF',
    margin: 16,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 16
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500'
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#212529'
  },
  actionCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  actionCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  actionLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8
  },
  currentRoleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8
  },
  currentRoleText: {
    fontSize: 14,
    fontWeight: '600'
  },
  changeText: {
    fontSize: 14,
    color: '#6200EE',
    fontWeight: '600'
  },
  deleteBtn: {
    backgroundColor: '#DC3545',
    marginHorizontal: 16,
    marginBottom: 30,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  deleteText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalBox: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 340,
    alignItems: 'center'
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 12
  },
  modalMessage: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelBtn: {
    backgroundColor: '#F8F9FA'
  },
  cancelBtnText: {
    color: '#6C757D',
    fontWeight: '600'
  },
  confirmDeleteBtn: {
    backgroundColor: '#DC3545'
  },
  confirmDeleteText: {
    color: '#FFF',
    fontWeight: '600'
  },
  fullModal: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF'
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    zIndex: 10
  },
  backButtonText: {
    fontSize: 16,
    color: '#6200EE',
    fontWeight: '600'
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    textAlign: 'center'
  },
  placeholder: {
    width: 60
  },
  roleList: {
    flex: 1
  },
  roleListContent: {
    padding: 20,
    paddingBottom: 40
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  selectedRole: {
    backgroundColor: '#F3E5F5',
    borderWidth: 1,
    borderColor: '#6200EE'
  },
  roleIcon: {
    fontSize: 32,
    marginRight: 12
  },
  roleInfo: {
    flex: 1
  },
  roleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4
  },
  roleDesc: {
    fontSize: 12,
    color: '#6C757D'
  },
  checkMark: {
    fontSize: 20,
    color: '#6200EE',
    fontWeight: 'bold'
  }
});

export default UserDetailsScreen;