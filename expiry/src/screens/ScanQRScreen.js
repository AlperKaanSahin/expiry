import React, { useState, useEffect, useRef  } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialIcons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Toast from 'react-native-toast-message';
import { confirmOrderByQR } from '../services/api';
import { showErrorToast } from '../utils/errorHandler';
import { COLORS } from '../theme/colors';

const ScanQRScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const isProcessingRef = useRef(false); // yeni

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

 const handleScan = async ({ data }) => {
    if (isProcessingRef.current) return; // senkron kontrol
    isProcessingRef.current = true; // senkron kilitleme

    setScanned(true);
    setProcessing(true);

    try {
      const order = await confirmOrderByQR(data);
      navigation.replace('DeliveryConfirmedScreen', { order });
    } catch (err) {
      showErrorToast(err, Toast);
      setTimeout(() => {
        setScanned(false);
        isProcessingRef.current = false;
      }, 1500);
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionBody}>
          <Icon name="camera-alt" size={48} color={COLORS.textMuted} />
          <Text style={styles.permissionTitle}>Kamera İzni Gerekli</Text>
          <Text style={styles.permissionText}>
            QR kod okutabilmek için kamera erişimine izin vermeniz gerekiyor.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>İzin Ver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.scanFrame} />

          <Text style={styles.instructionText}>
            Müşterinin QR kodunu kare içine hizalayın
          </Text>

          {processing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color={COLORS.white} />
              <Text style={styles.processingText}>Doğrulanıyor...</Text>
            </View>
          )}
        </View>
      </CameraView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },

  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  instructionText: {
    marginTop: 24,
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  processingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  processingText: { fontSize: 14, color: '#FFF', fontWeight: '600' },

  permissionBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  permissionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  permissionText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  permissionButtonText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
});

export default ScanQRScreen;