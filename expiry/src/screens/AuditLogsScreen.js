import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import { fetchAuditLogs } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPE_SCALE } from '../theme';
import { showErrorToast } from '../utils/errorHandler';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import ScreenHeader from '../components/common/ScreenHeader';
import Card from '../components/common/Card';
import Chip from '../components/common/Chip';

// Gerçek AuditLog.action değerleri handlers/audit.handler.js'deki auditService.log()
// çağrılarından alındı. Her biri ayrı bir chip olarak gösterilirse (12 tekil değer)
// üst satır ekran genişliğini aşıp kesiliyor — bu yüzden mantıksal gruplara toplanıp
// Op.in ile filtreleniyor (bkz. auditService.getLogs). Badge rengi hâlâ tekil action
// değerine göre belirleniyor, gruplama sadece filtre seçimi için.
const ACTION_COLORS = {
  SHOP_CREATED: '#16A34A',
  SHOP_REAPPLIED: '#16A34A',
  SHOP_APPROVED: '#16A34A',
  SHOP_PHOTO_APPROVED: '#16A34A',
  SHOP_UPDATED: '#D97706',
  ROLE_CHANGED: '#2563EB',
  SHOP_STATUS_CHANGED: '#D97706',
  SHOP_REJECTED: '#DC2626',
  SHOP_DEACTIVATED: '#DC2626',
  SHOP_DELETED: '#DC2626',
  USER_DELETED: '#DC2626',
  SHOP_PHOTO_REJECTED: '#DC2626',
};

const ACTION_GROUPS = [
  { label: 'Tümü', actions: null },
  { label: 'Market Başvurusu', actions: ['SHOP_CREATED', 'SHOP_REAPPLIED'] },
  { label: 'Market Durumu', actions: ['SHOP_APPROVED', 'SHOP_REJECTED', 'SHOP_DEACTIVATED', 'SHOP_UPDATED', 'SHOP_DELETED'] },
  { label: 'Fotoğraf Onayı', actions: ['SHOP_PHOTO_APPROVED', 'SHOP_PHOTO_REJECTED'] },
  { label: 'Kullanıcı', actions: ['ROLE_CHANGED', 'USER_DELETED'] },
];

const LIMIT = 20;

const formatDate = (dateString) => {
  const diff = Date.now() - new Date(dateString);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Şimdi';
  if (minutes < 60) return `${minutes} dk önce`;
  if (hours < 24) return `${hours} sa önce`;
  if (days < 7) return `${days} gün önce`;
  return new Date(dateString).toLocaleDateString('tr-TR');
};

const LogCard = ({ item }) => {
  const [expanded, setExpanded] = useState(false);

  const actor = item.actor
    ? `${item.actor.firstName} ${item.actor.lastName}`
    : item.actorSnapshot
      ? `${item.actorSnapshot.name} (silinmiş kullanıcı)`
      : `ID: ${item.actorId}`;

  const actionColor = ACTION_COLORS[item.action] || COLORS.primary;
  const hasMetadata = item.metadata && Object.keys(item.metadata).length > 0;

  return (
    <Card style={styles.card} shadow="sm">
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: actionColor + '18' }]}>
          <Text style={[styles.badgeText, { color: actionColor }]}>
            {item.action}
          </Text>
        </View>
        <Text style={styles.timeText}>{formatDate(item.createdAt)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>İşlem yapan</Text>
        <Text style={styles.rowValue}>{actor}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Açıklama</Text>
        <Text style={styles.rowValue}>{item.description}</Text>
      </View>

      {hasMetadata && (
        <View style={styles.metaSection}>
          <TouchableOpacity
            style={styles.metaToggle}
            onPress={() => setExpanded(prev => !prev)}
            activeOpacity={0.7}
          >
            <Icon
              name={expanded ? 'expand-less' : 'expand-more'}
              size={16}
              color={COLORS.primary}
            />
            <Text style={styles.metaToggleText}>
              {expanded ? 'Detayı gizle' : 'Detayı göster'}
            </Text>
          </TouchableOpacity>

          {expanded && (
            <ScrollView
              style={styles.jsonBox}
              nestedScrollEnabled
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.jsonText}>
                {JSON.stringify(item.metadata, null, 2)}
              </Text>
            </ScrollView>
          )}
        </View>
      )}

      <Text style={styles.fullDate}>
        {new Date(item.createdAt).toLocaleString('tr-TR')}
      </Text>
    </Card>
  );
};

