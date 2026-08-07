import { getMessaging, getToken, onTokenRefresh } from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { getDeviceId } from './deviceId';
import { registerDevice } from '../services/api';

const messaging = getMessaging();

const requestAndroidPermission = async () => {
  if (Platform.OS !== 'android') return true;
  if (Platform.Version < 33) return true; // Android 13 öncesi izin gerekmiyor

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

export const setupPushNotifications = async () => {
  try {
    const enabled = await requestAndroidPermission();

    if (!enabled) {
      console.log('Bildirim izni verilmedi');
      return;
    }

    const fcmToken = await getToken(messaging);
    const deviceId = await getDeviceId();

    await registerDevice({
      deviceId,
      fcmToken,
      platform: Platform.OS,
      appVersion: '1.0.0',
    });

    console.log('Push notification kaydı tamamlandı');
  } catch (err) {
    console.log('Push notification kurulumu başarısız:', err.message);
  }
};

export const setupTokenRefreshListener = () => {
  return onTokenRefresh(messaging, async (newToken) => {
    try {
      const deviceId = await getDeviceId();
      await registerDevice({
        deviceId,
        fcmToken: newToken,
        platform: Platform.OS,
        appVersion: '1.0.0',
      });
      console.log('Token yenilendi ve backend güncellendi');
    } catch (err) {
      console.log('Token yenileme kaydı başarısız:', err.message);
    }
  });
};