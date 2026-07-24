import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import styles from './stateStyles';

const ErrorState = ({
  title = 'Something went wrong',
  subtitle = 'Please try again.',
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={72}
        color="#E53935"
        style={styles.icon}
      />

      <Text style={styles.title}>
        {title}
      </Text>

      <Text style={styles.subtitle}>
        {subtitle}
      </Text>

      {onRetry && (
        <TouchableOpacity
          style={styles.button}
          onPress={onRetry}
        >
          <Text style={styles.buttonText}>
            Retry
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ErrorState;