const AuditLogsScreen = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0); // 0 = 'Tümü'

  const loadLogs = async (pageNumber = 1, groupIndex = activeGroupIndex, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(false);

    try {
      const group = ACTION_GROUPS[groupIndex];
      const res = await fetchAuditLogs(pageNumber, LIMIT, group.actions);
      const data = res.data || {};

      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setPage(data.page || pageNumber);
    } catch (err) {
      setError(true);
      showErrorToast(err, Toast);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLogs(1, activeGroupIndex);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const handleFilterChange = (groupIndex) => {
    setActiveGroupIndex(groupIndex);
    loadLogs(1, groupIndex);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState text="Kayıtlar yükleniyor..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState
          title="Denetim kayıtları yüklenemedi"
          subtitle="Lütfen tekrar deneyin."
          onRetry={() => loadLogs(page, activeGroupIndex)}
        />
      </SafeAreaView>
    );
  }

  const totalPages = Math.max(Math.ceil(total / LIMIT), 1);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <ScreenHeader title="Denetim Kayıtları" />

      {/* AKSİYON FİLTRESİ — flexWrap: chip kenarda kesilmez, sığmayan alt satıra iner */}
      <View style={styles.filterRow}>
        {ACTION_GROUPS.map((group, index) => (
          <Chip
            key={group.label}
            label={group.label}
            active={activeGroupIndex === index}
            onPress={() => handleFilterChange(index)}
          />
        ))}
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <LogCard item={item} />}
        contentContainerStyle={[
          styles.list,
          logs.length === 0 && { flexGrow: 1 },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadLogs(1, activeGroupIndex, true)}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-text-outline"
            title="Henüz kayıt bulunmuyor"
            subtitle="Gerçekleşen işlemler burada listelenecek."
          />
        }
      />

      {total > LIMIT && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
            onPress={() => loadLogs(page - 1, activeGroupIndex)}
            disabled={page === 1}
          >
            <Icon name="chevron-left" size={20} color={page === 1 ? COLORS.textMuted : COLORS.white} />
          </TouchableOpacity>

          <Text style={styles.pageInfo}>{page} / {totalPages}</Text>

          <TouchableOpacity
            style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
            onPress={() => loadLogs(page + 1, activeGroupIndex)}
            disabled={page >= totalPages}
          >
            <Icon name="chevron-right" size={20} color={page >= totalPages ? COLORS.textMuted : COLORS.white} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.sm,
    paddingBottom: SPACING.lg,
  },

  list: { paddingHorizontal: SPACING.xxl, paddingBottom: SPACING.xxxl + SPACING.md },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  badge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.sm },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  timeText: { fontSize: 12, color: COLORS.textMuted },

  row: { flexDirection: 'row', marginBottom: SPACING.xs + 2, gap: SPACING.sm },
  rowLabel: { width: 90, fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  rowValue: { flex: 1, fontSize: 13, color: COLORS.text },

  metaSection: { marginTop: SPACING.sm + 2 },
  metaToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  metaToggleText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  jsonBox: {
    marginTop: SPACING.sm + 2,
    maxHeight: 160,
    padding: SPACING.md,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
  },
  jsonText: { fontSize: 11, color: COLORS.text, fontFamily: 'monospace' },

  fullDate: { fontSize: 11, color: COLORS.textMuted, marginTop: SPACING.sm + 2, textAlign: 'right' },

  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.lg,
  },
  pageBtn: {
    width: 40, height: 40, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  pageBtnDisabled: { backgroundColor: COLORS.border },
  pageInfo: { fontSize: 14, fontWeight: '600', color: COLORS.text, minWidth: 50, textAlign: 'center' },
});

export default AuditLogsScreen;