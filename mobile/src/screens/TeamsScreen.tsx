import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, NeuShadow } from '../theme/tokens';
import { API } from '../services/api';
import { GlassCard, RiskBadge, NeuButton, SectionHeader } from '../components/UI';

const MOCK_TEAMS = [
  { id: 'T1', name: 'Alpha Response', members: 8, status: 'active', leader: 'Sgt. Kumar', zone: 'Main Entrance', specialty: 'Crowd Control' },
  { id: 'T2', name: 'Bravo Medical', members: 6, status: 'active', leader: 'Dr. Patel', zone: 'Medical Tent', specialty: 'Medical Response' },
  { id: 'T3', name: 'Charlie Evac', members: 10, status: 'standby', leader: 'Lt. Singh', zone: 'North Gate', specialty: 'Evacuation' },
  { id: 'T4', name: 'Delta Surveillance', members: 4, status: 'active', leader: 'Cpl. Reddy', zone: 'CCTV Hub', specialty: 'Surveillance' },
];

export default function TeamsScreen() {
  const [teams, setTeams] = useState(MOCK_TEAMS);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const getStatusColor = (s: string) => s === 'active' ? Colors.green : s === 'standby' ? Colors.orange : Colors.red;

  return (
    <ScrollView style={styles.container}>
      <SectionHeader
        icon={<Ionicons name="people" size={14} color={Colors.red} />}
        title="RESPONSE TEAMS"
        action={<NeuButton title="Create" size="sm" variant="primary" onPress={() => {}} icon={<Ionicons name="add" size={14} color="#fff" />} />}
      />

      <View style={styles.statsRow}>
        <GlassCard style={styles.statMini} padding={Spacing.md}>
          <Text style={styles.statMiniVal}>{teams.length}</Text>
          <Text style={styles.statMiniLabel}>Teams</Text>
        </GlassCard>
        <GlassCard style={styles.statMini} padding={Spacing.md}>
          <Text style={[styles.statMiniVal, { color: Colors.green }]}>{teams.filter(t => t.status === 'active').length}</Text>
          <Text style={styles.statMiniLabel}>Active</Text>
        </GlassCard>
        <GlassCard style={styles.statMini} padding={Spacing.md}>
          <Text style={[styles.statMiniVal, { color: Colors.beige }]}>{teams.reduce((a, t) => a + t.members, 0)}</Text>
          <Text style={styles.statMiniLabel}>Personnel</Text>
        </GlassCard>
      </View>

      {teams.map(team => (
        <TouchableOpacity key={team.id} onPress={() => setSelectedTeam(selectedTeam === team.id ? null : team.id)}>
          <GlassCard style={selectedTeam === team.id ? styles.teamCardActive : styles.teamCard} padding={Spacing.lg}>
            <View style={styles.teamHeader}>
              <View style={[styles.teamIconWrap, { backgroundColor: getStatusColor(team.status) + '20' }]}>
                <Ionicons name="shield-checkmark" size={20} color={getStatusColor(team.status)} />
              </View>
              <View style={styles.teamHeaderInfo}>
                <Text style={styles.teamName}>{team.name}</Text>
                <Text style={styles.teamSpecialty}>{team.specialty}</Text>
              </View>
              <View style={styles.teamStatusBadge}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(team.status) }]} />
                <Text style={[styles.teamStatus, { color: getStatusColor(team.status) }]}>{team.status.toUpperCase()}</Text>
              </View>
            </View>

            {selectedTeam === team.id && (
              <View style={styles.teamDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="person" size={14} color={Colors.beige} />
                  <Text style={styles.detailLabel}>Leader</Text>
                  <Text style={styles.detailValue}>{team.leader}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="people" size={14} color={Colors.beige} />
                  <Text style={styles.detailLabel}>Members</Text>
                  <Text style={styles.detailValue}>{team.members}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={14} color={Colors.beige} />
                  <Text style={styles.detailLabel}>Zone</Text>
                  <Text style={styles.detailValue}>{team.zone}</Text>
                </View>
                <View style={styles.teamActions}>
                  <NeuButton title="Assign" size="sm" variant="secondary" onPress={() => {}} />
                  <NeuButton title="Dispatch" size="sm" variant="primary" onPress={() => {}} />
                </View>
              </View>
            )}
          </GlassCard>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  statMini: { flex: 1, alignItems: 'center' },
  statMiniVal: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800' },
  statMiniLabel: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  teamCard: { marginBottom: Spacing.md },
  teamCardActive: { borderColor: Colors.red + '40' },
  teamHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  teamIconWrap: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  teamHeaderInfo: { flex: 1 },
  teamName: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  teamSpecialty: { color: Colors.textMuted, fontSize: FontSize.sm },
  teamStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  teamStatus: { fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 0.5 },
  teamDetails: { marginTop: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.glassBorder, paddingTop: Spacing.lg, gap: Spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  detailLabel: { color: Colors.textMuted, fontSize: FontSize.sm, width: 70 },
  detailValue: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '600', flex: 1 },
  teamActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
});
