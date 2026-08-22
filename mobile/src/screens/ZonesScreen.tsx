import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, riskColors, spacing, radius } from '../theme/tokens';
import { api } from '../services/api';

const { width } = Dimensions.get('window');

// Venue zones layout (normalized 0-1 coordinates)
const VENUE_ZONES = [
  { id: 'Z1', name: 'Main Entrance', cx: 0.45, cy: 0.1, w: 0.2, h: 0.1, gates: ['G1', 'G2'] },
  { id: 'Z2', name: 'North Corridor', cx: 0.45, cy: 0.22, w: 0.4, h: 0.08, gates: ['G3'] },
  { id: 'Z3', name: 'Food Court', cx: 0.17, cy: 0.35, w: 0.2, h: 0.12, gates: [] },
  { id: 'Z4', name: 'East Wing', cx: 0.78, cy: 0.35, w: 0.25, h: 0.15, gates: ['G4'] },
  { id: 'Z5', name: 'Central Plaza', cx: 0.45, cy: 0.5, w: 0.25, h: 0.18, gates: ['G5'] },
  { id: 'Z6', name: 'Stadium', cx: 0.5, cy: 0.78, w: 0.35, h: 0.18, gates: ['G6', 'G7'] },
  { id: 'Z7', name: 'Parking Area', cx: 0.12, cy: 0.72, w: 0.18, h: 0.2, gates: ['G8'] },
];

