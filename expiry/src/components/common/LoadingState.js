import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import styles from './stateStyles';

const LoadingState = ({ text = 'Loading...' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );
};

export default LoadingState;