import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, NeuShadow } from '../theme/tokens';
import { GlassCard, RiskBadge, SectionHeader } from '../components/UI';

const MOCK_INCIDENTS = [
  { id: 'INC-001', type: 'Crowd Surge', severity: 'CRITICAL', zone: 'Central Plaza', time: '2 min ago', status: 'active', reported: 'AI Detection' },
  { id: 'INC-002', type: 'Medical Emergency', severity: 'HIGH', zone: 'Food Court', time: '8 min ago', status: 'responding', reported: 'Citizen Report' },
  { id: 'INC-003', type: 'Barrier Breach', severity: 'MODERATE', zone: 'North Gate', time: '15 min ago', status: 'resolved', reported: 'CCTV AI' },
  { id: 'INC-004', type: 'Missing Person', severity: 'HIGH', zone: 'Stadium', time: '22 min ago', status: 'active', reported: 'Citizen Report' },
  { id: 'INC-005', type: 'Suspicious Activity', severity: 'MODERATE', zone: 'East Wing', time: '35 min ago', status: 'investigating', reported: 'CCTV AI' },
];

export default function IncidentsScreen() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? MOCK_INCIDENTS : MOCK_INCIDENTS.filter(i => i.status === filter);

  const getStatusColor = (s: string) => s === 'active' ? Colors.red : s === 'responding' ? Colors.orange : s === 'resolved' ? Colors.green : Colors.beige;

  return (
    <ScrollView style={styles.container}>
      <SectionHeader
        icon={<Ionicons name="alert-circle" size={14} color={Colors.red} />}
        title="INCIDENTS"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {['all', 'active', 'responding', 'investigating', 'resolved'].map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterBtn, filter === f && styles.filterBtnActive]}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.map(inc => (
        <GlassCard key={inc.id} style={styles.incidentCard}>
          <View style={styles.incidentHeader}>
            <View style={[styles.incidentIconWrap, { backgroundColor: getStatusColor(inc.status) + '20' }]}>
              <Ionicons name="alert-circle" size={18} color={getStatusColor(inc.status)} />
            </View>
            <View style={styles.incidentHeaderInfo}>
              <Text style={styles.incidentType}>{inc.type}</Text>
              <Text style={styles.incidentTime}>{inc.time} · {inc.zone}</Text>
            </View>
            <RiskBadge level={inc.severity} size="sm" />
          </View>
          <View style={styles.incidentFooter}>
            <View style={styles.incidentTag}>
              <Ionicons name="radio" size={10} color={getStatusColor(inc.status)} />
              <Text style={[styles.incidentTagText, { color: getStatusColor(inc.status) }]}>{inc.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.incidentReported}>{inc.reported}</Text>
          </View>
        </GlassCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
  filterRow: { marginBottom: Spacing.lg, maxHeight: 36 },
  filterBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.glassBorder, marginRight: Spacing.sm, backgroundColor: Colors.glass },
  filterBtnActive: { backgroundColor: Colors.red + '20', borderColor: Colors.red + '40' },
  filterText: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.5 },
  filterTextActive: { color: Colors.red },
  incidentCard: { marginBottom: Spacing.md },
  incidentHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  incidentIconWrap: { width: 36, height: 36, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  incidentHeaderInfo: { flex: 1 },
  incidentType: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  incidentTime: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  incidentFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.glassBorder, paddingTop: Spacing.md },
  incidentTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  incidentTagText: { fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 0.5 },
  incidentReported: { color: Colors.textDim, fontSize: FontSize.xs },
});
