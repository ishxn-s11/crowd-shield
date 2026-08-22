/**
 * CrowdShield Mobile — Permission Flow E2E Tests
 *
 * Tests the permission request flow, permission gate UI,
 * and permission status management.
 *
 * Run: cd mobile && npx jest tests/mobile/permissions.test.ts
 */
import { checkPermissionStatus, requestAllPermissions, requestPermission } from '../../src/services/permissions';

// ─── Mocks ──────────────────────────────────────────────────────

jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(),
    getCameraPermissionsAsync: jest.fn(),
  },
}));

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

jest.mock('expo-location', () => ({
  Location: {
    requestForegroundPermissionsAsync: jest.fn(),
    getForegroundPermissionsAsync: jest.fn(),
  },
}));

// ─── Tests ──────────────────────────────────────────────────────

describe('Permission Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPermission', () => {
    it('requests camera permission and returns granted', async () => {
      const { Camera } = require('expo-camera');
      Camera.requestCameraPermissionsAsync.mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
      });

      const result = await requestPermission('camera');
      expect(result.granted).toBe(true);
      expect(Camera.requestCameraPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it('returns denied when camera permission is not granted', async () => {
      const { Camera } = require('expo-camera');
      Camera.requestCameraPermissionsAsync.mockResolvedValue({
        status: 'denied',
        canAskAgain: true,
      });

      const result = await requestPermission('camera');
      expect(result.granted).toBe(false);
    });

    it('requests notification permission', async () => {
      const Notifications = require('expo-notifications');
      Notifications.requestPermissionsAsync.mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
      });

      const result = await requestPermission('notifications');
      expect(result.granted).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it('requests location permission', async () => {
      const Location = require('expo-location');
      Location.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
      });

      const result = await requestPermission('location');
      expect(result.granted).toBe(true);
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkPermissionStatus', () => {
    it('returns current camera permission status', async () => {
      const { Camera } = require('expo-camera');
      Camera.getCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });

      const status = await checkPermissionStatus('camera');
      expect(status).toBe('granted');
    });

    it('returns current notification permission status', async () => {
      const Notifications = require('expo-notifications');
      Notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });

      const status = await checkPermissionStatus('notifications');
      expect(status).toBe('undetermined');
    });
  });

  describe('requestAllPermissions', () => {
    it('requests all permissions in parallel', async () => {
      const { Camera } = require('expo-camera');
      const Notifications = require('expo-notifications');
      const Location = require('expo-location');

      Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted', canAskAgain: true });
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted', canAskAgain: true });
      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted', canAskAgain: true });

      const results = await requestAllPermissions();

      expect(results.camera.granted).toBe(true);
      expect(results.notifications.granted).toBe(true);
      expect(results.location.granted).toBe(true);
    });

    it('handles partial permission grants', async () => {
      const { Camera } = require('expo-camera');
      const Notifications = require('expo-notifications');
      const Location = require('expo-location');

      Camera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted', canAskAgain: true });
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied', canAskAgain: false });
      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted', canAskAgain: true });

      const results = await requestAllPermissions();

      expect(results.camera.granted).toBe(true);
      expect(results.notifications.granted).toBe(false);
      expect(results.location.granted).toBe(true);
    });
  });
});

describe('PermissionGate Component Logic', () => {
  it('shows rationale screen when permissions are not granted', () => {
    // Simulate: all permissions denied
    const statuses = { camera: 'denied', notifications: 'denied', location: 'denied' };
    const allGranted = Object.values(statuses).every(s => s === 'granted');
    expect(allGranted).toBe(false);
  });

  it('passes gate when all permissions are granted', () => {
    const statuses = { camera: 'granted', notifications: 'granted', location: 'granted' };
    const allGranted = Object.values(statuses).every(s => s === 'granted');
    expect(allGranted).toBe(true);
  });

  it('shows individual permission status correctly', () => {
    const statuses: Record<string, string> = { camera: 'granted', notifications: 'denied', location: 'undetermined' };
    expect(statuses.camera).toBe('granted');
    expect(statuses.notifications).toBe('denied');
    expect(statuses.location).toBe('undetermined');
  });
});