export default function ZonesScreen() {
  const [state, setState] = useState<any>(null);
  const [selected, setSelected] = useState('Z5');
  const zones = state?.zones || {};

  useEffect(() => {
    const load = () => api.getRiskLive().then(setState).catch(() => {});
    load(); const iv = setInterval(load, 5000); return () => clearInterval(iv);
  }, []);

  const sel = zones[selected];
  const rc = (risk: string) => riskColors[risk] || colors.green;

  return (
    <ScrollView style={styles.container}>
      {/* Digital Twin */}
      <View style={styles.twinCard}>
        <View style={styles.twinHeader}>
          <Text style={styles.twinTitle}>VENUE DIGITAL TWIN</Text>
          <Text style={styles.twinLive}>● LIVE</Text>
        </View>
        <View style={styles.twinCanvas}>
          {/* Venue boundary */}
          <View style={styles.venueBoundary} />

          {/* Zone blocks */}
          {VENUE_ZONES.map(z => {
            const data = zones[z.id];
            const isActive = selected === z.id;
            const color = rc(data?.risk_level || 'LOW');
            const left = (z.cx - z.w / 2) * width * 0.88;
            const top = (z.cy - z.h / 2) * (width * 0.88);
            const w = z.w * width * 0.88;
            const h = z.h * (width * 0.88);

            return (
              <TouchableOpacity
                key={z.id}
                style={[styles.zoneBlock, { left, top, width: w, height: h, borderColor: color, borderWidth: isActive ? 2 : 1, opacity: isActive ? 1 : 0.6 }]}
                onPress={() => setSelected(z.id)}
              >
                <Text style={[styles.zoneBlockName, { color }]} numberOfLines={1}>{z.name}</Text>
                <Text style={[styles.zoneBlockScore, { color }]}>{data ? Math.round(data.risk_score) : '—'}</Text>
                <Text style={styles.zoneBlockCount}>{data?.person_count || 0}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Gate markers */}
          {VENUE_ZONES.map(z => z.gates.map((g, gi) => {
            const gx = z.cx * width * 0.88 + (gi * 14 - 7);
            const gy = (z.cy - z.h / 2) * (width * 0.88) - 8;
            return (
              <View key={g} style={[styles.gateMarker, { left: gx, top: gy }]}>
                <Text style={styles.gateText}>{g}</Text>
              </View>
            );
          }))}
        </View>
      </View>

      {/* Zone Details */}
      {sel && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailName}>{sel.name || selected}</Text>
            <View style={[styles.detailBadge, { backgroundColor: rc(sel.risk_level) + '20' }]}> 
              <Text style={[styles.detailBadgeText, { color: rc(sel.risk_level) }]}>{sel.risk_level}</Text>
            </View>
          </View>
          <View style={styles.detailGrid}>
            {[
              { label: 'Risk Score', value: Math.round(sel.risk_score), color: rc(sel.risk_level) },
              { label: 'People', value: sel.person_count, color: colors.beige },
              { label: 'Density', value: `${sel.density} p/m²`, color: colors.beige },
              { label: 'Velocity', value: `${sel.avg_velocity} m/s`, color: colors.green },
              { label: 'Flow Conflict', value: `${Math.round(sel.flow_conflict * 100)}%`, color: colors.orange },
              { label: 'Bottleneck', value: `${Math.round(sel.bottleneck_score * 100)}%`, color: colors.critical },
            ].map((m, i) => (
              <View key={i} style={styles.metricCard}>
                <Text style={styles.metricLabel}>{m.label}</Text>
                <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Zone List */}
      <View style={styles.listCard}>
        <Text style={styles.cardTitle}>ALL ZONES</Text>
        {Object.entries(zones).map(([zid, z]: [string, any]) => {
          const zc = rc(z.risk_level);
          return (
            <TouchableOpacity key={zid} style={[styles.listItem, selected === zid && { backgroundColor: 'rgba(197,0,34,0.08)' }]} onPress={() => setSelected(zid)}>
              <View style={[styles.listDot, { backgroundColor: zc }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.listName}>{z.name || zid}</Text>
                <Text style={styles.listSub}>{z.person_count} people · {z.density} p/m²</Text>
              </View>
              <Text style={[styles.listScore, { color: zc }]}>{Math.round(z.risk_score)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  twinCard: { backgroundColor: colors.glass, margin: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.glassBorder, overflow: 'hidden' },
  twinHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  twinTitle: { fontSize: 10, fontWeight: '700' as const, color: colors.textMuted, letterSpacing: 1 },
  twinLive: { fontSize: 10, color: colors.green, fontWeight: '600' as const },
  twinCanvas: { width: '100%', aspectRatio: 1.2, position: 'relative' },
  venueBoundary: { position: 'absolute', inset: 4, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 8, borderStyle: 'dashed' },
  zoneBlock: { position: 'absolute', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center' },
  zoneBlockName: { fontSize: 8, fontWeight: '600' as const },
  zoneBlockScore: { fontSize: 14, fontWeight: '800' as const },
  zoneBlockCount: { fontSize: 7, color: colors.textMuted },
  gateMarker: { position: 'absolute', backgroundColor: colors.critical, borderRadius: 4, paddingHorizontal: 3, paddingVertical: 1 },
  gateText: { fontSize: 6, color: '#fff', fontWeight: '700' as const },
  detailCard: { backgroundColor: colors.glass, margin: spacing.md, marginTop: 0, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.glassBorder },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  detailName: { fontSize: 16, fontWeight: '700' as const, color: colors.textBright },
  detailBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  detailBadgeText: { fontSize: 10, fontWeight: '600' as const },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricCard: { width: (width - spacing.md * 4 - 16) / 2 - 4, backgroundColor: colors.inputBg, borderRadius: radius.sm, padding: spacing.md },
  metricLabel: { fontSize: 9, color: colors.textMuted, textTransform: 'uppercase' as const },
  metricValue: { fontSize: 18, fontWeight: '700' as const, marginTop: 4 },
  listCard: { backgroundColor: colors.glass, margin: spacing.md, marginTop: 0, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.glassBorder },
  cardTitle: { fontSize: 11, fontWeight: '700' as const, color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12 },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  listDot: { width: 8, height: 8, borderRadius: 4 },
  listName: { fontSize: 13, fontWeight: '600' as const, color: colors.text },
  listSub: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  listScore: { fontSize: 16, fontWeight: '700' as const },
});
