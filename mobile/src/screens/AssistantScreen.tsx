import React, { useState, useRef } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/tokens';
import { api } from '../services/api';

interface Message { id: string; role: 'user' | 'assistant'; text: string; }

const QUICK_ACTIONS = [
  'What is the current risk status?',
  'Show me evacuation routes',
  'Generate incident summary',
  'Recommend interventions',
];

export default function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', text: 'Hello! I am the CrowdShield AI Assistant. Ask me about risk status, recommendations, evacuation routes, or situation summaries.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await api.chat(msg);
      const reply: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: res.response || res.message || 'I could not process that request. Please try again.' };
      setMessages(prev => [...prev, reply]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: 'Connection error. Please check that the API server is running.' }]);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="sparkles" size={18} color={colors.beige} />
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <View style={styles.statusDot} />
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          renderItem={({ item: m }) => (
            <View style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
              {m.role === 'assistant' && <Text style={styles.assistantLabel}>CROWDSHIELD AI</Text>}
              <Text style={m.role === 'user' ? styles.textUser : styles.textAssistant}>{m.text}</Text>
            </View>
          )}
          contentContainerStyle={{ padding: spacing.md, gap: 8 }}
        />

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((q, i) => (
              <TouchableOpacity key={i} style={styles.quickBtn} onPress={() => send(q)}>
                <Text style={styles.quickText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput style={styles.input} placeholder="Ask about risks, routes, incidents..." placeholderTextColor={colors.textMuted} value={input} onChangeText={setInput} onSubmitEditing={() => send()} />
          <TouchableOpacity style={styles.sendBtn} onPress={() => send()} disabled={loading || !input.trim()}>
            <Ionicons name="send" size={18} color={loading ? colors.textMuted : colors.beige} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  headerTitle: { fontSize: 16, fontWeight: '700' as const, color: colors.textBright, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  bubble: { maxWidth: '85%', borderRadius: radius.md, padding: spacing.md },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.red },
  bubbleAssistant: { alignSelf: 'flex-start', backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder },
  assistantLabel: { fontSize: 9, fontWeight: '700' as const, color: colors.beige, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 },
  textUser: { fontSize: 13, color: '#fff', lineHeight: 18 },
  textAssistant: { fontSize: 13, color: colors.text, lineHeight: 18 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: spacing.md },
  quickBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glass },
  quickText: { fontSize: 11, color: colors.textDim },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.glassBorder },
  input: { flex: 1, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: colors.text },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
});
