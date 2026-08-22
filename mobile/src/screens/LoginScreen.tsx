import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, NeuShadow } from '../theme/tokens';
import { GlassCard, NeuButton, SectionHeader } from '../components/UI';

type Props = { onLogin: (role: 'OPERATOR' | 'COMMANDER') => void };

export default function LoginScreen({ onLogin }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'OPERATOR' | 'COMMANDER'>('OPERATOR');

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Ionicons name="shield-checkmark" size={48} color={Colors.red} />
          </View>
          <Text style={styles.title}>CROWDSHIELD</Text>
          <Text style={styles.subtitle}>AI-Powered Crowd Safety Platform</Text>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setIsRegister(false)} style={[styles.tab, !isRegister && styles.tabActive]}>
            <Text style={[styles.tabText, !isRegister && styles.tabTextActive]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsRegister(true)} style={[styles.tab, isRegister && styles.tabActive]}>
            <Text style={[styles.tabText, isRegister && styles.tabTextActive]}>Create Account</Text>
          </TouchableOpacity>
        </View>

        <GlassCard style={styles.formCard}>
          {isRegister && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor={Colors.textDim} value={name} onChangeText={setName} />
            </>
          )}
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={Colors.textDim} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={Colors.textDim} value={password} onChangeText={setPassword} secureTextEntry />

          {isRegister && (
            <>
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleRow}>
                {(['OPERATOR', 'COMMANDER'] as const).map(r => (
                  <TouchableOpacity key={r} onPress={() => setRole(r)} style={[styles.roleBtn, role === r && styles.roleBtnActive]}>
                    <Ionicons name={r === 'OPERATOR' ? 'eye' : 'shield-checkmark'} size={16} color={role === r ? Colors.red : Colors.textMuted} />
                    <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <NeuButton
            title={isRegister ? 'Create Account' : 'Sign In'}
            onPress={() => onLogin(role)}
            variant="primary"
            size="lg"
            style={{ marginTop: Spacing.lg }}
          />
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, backgroundColor: Colors.bg, padding: Spacing.xl, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: Spacing.xxxl },
  logoWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.redLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg, borderWidth: 2, borderColor: Colors.red + '40' },
  title: { color: Colors.text, fontSize: FontSize.xxxl, fontWeight: '900', letterSpacing: 3 },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.xs },
  tabs: { flexDirection: 'row', marginBottom: Spacing.xl, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.glassBorder },
  tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', backgroundColor: Colors.glass },
  tabActive: { backgroundColor: Colors.red + '20', borderBottomColor: Colors.red },
  tabText: { color: Colors.textMuted, fontWeight: '600', fontSize: FontSize.md },
  tabTextActive: { color: Colors.red },
  formCard: { marginBottom: Spacing.lg },
  label: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.xs, fontWeight: '600' },
  input: { backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.glassBorder, padding: Spacing.md, color: Colors.text, fontSize: FontSize.md, marginBottom: Spacing.md },
  roleRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.glassBorder, padding: Spacing.md },
  roleBtnActive: { backgroundColor: Colors.red + '15', borderColor: Colors.red + '40' },
  roleText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  roleTextActive: { color: Colors.red },
});
