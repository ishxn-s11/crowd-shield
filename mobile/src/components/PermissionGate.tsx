import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, NeuShadow } from '../theme/tokens';
import { requestAllPermissions, checkPermissionStatus, requestPermission, type PermissionType } from '../services/permissions';

interface Props {
  children: React.ReactNode;
}

const PERMISSION_LIST: { type: PermissionType; icon: string; title: string; description: string }[] = [
  { type: 'camera', icon: 'camera', title: 'Camera Access', description: 'Real-time crowd detection from your device camera' },
  { type: 'notifications', icon: 'notifications', title: 'Notifications', description: 'Critical crowd safety alerts and emergency warnings' },
  { type: 'location', icon: 'location', title: 'Location Access', description: 'Nearby safe routes and venue navigation during emergencies' },
];

export default function PermissionGate({ children }: Props) {
  const [checking, setChecking] = useState(true);
  const [allGranted, setAllGranted] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, string>>({});
  const [showRationale, setShowRationale] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    checkAllPermissions();
  }, []);

  const checkAllPermissions = async () => {
    setChecking(true);
    const statuses: Record<string, string> = {};
    for (const p of PERMISSION_LIST) {
      statuses[p.type] = await checkPermissionStatus(p.type);
    }
    setPermissions(statuses);
    const allOk = PERMISSION_LIST.every(p => statuses[p.type] === 'granted');
    if (allOk) {
      setAllGranted(true);
    } else {
      setShowRationale(true);
    }
    setChecking(false);
  };

  const handleGrantAll = async () => {
    const results = await requestAllPermissions();
    await checkAllPermissions();
  };

  const handleGrantOne = async (type: PermissionType) => {
    const result = await requestPermission(type);
    setPermissions(prev => ({ ...prev, [type]: result.granted ? 'granted' : 'denied' }));
  };

  const handleSkip = () => {
    setAllGranted(true);
  };

  if (checking) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={Colors.red} />
          <Text style={styles.loadingText}>Checking permissions...</Text>
        </View>
      </View>
    );
  }

  if (allGranted) return <>{children}</>;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerIcon}>
          <Ionicons name="shield-checkmark" size={40} color={Colors.red} />
        </View>
        <Text style={styles.title}>Enable CrowdShield</Text>
        <Text style={styles.subtitle}>
          To keep you safe, CrowdShield needs access to the following:
        </Text>

        {PERMISSION_LIST.map((p) => {
          const status = permissions[p.type];
          const isGranted = status === 'granted';
          return (
            <View key={p.type} style={styles.permRow}>
              <View style={[styles.permIcon, { backgroundColor: isGranted ? Colors.green + '20' : Colors.redLight }]}>
                <Ionicons name={p.icon as any} size={20} color={isGranted ? Colors.green : Colors.red} />
              </View>
              <View style={styles.permInfo}>
                <Text style={styles.permTitle}>{p.title}</Text>
                <Text style={styles.permDesc}>{p.description}</Text>
              </View>
              <TouchableOpacity
                style={[styles.permBtn, isGranted && styles.permBtnGranted]}
                onPress={() => handleGrantOne(p.type)}
                disabled={isGranted}
              >
                <Text style={[styles.permBtnText, isGranted && styles.permBtnTextGranted]}>
                  {isGranted ? '✓ Granted' : 'Allow'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity style={styles.grantAllBtn} onPress={handleGrantAll}>
          <Ionicons name="shield-checkmark" size={18} color="#fff" />
          <Text style={styles.grantAllText}>Grant All Permissions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now (limited functionality)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  loadingCard: { backgroundColor: Colors.glass, borderRadius: BorderRadius.xl, padding: Spacing.xxxl, alignItems: 'center', borderWidth: 1, borderColor: Colors.glassBorder, gap: Spacing.lg },
  loadingText: { color: Colors.textMuted, fontSize: FontSize.md },
  card: { backgroundColor: Colors.glass, borderRadius: BorderRadius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.glassBorder, width: '100%', maxWidth: 400, ...NeuShadow.lg },
  headerIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.redLight, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: Spacing.lg, borderWidth: 2, borderColor: Colors.red + '40' },
  title: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800', textAlign: 'center', letterSpacing: 0.5 },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', marginTop: Spacing.xs, marginBottom: Spacing.xl, lineHeight: 20 },
  permRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md, borderWidth: 1, borderColor: Colors.glassBorder },
  permIcon: { width: 36, height: 36, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  permInfo: { flex: 1 },
  permTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  permDesc: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  permBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.red + '40', backgroundColor: Colors.redLight },
  permBtnGranted: { borderColor: Colors.green + '40', backgroundColor: Colors.greenLight },
  permBtnText: { color: Colors.red, fontSize: FontSize.xs, fontWeight: '700' },
  permBtnTextGranted: { color: Colors.green },
  grantAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.red, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, marginTop: Spacing.lg, ...NeuShadow.sm },
  grantAllText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700', letterSpacing: 0.3 },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.sm },
  skipText: { color: Colors.textDim, fontSize: FontSize.sm },
});
