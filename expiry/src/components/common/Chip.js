import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../theme';

const Chip = ({ label, icon, active, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon && (
        <Icon name={icon} size={14} color={active ? COLORS.white : COLORS.text} />
      )}
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  chipActive: { backgroundColor: COLORS.primary },
  text: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  textActive: { color: COLORS.white, fontWeight: '700' },
});

export default Chip;