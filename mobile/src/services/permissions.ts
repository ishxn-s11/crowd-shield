import { Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

export type PermissionType = 'camera' | 'notifications' | 'location' | 'microphone';

interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function openSettings() {
  try {
    await Linking.openSettings();
  } catch {}
}

function showBlockedAlert(type: PermissionType, onRetry?: () => void) {
  const messages: Record<PermissionType, { title: string; message: string }> = {
    camera: {
      title: 'Camera Access Required',
      message: 'CrowdShield needs camera access to detect crowd density in real-time. Please enable it in Settings.',
    },
    notifications: {
      title: 'Notification Access Required',
      message: 'CrowdShield needs notification access to send you critical crowd safety alerts. Please enable it in Settings.',
    },
    location: {
      title: 'Location Access Required',
      message: 'CrowdShield needs location access to show nearby safe routes during emergencies.',
    },
    microphone: {
      title: 'Microphone Access Required',
      message: 'CrowdShield needs microphone access for ambient noise level monitoring.',
    },
  };

  const msg = messages[type];
  Alert.alert(msg.title, msg.message, [
    { text: 'Open Settings', onPress: openSettings },
    { text: 'Cancel', style: 'cancel' },
    ...(onRetry ? [{ text: 'Try Again', onPress: onRetry }] : []),
  ]);
}

async function requestCameraPermission(): Promise<PermissionResult> {
  if (Platform.OS === 'web') return { granted: true, canAskAgain: false };
  const { Camera } = await import('expo-camera');
  const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
  const granted = status === 'granted';
  if (!granted && !canAskAgain) showBlockedAlert('camera');
  return { granted, canAskAgain };
}

async function requestNotificationPermission(): Promise<PermissionResult> {
  if (Platform.OS === 'web') return { granted: true, canAskAgain: false };
  const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
  const granted = status === 'granted';
  if (!granted && !canAskAgain) showBlockedAlert('notifications');
  // Also schedule a test notification channel for Android
  if (granted && Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('crowd-alerts', {
      name: 'Crowd Safety Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C50022',
    });
  }
  return { granted, canAskAgain };
}

async function requestLocationPermission(): Promise<PermissionResult> {
  if (Platform.OS === 'web') return { granted: true, canAskAgain: false };
  const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
  const granted = status === 'granted';
  if (!granted && !canAskAgain) showBlockedAlert('location');
  return { granted, canAskAgain };
}

export async function requestAllPermissions(): Promise<Record<PermissionType, PermissionResult>> {
  const [camera, notifications, location] = await Promise.all([
    requestCameraPermission(),
    requestNotificationPermission(),
    requestLocationPermission(),
  ]);
  return { camera, notifications, location, microphone: { granted: false, canAskAgain: false } };
}

export async function requestPermission(type: PermissionType): Promise<PermissionResult> {
  switch (type) {
    case 'camera': return requestCameraPermission();
    case 'notifications': return requestNotificationPermission();
    case 'location': return requestLocationPermission();
    default: return { granted: false, canAskAgain: false };
  }
}

export async function checkPermissionStatus(type: PermissionType): Promise<'granted' | 'denied' | 'undetermined'> {
  if (Platform.OS === 'web') return 'granted';
  switch (type) {
    case 'camera': {
      const { Camera } = await import('expo-camera');
      const { status } = await Camera.getCameraPermissionsAsync();
      return status as any;
    }
    case 'notifications': {
      const { status } = await Notifications.getPermissionsAsync();
      return status as any;
    }
    case 'location': {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status as any;
    }
    default: return 'undetermined';
  }
}

// Send a local notification (for testing)
export async function sendLocalNotification(title: string, body: string, data?: Record<string, any>) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true, priority: Notifications.AndroidNotificationPriority.HIGH },
    trigger: null,
  });
}
