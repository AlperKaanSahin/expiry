import React from 'react';
import { View, Text } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import styles from './stateStyles';

const EmptyState = ({
  icon = 'package-variant',
  title = 'Nothing here',
  subtitle = '',
  children,
}) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={icon}
        size={72}
        color="#BDBDBD"
        style={styles.icon}
      />

      <Text style={styles.title}>
        {title}
      </Text>

      {!!subtitle && (
        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      )}

      {children}
    </View>
  );
};

export default EmptyState;