import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert as RNAlert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/tokens';
import { api } from '../services/api';

export default function MissingScreen() {
  const [tab, setTab] = useState<'persons' | 'items'>('persons');
  const [showForm, setShowForm] = useState(false);
  const [persons, setPersons] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [pf, setPf] = useState({ name: '', age: '', gender: '', description: '', last_seen_zone: '', clothing: '', height: '', reporter_name: '', reporter_contact: '' });

  const load = () => {
    api.getMissingPersons().then(setPersons).catch(() => {});
    api.getMissingItems().then(setItems).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const submitPerson = async () => {
    if (!pf.name) return;
    await api.createMissingPerson({ ...pf, age: parseInt(pf.age) || 0 });
    setPf({ name: '', age: '', gender: '', description: '', last_seen_zone: '', clothing: '', height: '', reporter_name: '', reporter_contact: '' });
    setShowForm(false); load();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.header}>
        <Text style={styles.title}>Missing Reports</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.addBtnText}>New Report</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'persons' && styles.tabActive]} onPress={() => { setTab('persons'); setShowForm(false); }}>
          <Text style={[styles.tabText, tab === 'persons' && styles.tabTextActive]}>👤 Persons ({persons.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'items' && styles.tabActive]} onPress={() => { setTab('items'); setShowForm(false); }}>
          <Text style={[styles.tabText, tab === 'items' && styles.tabTextActive]}>📦 Items ({items.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>👤 Report Missing Person</Text>
          <TextInput style={styles.input} placeholder="Full name *" placeholderTextColor={colors.textMuted} value={pf.name} onChangeText={v => setPf({ ...pf, name: v })} />
          <TextInput style={styles.input} placeholder="Age" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={pf.age} onChangeText={v => setPf({ ...pf, age: v })} />
          <TextInput style={styles.input} placeholder="Height (e.g. 5'8)" placeholderTextColor={colors.textMuted} value={pf.height} onChangeText={v => setPf({ ...pf, height: v })} />
          <TextInput style={styles.input} placeholder="Clothing" placeholderTextColor={colors.textMuted} value={pf.clothing} onChangeText={v => setPf({ ...pf, clothing: v })} />
          <TextInput style={styles.input} placeholder="Description" placeholderTextColor={colors.textMuted} multiline value={pf.description} onChangeText={v => setPf({ ...pf, description: v })} />
          <TextInput style={styles.input} placeholder="Last seen zone (Z1-Z7) *" placeholderTextColor={colors.textMuted} value={pf.last_seen_zone} onChangeText={v => setPf({ ...pf, last_seen_zone: v })} />
          <TextInput style={styles.input} placeholder="Your name" placeholderTextColor={colors.textMuted} value={pf.reporter_name} onChangeText={v => setPf({ ...pf, reporter_name: v })} />
          <TextInput style={styles.input} placeholder="Contact (phone/email)" placeholderTextColor={colors.textMuted} value={pf.reporter_contact} onChangeText={v => setPf({ ...pf, reporter_contact: v })} />
          <TouchableOpacity style={styles.submitBtn} onPress={submitPerson}>
            <Text style={styles.submitBtnText}>Submit Report</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      <View style={styles.listCard}>
        {tab === 'persons' ? (
          persons.length === 0 ? (
            <View style={styles.empty}><Ionicons name="search-outline" size={36} color={colors.textMuted} /><Text style={styles.emptyText}>No missing person reports</Text></View>
          ) : persons.map((p: any) => (
            <View key={p.id} style={styles.listItem}>
              <Ionicons name="person" size={20} color={colors.red} />
              <View style={{ flex: 1 }}>
                <Text style={styles.listName}>{p.name}</Text>
                <Text style={styles.listSub}>{p.age ? `${p.age}y ` : ''}{p.gender || ''} · Zone: {p.last_seen_zone}</Text>
                {p.clothing && <Text style={styles.listSub}>Clothing: {p.clothing}</Text>}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: p.status === 'FOUND' ? colors.green + '20' : colors.red + '20' }]}>
                <Text style={[styles.statusText, { color: p.status === 'FOUND' ? colors.green : colors.red }]}>{p.status || 'MISSING'}</Text>
              </View>
            </View>
          ))
        ) : (
          items.length === 0 ? (
            <View style={styles.empty}><Ionicons name="search-outline" size={36} color={colors.textMuted} /><Text style={styles.emptyText}>No missing item reports</Text></View>
          ) : items.map((it: any) => (
            <View key={it.id} style={styles.listItem}>
              <Ionicons name="cube" size={20} color={colors.beige} />
              <View style={{ flex: 1 }}>
                <Text style={styles.listName}>{it.item_name}</Text>
                <Text style={styles.listSub}>{it.category || ''} · Zone: {it.last_seen_zone}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800' as const, color: colors.textBright },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.red, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.sm },
  addBtnText: { fontSize: 12, fontWeight: '600' as const, color: '#fff' },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glass },
  tabActive: { borderColor: colors.red, backgroundColor: colors.redGlow },
  tabText: { fontSize: 12, fontWeight: '600' as const, color: colors.textDim },
  tabTextActive: { color: colors.red },
  formCard: { backgroundColor: colors.glass, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.glassBorder, marginBottom: 16 },
  formTitle: { fontSize: 14, fontWeight: '700' as const, color: colors.textBright, marginBottom: 12 },
  input: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, padding: 12, fontSize: 13, color: colors.text, marginBottom: 8 },
  submitBtn: { backgroundColor: colors.red, borderRadius: radius.sm, padding: 12, alignItems: 'center', marginTop: 8 },
  submitBtnText: { fontSize: 13, fontWeight: '700' as const, color: '#fff' },
  listCard: { backgroundColor: colors.glass, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.glassBorder },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 13, color: colors.textMuted },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  listName: { fontSize: 13, fontWeight: '600' as const, color: colors.text },
  listSub: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusText: { fontSize: 9, fontWeight: '700' as const, textTransform: 'uppercase' as const },
});
