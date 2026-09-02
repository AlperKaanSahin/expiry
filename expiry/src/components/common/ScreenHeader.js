import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { COLORS, SPACING, TYPE_SCALE } from '../../theme';

const ScreenHeader = ({
  title,
  showBack = false,
  onBackPress,
  rightIcon,
  onRightPress,
  rightBadge = false,
}) => {
  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity style={styles.iconButton} onPress={onBackPress} activeOpacity={0.7}>
          <Icon name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.brandGroup}>
          <Text style={styles.brandName}>expiry</Text>
          <View style={styles.dot} />
        </View>
      )}

      <Text style={styles.title} numberOfLines={1}>{title}</Text>

      {rightIcon ? (
        <TouchableOpacity style={styles.iconButton} onPress={onRightPress} activeOpacity={0.7}>
          <Icon name={rightIcon} size={22} color={COLORS.text} />
          {rightBadge && <View style={styles.badgeDot} />}
        </TouchableOpacity>
      ) : (
        <View style={styles.iconButton} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  brandGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandName: { ...TYPE_SCALE.h2, color: COLORS.primary },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginBottom: 2 },
  title: { ...TYPE_SCALE.h3, color: COLORS.text, flex: 1, textAlign: 'center' },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  badgeDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.red,
  },
});

export default ScreenHeader;