import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/tokens';
import { api } from '../services/api';

function ElapsedTimer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [createdAt]);
  const text = elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
  return <Text style={styles.elapsed}>{text}</Text>;
}

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const load = () => api.getActiveAlerts().then(setAlerts).catch(() => {});
  useEffect(() => { load(); const iv = setInterval(load, 5000); return () => clearInterval(iv); }, []);

  const dismiss = async (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    api.acknowledgeAlert(id).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alert Center</Text>
        {alerts.length === 0 && <Text style={styles.allClear}>✓ All Clear</Text>}
      </View>
      {alerts.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-outline" size={48} color={colors.green} />
          <Text style={styles.emptyTitle}>No active alerts</Text>
          <Text style={styles.emptySub}>All zones operating within safe parameters</Text>
        </View>
      ) : (
        <FlatList data={alerts} keyExtractor={(a: any) => a.id} renderItem={({ item: a }) => (
          <View style={[styles.alertCard, { borderLeftColor: a.severity === 'CRITICAL' ? colors.critical : colors.orange }]}>
            <View style={styles.alertTop}>
              <View style={styles.alertBadge}>
                <Text style={[styles.badgeText, { color: a.severity === 'CRITICAL' ? colors.critical : colors.orange }]}>{a.severity}</Text>
              </View>
              <Text style={styles.alertTitle} numberOfLines={1}>{a.title}</Text>
              <ElapsedTimer createdAt={a.created_at} />
              <TouchableOpacity onPress={() => dismiss(a.id)} style={styles.dismissBtn}>
                <Ionicons name="close" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.alertMsg}>{a.zone_id} — {a.message}</Text>
            <View style={styles.timerBar}>
              <View style={[styles.timerFill, { width: `${Math.min(100, ((Date.now() - new Date(a.created_at).getTime()) / 1000 / 300) * 100)}%` }]} />
            </View>
          </View>
        )} contentContainerStyle={{ padding: spacing.md }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  title: { fontSize: 20, fontWeight: '800' as const, color: colors.textBright },
  allClear: { fontSize: 13, color: colors.green, fontWeight: '600' as const },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700' as const, color: colors.green },
  emptySub: { fontSize: 13, color: colors.textMuted },
  alertCard: { backgroundColor: colors.glass, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.sm, borderLeftWidth: 3, borderWidth: 1, borderColor: colors.glassBorder },
  alertTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.05)' },
  badgeText: { fontSize: 9, fontWeight: '700' as const, textTransform: 'uppercase' as const },
  alertTitle: { fontSize: 12, fontWeight: '600' as const, color: colors.text, flex: 1 },
  elapsed: { fontSize: 10, color: colors.textMuted, fontFamily: 'Courier' },
  dismissBtn: { padding: 4 },
  alertMsg: { fontSize: 11, color: colors.textDim, marginTop: 6 },
  timerBar: { height: 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1, marginTop: 8 },
  timerFill: { height: '100%', backgroundColor: colors.orange, borderRadius: 1 },
});
