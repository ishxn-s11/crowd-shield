import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, NeuShadow } from '../theme/tokens';
import { GlassCard, NeuButton, SectionHeader } from '../components/UI';

export default function DeviceCameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [density, setDensity] = useState(0);

  useEffect(() => {
    // Simulate detection stats when streaming
    if (!isStreaming) return;
    const iv = setInterval(() => {
      setDetectionCount(Math.floor(Math.random() * 15) + 2);
      setFps(Math.floor(Math.random() * 10) + 20);
      setDensity(Math.random() * 0.8 + 0.1);
    }, 1000);
    return () => clearInterval(iv);
  }, [isStreaming]);

  return (
    <ScrollView style={styles.container}>
      <SectionHeader
        icon={<Ionicons name="phone-portrait" size={14} color={Colors.red} />}
        title="DEVICE CAMERA"
      />

      <GlassCard style={styles.previewCard} padding={0}>
        <View style={styles.preview}>
          <View style={styles.previewOverlay}>
            <View style={styles.previewTopBar}>
              <View style={styles.previewId}>
                <Ionicons name="phone-portrait" size={12} color={Colors.text} />
                <Text style={styles.previewIdText}>DEVICE CAM</Text>
              </View>
              {isStreaming && (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              )}
            </View>

            {!isStreaming ? (
              <View style={styles.previewPlaceholder}>
                <Ionicons name="camera-outline" size={48} color={Colors.textDim} />
                <Text style={styles.previewPlaceholderText}>Tap to start camera</Text>
                <Text style={styles.previewPlaceholderSub}>Uses your device camera for real-time crowd detection</Text>
              </View>
            ) : (
              <View style={styles.previewPlaceholder}>
                <Ionicons name="videocam" size={48} color={Colors.red} />
                <Text style={[styles.previewPlaceholderText, { color: Colors.red }]}>Camera Active</Text>
              </View>
            )}

            {isStreaming && (
              <View style={styles.statsOverlay}>
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeValue}>{detectionCount}</Text>
                  <Text style={styles.statBadgeLabel}>People</Text>
                </View>
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeValue}>{fps}</Text>
                  <Text style={styles.statBadgeLabel}>FPS</Text>
                </View>
                <View style={styles.statBadge}>
                  <Text style={[styles.statBadgeValue, { color: density > 0.5 ? Colors.red : Colors.green }]}>
                    {Math.round(density * 100)}%
                  </Text>
                  <Text style={styles.statBadgeLabel}>Density</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </GlassCard>

      <View style={styles.controls}>
        <NeuButton
          title={isStreaming ? 'Stop Camera' : 'Start Camera'}
          onPress={() => setIsStreaming(!isStreaming)}
          variant={isStreaming ? 'danger' : 'primary'}
          size="lg"
          icon={<Ionicons name={isStreaming ? 'stop-circle' : 'play-circle'} size={18} color="#fff" />}
          style={{ flex: 1 }}
        />
      </View>

      <GlassCard style={styles.infoCard}>
        <Text style={styles.infoTitle}>How It Works</Text>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={16} color={Colors.red} />
          <Text style={styles.infoText}>YOLOv8 person detection runs on-device</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="git-network" size={16} color={Colors.red} />
          <Text style={styles.infoText}>ByteTrack assigns unique IDs to each person</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="analytics" size={16} color={Colors.red} />
          <Text style={styles.infoText}>Real-time density & flow analysis</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="warning" size={16} color={Colors.red} />
          <Text style={styles.infoText}>Stampede risk prediction via LSTM model</Text>
        </View>
      </GlassCard>

      {isStreaming && (
        <GlassCard style={styles.detectionCard}>
          <Text style={styles.detectionTitle}>Detection Results</Text>
          <View style={styles.detectionGrid}>
            <View style={styles.detectionItem}>
              <Text style={styles.detectionValue}>{detectionCount}</Text>
              <Text style={styles.detectionLabel}>Tracked</Text>
            </View>
            <View style={styles.detectionItem}>
              <Text style={[styles.detectionValue, { color: density > 0.6 ? Colors.red : Colors.green }]}>
                {density > 0.6 ? 'HIGH' : density > 0.3 ? 'MODERATE' : 'LOW'}
              </Text>
              <Text style={styles.detectionLabel}>Risk</Text>
            </View>
            <View style={styles.detectionItem}>
              <Text style={styles.detectionValue}>{Math.floor(Math.random() * 3) + 1}</Text>
              <Text style={styles.detectionLabel}>Zones</Text>
            </View>
          </View>
        </GlassCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
  previewCard: { marginBottom: Spacing.md },
  preview: { height: 280, backgroundColor: Colors.surface },
  previewOverlay: { flex: 1, position: 'relative' },
  previewTopBar: { position: 'absolute', top: 8, left: 8, right: 8, flexDirection: 'row', justifyContent: 'space-between', zIndex: 2 },
  previewId: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  previewIdText: { color: Colors.text, fontSize: FontSize.xs, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 0.5 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.red, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 1 },
  previewPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  previewPlaceholderText: { color: Colors.textMuted, fontSize: FontSize.md, fontWeight: '600' },
  previewPlaceholderSub: { color: Colors.textDim, fontSize: FontSize.sm, textAlign: 'center', paddingHorizontal: 32 },
  statsOverlay: { position: 'absolute', bottom: 8, left: 8, right: 8, flexDirection: 'row', gap: 8, zIndex: 2 },
  statBadge: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: BorderRadius.sm, padding: 6, alignItems: 'center' },
  statBadgeValue: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '800' },
  statBadgeLabel: { color: Colors.textMuted, fontSize: FontSize.xs, textTransform: 'uppercase' },
  controls: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  infoCard: { marginBottom: Spacing.md },
  infoTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  infoText: { color: Colors.textMuted, fontSize: FontSize.sm, flex: 1 },
  detectionCard: { marginBottom: Spacing.md },
  detectionTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.md },
  detectionGrid: { flexDirection: 'row', gap: Spacing.md },
  detectionItem: { flex: 1, alignItems: 'center', backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.sm, padding: Spacing.md },
  detectionValue: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '800' },
  detectionLabel: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
});
