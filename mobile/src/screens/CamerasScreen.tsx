import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, NeuShadow } from '../theme/tokens';
import { API } from '../services/api';
import { GlassCard, RiskBadge, SectionHeader } from '../components/UI';

const CAMERAS = [
  { id: 'CAM-01', name: 'Main Entrance', zone: 'Entrance', status: 'online' },
  { id: 'CAM-02', name: 'North Corridor', zone: 'Corridor', status: 'online' },
  { id: 'CAM-03', name: 'Food Court', zone: 'Food Court', status: 'online' },
  { id: 'CAM-04', name: 'East Wing', zone: 'East Wing', status: 'offline' },
  { id: 'CAM-05', name: 'Central Plaza', zone: 'Plaza', status: 'online' },
  { id: 'CAM-06', name: 'Stadium Gate', zone: 'Stadium', status: 'online' },
];

export default function CamerasScreen() {
  const [state, setState] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const load = () => fetch(`${API}/api/risk/live`).then(r => r.json()).then(setState).catch(() => {});
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try { const r = await fetch(`${API}/api/risk/live`); setState(await r.json()); } catch {}
    setRefreshing(false);
  };

  const zones = state?.zones || [];
  const getZoneData = (name: string) => zones.find((z: any) => z.name?.toLowerCase().includes(name.toLowerCase()));

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.red} />}>
      <SectionHeader icon={<Ionicons name="videocam" size={14} color={Colors.red} />} title="CCTV CAMERAS" />

      <View style={styles.grid}>
        {CAMERAS.map(cam => {
          const zd = getZoneData(cam.zone);
          return (
            <GlassCard key={cam.id} style={styles.camCard} padding={0}>
              <View style={[styles.camPreview, cam.status === 'offline' && styles.camOffline]}>
                <View style={styles.camOverlay}>
                  <Text style={styles.camId}>{cam.id}</Text>
                  <View style={[styles.statusDot, { backgroundColor: cam.status === 'online' ? Colors.green : '#ff4444' }]} />
                </View>
                <View style={styles.camPlaceholder}>
                  <Ionicons name={cam.status === 'online' ? 'videocam' : 'videocam-outline'} size={32} color={Colors.textDim} />
                </View>
                {cam.status === 'online' && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                )}
              </View>
              <View style={styles.camInfo}>
                <Text style={styles.camName}>{cam.name}</Text>
                <Text style={styles.camZone}>{cam.zone}</Text>
                {zd && <RiskBadge level={zd.risk_level} size="sm" />}
              </View>
            </GlassCard>
          );
        })}
      </View>

      <View style={styles.statsRow}>
        <GlassCard style={styles.miniStat} padding={Spacing.md}>
          <Text style={styles.miniStatValue}>{CAMERAS.filter(c => c.status === 'online').length}</Text>
          <Text style={styles.miniStatLabel}>Online</Text>
        </GlassCard>
        <GlassCard style={styles.miniStat} padding={Spacing.md}>
          <Text style={[styles.miniStatValue, { color: '#ff4444' }]}>{CAMERAS.filter(c => c.status === 'offline').length}</Text>
          <Text style={styles.miniStatLabel}>Offline</Text>
        </GlassCard>
        <GlassCard style={styles.miniStat} padding={Spacing.md}>
          <Text style={[styles.miniStatValue, { color: Colors.beige }]}>{CAMERAS.length}</Text>
          <Text style={styles.miniStatLabel}>Total</Text>
        </GlassCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg },
  camCard: { width: '48%', marginBottom: 0 },
  camPreview: { height: 120, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.lg, overflow: 'hidden', position: 'relative' },
  camOffline: { opacity: 0.5 },
  camOverlay: { position: 'absolute', top: 8, left: 8, right: 8, flexDirection: 'row', justifyContent: 'space-between', zIndex: 2 },
  camId: { color: Colors.text, fontSize: FontSize.xs, fontWeight: '700', fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  camPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  liveBadge: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(197,0,34,0.8)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 4, zIndex: 2 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff4444' },
  liveText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  camInfo: { padding: Spacing.md, gap: 4 },
  camName: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  camZone: { color: Colors.textMuted, fontSize: FontSize.xs },
  statsRow: { flexDirection: 'row', gap: Spacing.md },
  miniStat: { flex: 1, alignItems: 'center' },
  miniStatValue: { color: Colors.green, fontSize: FontSize.xxl, fontWeight: '800' },
  miniStatLabel: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
});
