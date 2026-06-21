import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { fetchAllUsers, deleteUser } from '../services/api';
import { COLORS } from '../theme/colors';

const ROLE_CONFIG = {
  admin:  { label: 'Admin',  color: '#D97706', bg: '#FEF3C7' },
  market: { label: 'Market', color: '#2563EB', bg: '#EFF6FF' },
  user:   { label: 'Üye',    color: '#16A34A', bg: '#F0FDF4' },
};

const LIMIT = 10;

export default function UserListScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadUsers = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const data = await fetchAllUsers(pageNumber, LIMIT);
      setUsers(data.users);
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      Alert.alert('Hata', err.toString());
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUsers();
      setSearch('');
    }, [])
  );

  const filteredUsers = search.trim()
    ? users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const handleDelete = (userId) => {
    Alert.alert(
      'Kullanıcıyı Sil',
      'Bu kullanıcıyı silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(userId);
              loadUsers(page);
            } catch (err) {
              Alert.alert('Hata', err.toString());
            }
          }
        }
      ]
    );
  };

  const maxPage = Math.ceil(total / LIMIT);

  const renderUser = ({ item }) => {
    const role = ROLE_CONFIG[item.role] || { label: item.role, color: COLORS.textMuted, bg: COLORS.bg };

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('UserDetailsScreen', { userId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.firstName?.charAt(0)?.toUpperCase() || '#'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.userId}>ID: {item.id}</Text>
            <View style={[styles.roleBadge, { backgroundColor: role.bg }]}>
              <Text style={[styles.roleText, { color: role.color }]}>{role.label}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          style={styles.deleteButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="delete" size={18} color={COLORS.red} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.heroLabel}>Admin Panel</Text>
        <Text style={styles.heroName}>Kullanıcılar</Text>
        <Text style={styles.heroSub}>Toplam {total} kullanıcı</Text>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Icon name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="İsim veya email ile ara..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <>
          <FlatList
            data={filteredUsers}
            keyExtractor={item => item.id.toString()}
            renderItem={renderUser}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Icon name="people" size={48} color={COLORS.border} />
                <Text style={styles.emptyText}>Kullanıcı bulunamadı</Text>
              </View>
            }
          />

          {/* PAGINATION */}
          {total > LIMIT && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                onPress={() => loadUsers(page - 1)}
                disabled={page === 1}
              >
                <Icon name="chevron-left" size={20} color={page === 1 ? COLORS.textMuted : COLORS.white} />
              </TouchableOpacity>

              <Text style={styles.pageInfo}>{page} / {maxPage}</Text>

              <TouchableOpacity
                style={[styles.pageBtn, page >= maxPage && styles.pageBtnDisabled]}
                onPress={() => loadUsers(page + 1)}
                disabled={page >= maxPage}
              >
                <Icon name="chevron-right" size={20} color={page >= maxPage ? COLORS.textMuted : COLORS.white} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
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

  hero: { paddingHorizontal: 20, marginBottom: 16 },
  heroLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 2 },
  heroName: { fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },

  loader: { marginTop: 40 },
  list: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },

  // CARD
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  cardLeft: {},
  avatar: {
    width: 44, height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  cardBody: { flex: 1, gap: 3 },
  userName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  userEmail: { fontSize: 12, color: COLORS.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  userId: { fontSize: 11, color: COLORS.textMuted },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleText: { fontSize: 11, fontWeight: '700' },
  deleteButton: { padding: 4 },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },

  // PAGINATION
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pageBtn: {
    width: 40, height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageBtnDisabled: { backgroundColor: COLORS.border },
  pageInfo: { fontSize: 15, fontWeight: '700', color: COLORS.text },
});