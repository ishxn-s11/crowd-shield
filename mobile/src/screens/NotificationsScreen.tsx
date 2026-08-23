import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme/tokens';

const TYPE_COLORS: Record<string, string> = {
  OPERATOR: Colors.red,
  COMMANDER: Colors.beige,
  ACKNOWLEDGEMENT: Colors.green,
  ALERT: '#f0ad4e',
  SYSTEM: Colors.textMuted,
};
const TYPE_ICONS: Record<string, string> = {
  OPERATOR: '📹', COMMANDER: '🎖️', ACKNOWLEDGEMENT: '✅', ALERT: '⚠️', SYSTEM: '⚙️',
};

interface Notif {
  id: string; type: string; title: string; body: string;
  fromName?: string; createdAt: string; read: boolean;
}

const DEMO_NOTIFS: Notif[] = [
  { id: '1', type: 'ALERT', title: 'Zone Z5 — High Density Alert', body: 'Density exceeded 2.0 p/m² in Central Plaza', createdAt: new Date().toISOString(), read: false },
  { id: '2', type: 'COMMANDER', title: 'Team Alpha Deployed', body: 'Response team dispatched to Zone Z1', fromName: 'Commander Davis', createdAt: new Date(Date.now() - 300000).toISOString(), read: false },
  { id: '3', type: 'ACKNOWLEDGEMENT', title: 'Alert Acknowledged', body: 'Alert ACK-001 acknowledged by Operator #3', createdAt: new Date(Date.now() - 600000).toISOString(), read: true },
  { id: '4', type: 'OPERATOR', title: 'CCTV Feed Online', body: 'CAM-03 stream reconnected', fromName: 'Operator Lee', createdAt: new Date(Date.now() - 900000).toISOString(), read: true },
];

export default function NotificationsScreen() {
  const [filter, setFilter] = useState('ALL');
  const [notifications, setNotifications] = useState<Notif[]>(DEMO_NOTIFS);

  const filtered = filter === 'ALL' ? notifications : notifications.filter(n => n.type === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}>
          <Text style={styles.markAllRead}>Mark All Read</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {['ALL', 'OPERATOR', 'COMMANDER', 'ACKNOWLEDGEMENT'].map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'ALL' ? 'All' : f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Notification Items */}
      {filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>No notifications</Text>
        </View>
      ) : filtered.map(notif => {
        const color = TYPE_COLORS[notif.type] || Colors.textDim;
        return (
          <TouchableOpacity key={notif.id} onPress={() => markRead(notif.id)} activeOpacity={0.7}>
            <View style={[styles.notifItem, { borderLeftColor: color, opacity: notif.read ? 0.7 : 1 }]}>
              <View style={styles.notifHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 14 }}>{TYPE_ICONS[notif.type] || '🔔'}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.typeBadgeText, { color }]}>{notif.type}</Text>
                  </View>
                  {notif.fromName && <Text style={styles.fromName}>from {notif.fromName}</Text>}
                </View>
                <Text style={styles.timeText}>
                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={[styles.notifTitle, !notif.read && { fontWeight: '600' }]}>{notif.title}</Text>
              {notif.body ? <Text style={styles.notifBody}>{notif.body}</Text> : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
  badge: { marginLeft: 8, backgroundColor: Colors.red, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  badgeText: { fontSize: 10, fontWeight: '700', color: 'white' },
  markAllRead: { fontSize: 11, color: Colors.textDim },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.glassBorder, backgroundColor: 'rgba(17,24,39,1)' },
  filterPillActive: { borderColor: Colors.red, backgroundColor: Colors.red + '20' },
  filterText: { fontSize: 11, fontWeight: '600', color: Colors.textDim },
  filterTextActive: { color: Colors.red },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: Colors.green, fontWeight: '600', marginTop: 12 },
  notifItem: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 12, borderLeftWidth: 3, marginBottom: 8 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  typeBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 },
  typeBadgeText: { fontSize: 9, fontWeight: '700' },
  fromName: { fontSize: 11, color: Colors.textDim, marginLeft: 6 },
  timeText: { fontSize: 10, color: Colors.textMuted },
  notifTitle: { fontSize: 13, color: Colors.text },
  notifBody: { fontSize: 11, color: Colors.textMuted, marginTop: 4, lineHeight: 16 },
});
