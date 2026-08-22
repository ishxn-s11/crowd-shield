import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, riskColors, spacing, radius } from '../theme/tokens';
import { api } from '../services/api';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: any) {
  const [state, setState] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [riskRes, alertRes] = await Promise.all([api.getRiskLive(), api.getActiveAlerts()]);
      setState(riskRes);
      setAlerts(alertRes);
    } catch {}
  };

  useEffect(() => { load(); const iv = setInterval(load, 5000); return () => clearInterval(iv); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const risk = state?.overall_risk || 0;
  const riskLevel = state?.overall_risk_level || 'LOW';
  const zones = state?.zones || {};
  const riskColor = riskColors[riskLevel] || colors.green;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.red} />}>
      {/* Risk Gauge */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>OVERALL RISK SCORE</Text>
        <View style={styles.riskRow}>
          <View style={styles.gaugeOuter}>
            <View style={styles.gaugeInner}>
              <Text style={[styles.gaugeValue, { color: riskColor }]}>{Math.round(risk)}</Text>
              <Text style={[styles.gaugeLabel, { color: riskColor }]}>{riskLevel}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.riskDesc}>
              {riskLevel === 'CRITICAL' ? 'Immediate action required.' :
               riskLevel === 'HIGH' ? 'Heightened alert. Several zones approaching critical thresholds.' :
               riskLevel === 'MODERATE' ? 'Monitoring elevated conditions.' :
               'All zones within safe operating parameters.'}
            </Text>
          </View>
        </View>
      </View>

      {/* Zone Cards */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ZONE RISK LEVELS</Text>
        <View style={styles.zoneGrid}>
          {Object.entries(zones).map(([zid, z]: [string, any]) => {
            const zc = riskColors[z.risk_level] || colors.green;
            return (
              <TouchableOpacity key={zid} style={[styles.zoneCard, { borderLeftColor: zc }]} onPress={() => navigation.navigate('Zones')}>
                <Text style={styles.zoneName}>{z.name || zid}</Text>
                <Text style={[styles.zoneScore, { color: zc }]}>{Math.round(z.risk_score)}</Text>
                <Text style={styles.zonePeople}>{z.person_count} people</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Alerts */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>ACTIVE ALERTS</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
            <Text style={styles.viewAll}>View all →</Text>
          </TouchableOpacity>
        </View>
        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={32} color={colors.green} />
            <Text style={styles.emptyText}>No active alerts</Text>
          </View>
        ) : alerts.slice(0, 3).map((a: any) => (
          <View key={a.id} style={[styles.alertCard, { borderLeftColor: a.severity === 'CRITICAL' ? colors.critical : colors.orange }]}> 
            <View style={styles.alertRow}>
              <Text style={[styles.alertBadge, { color: a.severity === 'CRITICAL' ? colors.critical : colors.orange }]}>{a.severity}</Text>
              <Text style={styles.alertTitle} numberOfLines={1}>{a.title}</Text>
            </View>
            <Text style={styles.alertMsg}>{a.zone_id} — {a.message}</Text>
          </View>
        ))}
      </View>

      {/* Quick Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>STATUS OVERVIEW</Text>
        <View style={styles.statsGrid}>
          {[
            { label: 'Zones', value: Object.keys(zones).length, icon: 'map' as const, color: colors.red },
            { label: 'Alerts', value: alerts.length, icon: 'alert-circle' as const, color: alerts.length > 0 ? colors.critical : colors.green },
            { label: 'Crowd', value: Object.values(zones).reduce((s: number, z: any) => s + (z.person_count || 0), 0), icon: 'people' as const, color: colors.beige },
            { label: 'Risk', value: riskLevel, icon: 'shield-checkmark' as const, color: riskColor },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, { borderLeftColor: s.color }]}> 
              <Ionicons name={s.icon} size={16} color={s.color} />
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.glass, margin: spacing.md, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.glassBorder },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 11, fontWeight: '700' as const, color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12 },
  viewAll: { fontSize: 12, color: colors.red, fontWeight: '600' as const },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  gaugeOuter: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  gaugeInner: { alignItems: 'center' },
  gaugeValue: { fontSize: 28, fontWeight: '800' as const },
  gaugeLabel: { fontSize: 10, fontWeight: '600' as const },
  riskDesc: { fontSize: 12, color: colors.textDim, lineHeight: 18 },
  zoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  zoneCard: { width: (width - spacing.md * 4 - 8) / 2, backgroundColor: colors.inputBg, borderRadius: radius.sm, padding: spacing.md, borderLeftWidth: 3 },
  zoneName: { fontSize: 11, color: colors.textDim, marginBottom: 4 },
  zoneScore: { fontSize: 20, fontWeight: '800' as const },
  zonePeople: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
  alertCard: { backgroundColor: colors.inputBg, borderRadius: radius.sm, padding: spacing.md, marginBottom: 8, borderLeftWidth: 3 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertBadge: { fontSize: 9, fontWeight: '700' as const, textTransform: 'uppercase' as const },
  alertTitle: { fontSize: 12, color: colors.text, flex: 1 },
  alertMsg: { fontSize: 11, color: colors.textDim, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: { width: (width - spacing.md * 4 - 24) / 2, backgroundColor: colors.inputBg, borderRadius: radius.sm, padding: spacing.md, borderLeftWidth: 3, gap: 4 },
  statLabel: { fontSize: 10, color: colors.textMuted },
  statValue: { fontSize: 16, fontWeight: '700' as const },
});
