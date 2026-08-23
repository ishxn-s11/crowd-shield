import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme/tokens';

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: Colors.beige,
  CRITICAL: '#f0ad4e',
  EMERGENCY: Colors.red,
};

interface UrgentMessage {
  id: string;
  priority: string;
  message: string;
  senderName: string;
  createdAt: string;
  acknowledged: boolean;
}

export default function UrgentContactScreen() {
  const [priority, setPriority] = useState('URGENT');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [history, setHistory] = useState<UrgentMessage[]>([]);

  const sendUrgent = () => {
    if (!message.trim()) return;
    const newMsg: UrgentMessage = {
      id: Date.now().toString(),
      priority,
      message,
      senderName: 'Operator',
      createdAt: new Date().toISOString(),
      acknowledged: false,
    };
    setHistory(prev => [newMsg, ...prev]);
    setSent(true);
    setMessage('');
    setTimeout(() => setSent(false), 3000);
    Alert.alert('Message Sent', `Priority: ${priority}\nYour urgent message has been sent to the commander.`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📞</Text>
        <Text style={styles.title}>Urgent Contact — Commander</Text>
      </View>
      <Text style={styles.subtitle}>
        Send an urgent message directly to the commander in case of stampede, crowd surge, or emergency.
      </Text>

      {/* Priority Selector */}
      <View style={styles.priorityRow}>
        {(['URGENT', 'CRITICAL', 'EMERGENCY'] as const).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.priorityBtn, priority === p && { borderColor: PRIORITY_COLORS[p], backgroundColor: PRIORITY_COLORS[p] + '20' }]}
            onPress={() => setPriority(p)}
          >
            <Text style={[styles.priorityText, priority === p && { color: PRIORITY_COLORS[p] }]}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Message Input */}
      <TextInput
        style={[styles.input, { borderColor: PRIORITY_COLORS[priority] + '60' }]}
        multiline
        numberOfLines={5}
        placeholder="Describe the urgency..."
        placeholderTextColor={Colors.textDim}
        value={message}
        onChangeText={setMessage}
      />

      {/* Send Button */}
      <TouchableOpacity
        style={[styles.sendBtn, { backgroundColor: sent ? Colors.green : PRIORITY_COLORS[priority] }, !message.trim() && { opacity: 0.5 }]}
        onPress={sendUrgent}
        disabled={!message.trim()}
      >
        <Text style={styles.sendBtnText}>
          {sent ? '✓ Message Sent!' : `📞 Contact Commander (${priority})`}
        </Text>
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ℹ️ Messages are sent to the commander's dashboard and trigger a push notification. In EMERGENCY mode, all response teams are also notified.
        </Text>
      </View>

      {/* History */}
      <Text style={styles.sectionTitle}>Contact History</Text>
      {history.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No urgent contacts yet</Text>
        </View>
      ) : history.map(msg => (
        <View key={msg.id} style={[styles.historyItem, { borderLeftColor: PRIORITY_COLORS[msg.priority] || Colors.red }]}>
          <View style={styles.historyHeader}>
            <View style={[styles.priorityBadge, { backgroundColor: (PRIORITY_COLORS[msg.priority] || Colors.red) + '20' }]}>
              <Text style={[styles.priorityBadgeText, { color: PRIORITY_COLORS[msg.priority] || Colors.red }]}>
                {msg.priority}
              </Text>
            </View>
            <Text style={styles.historyTime}>
              {new Date(msg.createdAt).toLocaleTimeString()}
            </Text>
          </View>
          <Text style={styles.historyMessage}>{msg.message}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  headerIcon: { fontSize: 20, marginRight: 8 },
  title: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textMuted, marginBottom: 16, lineHeight: 18 },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  priorityBtn: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.sm, borderWidth: 2, borderColor: Colors.glassBorder, alignItems: 'center' },
  priorityText: { fontSize: 12, fontWeight: '700', color: Colors.textDim },
  input: { borderWidth: 1, borderRadius: BorderRadius.sm, padding: 12, minHeight: 100, backgroundColor: 'rgba(0,0,0,0.4)', color: Colors.text, fontSize: 13, textAlignVertical: 'top', marginBottom: 12 },
  sendBtn: { paddingVertical: 14, borderRadius: BorderRadius.sm, alignItems: 'center', marginBottom: 12 },
  sendBtnText: { color: 'white', fontSize: 14, fontWeight: '700' },
  infoBox: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 10, marginBottom: 20 },
  infoText: { fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: 12 },
  historyItem: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: 12, borderLeftWidth: 3, marginBottom: 8 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  priorityBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  priorityBadgeText: { fontSize: 10, fontWeight: '700' },
  historyTime: { fontSize: 10, color: Colors.textMuted },
  historyMessage: { fontSize: 12, color: Colors.text, lineHeight: 18 },
});
