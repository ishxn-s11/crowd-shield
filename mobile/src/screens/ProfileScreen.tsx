import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/tokens';

const user = { name: 'Dev User', username: 'commander', email: 'dev@crowdshield.io', role: 'COMMANDER', status: 'Active' };

export default function ProfileScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.title}>My Profile</Text>
      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={colors.red} />
          </View>
          <View>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.handle}>@{user.username}</Text>
          </View>
        </View>
        <View style={styles.infoGrid}>
          {[
            { label: 'EMAIL', value: user.email },
            { label: 'ROLE', value: user.role },
            { label: 'STATUS', value: user.status },
          ].map((f, i) => (
            <View key={i} style={styles.infoCard}>
              <Text style={styles.infoLabel}>{f.label}</Text>
              <Text style={styles.infoValue}>{f.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Settings */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Settings</Text>
        {[
          { icon: 'notifications' as const, label: 'Notifications', color: colors.red },
          { icon: 'language' as const, label: 'Language', color: colors.beige },
          { icon: 'moon' as const, label: 'Dark Mode', color: colors.beige, sub: 'Enabled' },
          { icon: 'shield-checkmark' as const, label: 'Privacy', color: colors.green },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={styles.settingItem}>
            <View style={[styles.settingIcon, { backgroundColor: item.color + '15' }]}> 
              <Ionicons name={item.icon} size={18} color={item.color} />
            </View>
            <Text style={styles.settingLabel}>{item.label}</Text>
            {item.sub && <Text style={styles.settingSub}>{item.sub}</Text>}
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}>
        <Ionicons name="log-out" size={16} color={colors.critical} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 20, fontWeight: '800' as const, color: colors.textBright, marginBottom: 16 },
  card: { backgroundColor: colors.glass, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.glassBorder, marginBottom: 16 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.redGlow, borderWidth: 1, borderColor: colors.redDim, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: '700' as const, color: colors.textBright },
  handle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoCard: { width: '48%', backgroundColor: colors.inputBg, borderRadius: radius.sm, padding: spacing.md },
  infoLabel: { fontSize: 9, color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1 },
  infoValue: { fontSize: 14, fontWeight: '600' as const, color: colors.text, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700' as const, color: colors.textBright, marginBottom: 12 },
  settingItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  settingIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 13, color: colors.text, flex: 1 },
  settingSub: { fontSize: 11, color: colors.textMuted },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.redDim, marginTop: 8 },
  logoutText: { fontSize: 13, fontWeight: '700' as const, color: colors.critical },
});
