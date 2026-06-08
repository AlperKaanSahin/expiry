import React from 'react';
import { View, Text } from 'react-native';

const BlockedScreen = ({ reason }) => {
  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <Text style={{ fontSize:18, fontWeight:'bold' }}>
        Erişim Kısıtlı
      </Text>

      <Text style={{ marginTop:10, color:'#666' }}>
        {reason}
      </Text>
    </View>
  );
};

export default BlockedScreen;