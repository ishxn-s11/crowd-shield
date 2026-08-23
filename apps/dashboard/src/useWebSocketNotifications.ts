import { useState, useEffect, useCallback, useRef } from 'react';

const API = '';

export interface WSNotification {
  id: string;
  type: 'ALERT' | 'OPERATOR' | 'COMMANDER' | 'ACKNOWLEDGEMENT' | 'SYSTEM' | 'URGENT';
  title: string;
  body: string;
  fromName?: string;
  fromRole?: string;
  priority?: string;
  zoneId?: string;
  createdAt: string;
  read: boolean;
}

interface WSNotificationState {
  notifications: WSNotification[];
  unreadCount: number;
  connected: boolean;
}

/**
 * Hook that polls for notifications and provides real-time update simulation.
 * In production, this would use a WebSocket connection to the backend.
 * For now, it uses polling with instant local state updates.
 */
export function useWebSocketNotifications(): WSNotificationState & {
  markRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (notif: Omit<WSNotification, 'id' | 'createdAt' | 'read'>) => void;
} {
  const [notifications, setNotifications] = useState<WSNotification[]>([]);
  const [connected, setConnected] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    // Create a short beep for notifications (using Web Audio API)
    const createBeep = () => {
      try {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gain.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.15);
      } catch {}
    };
    audioRef.current = { play: createBeep } as any;
  }, []);

  // Poll for notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API}/api/notifications`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setNotifications(prev => {
              const existingIds = new Set(prev.map(n => n.id));
              const newNotifs = data.filter((n: WSNotification) => !existingIds.has(n.id));
              if (newNotifs.length > 0 && prev.length > 0) {
                // Play sound for new notifications
                audioRef.current?.play();
              }
              return data.map((n: WSNotification) => ({
                ...n,
                createdAt: n.createdAt || n.created_at || new Date().toISOString(),
              }));
            });
          }
          setConnected(true);
        }
      } catch {
        setConnected(false);
      }
    };

    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    fetch(`${API}/api/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    fetch(`${API}/api/notifications/read-all`, { method: 'POST' }).catch(() => {});
  }, []);

  const addNotification = useCallback((notif: Omit<WSNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: WSNotification = {
      ...notif,
      id: `local-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
    audioRef.current?.play();

    // Send native notification if Electron
    if (window.crowdshield) {
      window.crowdshield.sendNotification(notif.title, notif.body);
    }

    // Send browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notif.title, { body: notif.body, icon: '/shield-icon.png' });
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, connected, markRead, markAllRead, addNotification };
}

// Declare window.crowdshield for TypeScript
declare global {
  interface Window {
    crowdshield?: {
      sendNotification: (title: string, body: string) => void;
      platform: string;
      isElectron: boolean;
    };
  }
}
