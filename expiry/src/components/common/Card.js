import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../theme';

const Card = ({ children, style, shadow = 'md', padding = 16 }) => {
  return (
    <View style={[styles.base, SHADOWS[shadow], { padding }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
  },
});

export default Card;