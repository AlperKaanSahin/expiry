import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAuditLogs } from '../services/api';

const AuditLogsScreen = ({ navigation }) => {
  const [logs, setLogs] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
const res = await fetchAuditLogs();
const data = res.data?.logs || [];
    // 🔥 En yeni loglar en üstte olacak şekilde sırala
    const sortedLogs = [...data].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

      setLogs(sortedLogs);
    } catch (err) {
      console.log(err);
    }
  };

  const getActionColor = (action) => {
    if (action === 'CREATE') return '#4CAF50';
    if (action === 'UPDATE') return '#FF9800';
    if (action === 'DELETE') return '#F44336';
    if (action === 'LOGIN') return '#2196F3';
    return '#6200EE';
  };

  const getActionBadge = (action) => {
    return {
      backgroundColor: getActionColor(action) + '20',
      color: getActionColor(action),
    };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Şimdi';
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  const toggleMetadata = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }) => {
    const actor = item.actor
      ? `${item.actor.firstName} ${item.actor.lastName}`
      : `User ID: ${item.actorId}`;
    
    const badgeStyle = getActionBadge(item.action);
    const isExpanded = expandedId === item.id;
    const hasMetadata = item.metadata && Object.keys(item.metadata).length > 0;

    return (
      <View style={styles.logCard}>
        {/* Header - Action ve Tarih */}
        <View style={styles.cardHeader}>
          <View style={[styles.actionBadge, { backgroundColor: badgeStyle.backgroundColor }]}>
            <Text style={[styles.actionText, { color: badgeStyle.color }]}>{item.action}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>

        {/* Actor */}
        <View style={styles.row}>
          <Text style={styles.label}>İşlem Yapan:</Text>
          <Text style={styles.value}>{actor}</Text>
        </View>

        {/* Description */}
        <View style={styles.row}>
          <Text style={styles.label}>Açıklama:</Text>
          <Text style={styles.value}>{item.description}</Text>
        </View>

        {/* Metadata - Show Button */}
        {hasMetadata && (
          <View style={styles.metadataContainer}>
            <TouchableOpacity 
              style={styles.showButton}
              onPress={() => toggleMetadata(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.showButtonText}>
                {isExpanded ? '📦 Metadatayı Gizle' : '📋 Metadatayı Göster'}
              </Text>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.jsonContainer}>
                <Text style={styles.jsonText}>
                  {JSON.stringify(item.metadata, null, 2)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Detaylı Tarih */}
        <Text style={styles.detailDate}>
          {new Date(item.createdAt).toLocaleString('tr-TR')}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Henüz denetim kaydı yok</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  listContent: {
    padding: 12,
  },
  logCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  label: {
    width: 90,
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  value: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  metadataContainer: {
    marginTop: 8,
  },
  showButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  showButtonText: {
    fontSize: 12,
    color: '#6200EE',
    fontWeight: '500',
  },
  jsonContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F8F8F8',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  jsonText: {
    fontSize: 11,
    color: '#444',
    fontFamily: 'monospace',
  },
  detailDate: {
    fontSize: 10,
    color: '#BBB',
    marginTop: 10,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});

export default AuditLogsScreen;