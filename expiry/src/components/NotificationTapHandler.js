import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { getMessaging, onNotificationOpenedApp, getInitialNotification, onMessage } from '@react-native-firebase/messaging';
import { useWorkspace } from '../context/WorkspaceContext';
import { resolveNotificationTarget } from '../utils/notificationRouter';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function NotificationTapHandler() {
  const { switchWorkspace } = useWorkspace();

  useEffect(() => {
    const messagingInstance = getMessaging();

    const handleTap = (remoteMessage) => {
      if (!remoteMessage) return;
      const { workspace, screen, params } = resolveNotificationTarget(remoteMessage);
      switchWorkspace(workspace, screen ? { screen, params } : null);
    };

    const unsubTap = onNotificationOpenedApp(messagingInstance, handleTap);
    getInitialNotification(messagingInstance).then(handleTap);

    // Foreground: FCM otomatik göstermiyor (Android), expo-notifications ile manuel tetikliyoruz
    const unsubForeground = onMessage(messagingInstance, async (remoteMessage) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
          data: remoteMessage.data,
        },
        trigger: null, // hemen göster
      });
    });

    // Foreground'da kullanıcı bu local notification'a tıklarsa da yönlendirme çalışsın
    const tapListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      handleTap({ data });
    });

    return () => {
      unsubTap();
      unsubForeground();
      tapListener.remove();
    };
  }, []);

  return null;
}