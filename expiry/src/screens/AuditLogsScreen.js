import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import { fetchAuditLogs } from '../services/api';
import { COLORS } from '../theme/colors';

const ACTION_COLORS = {
  CREATE: '#16A34A',
  UPDATE: '#D97706',
  DELETE: '#DC2626',
  LOGIN:  '#2563EB',
};

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
    <View style={styles.card}>
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
            <View style={styles.jsonBox}>
              <Text style={styles.jsonText}>
                {JSON.stringify(item.metadata, null, 2)}
              </Text>
            </View>
          )}
        </View>
      )}

      <Text style={styles.fullDate}>
        {new Date(item.createdAt).toLocaleString('tr-TR')}
      </Text>
    </View>
  );
};

const AuditLogsScreen = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const res = await fetchAuditLogs();
        const data = res.data?.logs || [];
        setLogs([...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch {
        //
      }
    };
    loadLogs();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appName}>expiry</Text>
          <View style={styles.dot} />
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Yönetim</Text>
        <Text style={styles.heroName}>Denetim Kayıtları</Text>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <LogCard item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="assignment" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>Henüz kayıt yok</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

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

  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  timeText: { fontSize: 12, color: COLORS.textMuted },

  row: { flexDirection: 'row', marginBottom: 6, gap: 8 },
  rowLabel: { width: 90, fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  rowValue: { flex: 1, fontSize: 13, color: COLORS.text },

  metaSection: { marginTop: 10 },
  metaToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  metaToggleText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  jsonBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  jsonText: { fontSize: 11, color: COLORS.text, fontFamily: 'monospace' },

  fullDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 10, textAlign: 'right' },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
});

export default AuditLogsScreen;