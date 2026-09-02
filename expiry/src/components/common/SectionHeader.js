import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { COLORS, SPACING, TYPE_SCALE } from '../../theme';

const SectionHeader = ({ title, onSeeAllPress }) => {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {onSeeAllPress && (
        <TouchableOpacity style={styles.seeAll} onPress={onSeeAllPress}>
          <Text style={styles.seeAllText}>Tümünü Gör</Text>
          <Icon name="chevron-right" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: { ...TYPE_SCALE.h2, color: COLORS.text },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
});

export default SectionHeader;