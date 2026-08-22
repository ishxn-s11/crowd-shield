/**
 * CrowdShield Citizen Mobile App
 * 
 * Features:
 * - Home screen with safety status
 * - Live alerts and warnings
 * - Safe route guidance
 * - Incident reporting
 * - Multilingual support
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Alert, TextInput, FlatList, Dimensions, Platform,
} from 'react-native';

const API_URL = 'http://localhost:8000';

// ─── Localization ─────────────────────────────────────────────

const translations: Record<string, Record<string, string>> = {
  en: {
    appTitle: 'CrowdShield',
    subtitle: 'Your Safety Companion',
    home: 'Home',
    alerts: 'Alerts',
    routes: 'Routes',
    report: 'Report',
    settings: 'Settings',
    safe: 'SAFE',
    caution: 'CAUTION',
    warning: 'WARNING',
    danger: 'DANGER',
    currentStatus: 'Current Status',
    overallRisk: 'Overall Risk',
    activeAlerts: 'Active Alerts',
    nearbyZones: 'Nearby Zones',
    evacuationRoute: 'Evacuation Route',
    reportIncident: 'Report Incident',
    incidentTypes: 'Crowd Surge, Blocked Route, Medical Emergency, Lost Person, Fire, Suspicious Activity',
    submit: 'Submit Report',
    cancel: 'Cancel',
    description: 'Description',
    emergency: 'EMERGENCY',
    safeRoute: 'Safe Route',
    noAlerts: 'No active alerts - all clear!',
    selectLanguage: 'Language',
    english: 'English',
    hindi: 'Hindi',
    tamil: 'Tamil',
  },
  hi: {
    appTitle: 'CrowdShield',
    subtitle: 'आपकी सुरक्षा साथी',
    home: 'होम',
    alerts: 'अलर्ट',
    routes: 'मार्ग',
    report: 'रिपोर्ट',
    settings: 'सेटिंग्स',
    safe: 'सुरक्षित',
    caution: 'सावधान',
    warning: 'चेतावनी',
    danger: 'खतरा',
    currentStatus: 'वर्तमान स्थिति',
    overallRisk: 'समग्र जोखिम',
    activeAlerts: 'सक्रिय अलर्ट',
    nearbyZones: 'आस-पास के क्षेत्र',
    evacuationRoute: 'निकासी मार्ग',
    reportIncident: 'घटना की रिपोर्ट',
    submit: 'रिपोर्ट सबमिट करें',
    cancel: 'रद्द करें',
    description: 'विवरण',
    emergency: 'आपातकाल',
    safeRoute: 'सुरक्षित मार्ग',
    noAlerts: 'कोई सक्रिय अलर्ट नहीं - सब साफ!',
    selectLanguage: 'भाषा',
    english: 'अंग्रेजी',
    hindi: 'हिंदी',
    tamil: 'तमिल',
  },
  ta: {
    appTitle: 'CrowdShield',
    subtitle: 'உங்கள் பாதுகாப்பு துணை',
    home: 'முகப்பு',
    alerts: 'எச்சரிக்கை',
    routes: 'வழிகள்',
    report: 'புகார்',
    settings: 'அமைப்புகள்',
    safe: 'பாதுகாப்பு',
    caution: 'எச்சரிக்கை',
    warning: 'எச்சரிக்கை',
    danger: 'ஆபத்து',
    currentStatus: 'தற்போதைய நிலை',
    overallRisk: 'ஒட்டுமொத்த ஆபத்து',
    activeAlerts: 'செயலில் உள்ள எச்சரிக்கைகள்',
    nearbyZones: 'அருகிலுள்ள பகுதிகள்',
    evacuationRoute: 'வெளியேற்ற வழி',
    reportIncident: 'சம்பவத்தைப் புகாரளி',
    submit: 'சமர்ப்பி',
    cancel: 'ரத்துசெய்',
    description: 'விளக்கம்',
    emergency: 'அவசரம்',
    safeRoute: 'பாதுகாப்பான வழி',
    noAlerts: 'செயலில் எச்சரிக்கை இல்லை!',
    selectLanguage: 'மொழி',
    english: 'ஆங்கிலம்',
    hindi: 'இந்தி',
    tamil: 'தமிழ்',
  },
};

// ─── API Layer ────────────────────────────────────────────────

async function fetchAPI(path: string) {
  try {
    const res = await fetch(`${API_URL}${path}`);
    return await res.json();
  } catch {
    return null;
  }
}

// ─── Risk Badge Component ─────────────────────────────────────

function RiskBadge({ level, size = 'large' }: { level: string; size?: string }) {
  const colors: Record<string, string> = {
    LOW: '#22c55e', MODERATE: '#eab308', HIGH: '#f97316', CRITICAL: '#ef4444',
  };
  const s = size === 'large' ? 48 : 24;
  const fs = size === 'large' ? 14 : 10;
  const bg = colors[level] || '#6b7280';
  return (
    <View style={{
      width: s, height: s, borderRadius: s / 2, backgroundColor: bg,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: 'white', fontWeight: '800', fontSize: fs }}>{level?.charAt(0)}</Text>
    </View>
  );
}

// ─── Home Screen ──────────────────────────────────────────────

function HomeScreen({ lang, riskData, alerts }: { lang: string; riskData: any; alerts: any[] }) {
  const t = translations[lang] || translations.en;
  const riskLevel = riskData?.overall_risk_level || 'LOW';
  const riskScore = riskData?.overall_risk || 0;
  const statusColors: Record<string, string> = {
    LOW: '#22c55e', MODERATE: '#eab308', HIGH: '#f97316', CRITICAL: '#ef4444',
  };
  const statusBg = statusColors[riskLevel] || '#22c55e';

  return (
    <ScrollView style={styles.container}>
      {/* Safety Status Card */}
      <View style={[styles.card, { borderLeftColor: statusBg, borderLeftWidth: 4 }]}>
        <Text style={styles.cardTitle}>{t.currentStatus}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40, backgroundColor: statusBg + '20',
            alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: statusBg,
          }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: statusBg }}>{Math.round(riskScore)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: statusBg }}>
              {riskLevel === 'LOW' ? t.safe : riskLevel === 'MODERATE' ? t.caution : riskLevel === 'HIGH' ? t.warning : t.danger}
            </Text>
            <Text style={{ color: '#9ca3af', marginTop: 4 }}>
              {t.overallRisk}: {Math.round(riskScore)}/100
            </Text>
          </View>
        </View>
      </View>

      {/* Active Alerts */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.activeAlerts}</Text>
        {alerts.length === 0 ? (
          <Text style={{ color: '#6b7280', marginTop: 8 }}>{t.noAlerts}</Text>
        ) : (
          alerts.slice(0, 3).map((alert, i) => (
            <View key={i} style={[styles.alertItem, {
              borderLeftColor: alert.severity === 'CRITICAL' ? '#ef4444' : '#f97316',
            }]}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: alert.severity === 'CRITICAL' ? '#ef4444' : '#f97316' }}>
                {alert.severity}
              </Text>
              <Text style={{ fontSize: 13, marginTop: 2 }}>{alert.title}</Text>
              <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{alert.message}</Text>
            </View>
          ))
        )}
      </View>

      {/* Nearby Zones */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.nearbyZones}</Text>
        {riskData?.zones && Object.entries(riskData.zones).slice(0, 4).map(([zid, z]: [string, any]) => (
          <View key={zid} style={styles.zoneItem}>
            <RiskBadge level={z.risk_level} size="small" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: '600' }}>{z.zone_id}</Text>
              <Text style={{ fontSize: 11, color: '#9ca3af' }}>
                Risk: {Math.round(z.risk_score)} | {z.risk_level}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Emergency Button */}
      <TouchableOpacity style={[styles.emergencyBtn]} onPress={() => {
        Alert.alert('EMERGENCY', 'Connect to emergency services?', [
          { text: t.cancel, style: 'cancel' },
          { text: 'Call 112', style: 'destructive' },
        ]);
      }}>
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>{t.emergency}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Alerts Screen ────────────────────────────────────────────

function AlertsScreen({ lang, alerts }: { lang: string; alerts: any[] }) {
  const t = translations[lang] || translations.en;
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>{t.activeAlerts}</Text>
      {alerts.length === 0 ? (
        <View style={styles.card}>
          <Text style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>{t.noAlerts}</Text>
        </View>
      ) : (
        alerts.map((alert, i) => (
          <View key={i} style={[styles.card, { borderLeftColor: alert.severity === 'CRITICAL' ? '#ef4444' : '#f97316', borderLeftWidth: 3 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: alert.severity === 'CRITICAL' ? '#ef4444' : '#f97316' }}>
                {alert.severity}
              </Text>
              <Text style={{ fontSize: 10, color: '#6b7280' }}>{alert.alert_type}</Text>
            </View>
            <Text style={{ fontSize: 14, fontWeight: '600', marginTop: 6 }}>{alert.title}</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{alert.message}</Text>
            {alert.zone_id && (
              <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>Zone: {alert.zone_id}</Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ─── Routes Screen ────────────────────────────────────────────

function RoutesScreen({ lang }: { lang: string }) {
  const t = translations[lang] || translations.en;
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>{t.safeRoute}</Text>
      <View style={styles.card}>
        <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 12 }}>{t.evacuationRoute}</Text>
        {['Zone A - Main Entrance', 'Corridor B - Central', 'Zone E - Emergency Exit'].map((step, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 28, height: 28, borderRadius: 14, backgroundColor: '#22c55e',
              alignItems: 'center', justifyContent: 'center', marginRight: 12,
            }}>
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 12 }}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13 }}>{step}</Text>
              {i < 2 && <Text style={{ color: '#6b7280', fontSize: 10 }}>↓ ~50m</Text>}
            </View>
          </View>
        ))}
      </View>
      <View style={[styles.card, { backgroundColor: '#22c55e10' }]}>
        <Text style={{ color: '#22c55e', fontWeight: '600', fontSize: 13 }}>
          ✓ Recommended exit: Exit B (lowest risk)
        </Text>
        <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 4 }}>
          Estimated time: 3-5 minutes walking
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Report Screen ────────────────────────────────────────────

function ReportScreen({ lang }: { lang: string }) {
  const t = translations[lang] || translations.en;
  const types = ['Crowd Surge', 'Blocked Route', 'Medical Emergency', 'Lost Person', 'Fire', 'Suspicious Activity'];
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>{t.reportIncident}</Text>
      <View style={styles.card}>
        <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 8, color: '#9ca3af' }}>TYPE</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {types.map(type => (
            <TouchableOpacity key={type} style={[styles.typeChip, selectedType === type && styles.typeChipActive]}
              onPress={() => setSelectedType(type)}>
              <Text style={{ fontSize: 12, color: selectedType === type ? 'white' : '#e5e7eb' }}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontSize: 12, fontWeight: '600', marginTop: 16, marginBottom: 8, color: '#9ca3af' }}>
          {t.description.toUpperCase()}
        </Text>
        <TextInput style={styles.textInput} placeholder="Describe what you observed..." placeholderTextColor="#6b7280"
          multiline numberOfLines={4} value={description} onChangeText={setDescription} />

        <TouchableOpacity style={styles.submitBtn} onPress={() => {
          if (!selectedType) { Alert.alert('Error', 'Please select incident type'); return; }
          Alert.alert('Report Submitted', 'Thank you for keeping the community safe.', [{ text: 'OK' }]);
          setSelectedType(''); setDescription('');
        }}>
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>{t.submit}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Settings Screen ──────────────────────────────────────────

function SettingsScreen({ lang, setLang }: { lang: string; setLang: (l: string) => void }) {
  const t = translations[lang] || translations.en;
  const languages = [
    { key: 'en', label: t.english },
    { key: 'hi', label: t.hindi },
    { key: 'ta', label: t.tamil },
  ];
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>{t.settings}</Text>
      <View style={styles.card}>
        <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 12, color: '#9ca3af' }}>
          {t.selectLanguage.toUpperCase()}
        </Text>
        {languages.map(l => (
          <TouchableOpacity key={l.key} style={[styles.langItem, lang === l.key && { backgroundColor: '#3b82f620', borderColor: '#3b82f6' }]}
            onPress={() => setLang(l.key)}>
            <Text style={{ fontSize: 14, color: lang === l.key ? '#3b82f6' : '#e5e7eb' }}>{l.label}</Text>
            {lang === l.key && <Text style={{ color: '#3b82f6' }}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={{ fontSize: 12, color: '#6b7280' }}>CrowdShield v1.0.0</Text>
        <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>AI-Powered Crowd Safety</Text>
      </View>
    </ScrollView>
  );
}

// ─── Main App ─────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState('home');
  const [lang, setLang] = useState('en');
  const [riskData, setRiskData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    const risk = await fetchAPI('/api/risk/live');
    if (risk) setRiskData(risk);
    const al = await fetchAPI('/api/alerts?limit=20');
    if (al) setAlerts(al);
  }, []);

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 5000); return () => clearInterval(interval); }, [fetchData]);

  const t = translations[lang] || translations.en;

  const tabs = [
    { key: 'home', label: t.home, icon: '🏠' },
    { key: 'alerts', label: t.alerts, icon: '🔔' },
    { key: 'routes', label: t.routes, icon: '🧭' },
    { key: 'report', label: t.report, icon: '📝' },
    { key: 'settings', label: t.settings, icon: '⚙️' },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.appTitle}</Text>
        <Text style={styles.headerSub}>{t.subtitle}</Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {screen === 'home' && <HomeScreen lang={lang} riskData={riskData} alerts={alerts} />}
        {screen === 'alerts' && <AlertsScreen lang={lang} alerts={alerts} />}
        {screen === 'routes' && <RoutesScreen lang={lang} />}
        {screen === 'report' && <ReportScreen lang={lang} />}
        {screen === 'settings' && <SettingsScreen lang={lang} setLang={setLang} />}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity key={tab.key} style={[styles.tab, screen === tab.key && styles.tabActive]}
            onPress={() => setScreen(tab.key)}>
            <Text style={{ fontSize: 18 }}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, screen === tab.key && { color: '#3b82f6' }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0e17' },
  header: {
    backgroundColor: '#111827', paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#374151',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#e5e7eb', letterSpacing: 0.5 },
  headerSub: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  container: { flex: 1, padding: 12 },
  card: {
    backgroundColor: '#111827', borderRadius: 10, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#1f2937',
  },
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  alertItem: {
    padding: 10, marginTop: 8, borderRadius: 6, backgroundColor: '#1f2937',
    borderLeftWidth: 3,
  },
  zoneItem: {
    flexDirection: 'row', alignItems: 'center', padding: 8, marginTop: 6,
    borderRadius: 6, backgroundColor: '#1f2937',
  },
  emergencyBtn: {
    backgroundColor: '#ef4444', borderRadius: 10, padding: 16, alignItems: 'center',
    marginTop: 8, marginBottom: 20,
  },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#111827', borderTopWidth: 1,
    borderTopColor: '#1f2937', paddingBottom: Platform.OS === 'ios' ? 20 : 8, paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  tabActive: { opacity: 1 },
  tabLabel: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  pageTitle: { fontSize: 18, fontWeight: '700', color: '#e5e7eb', marginBottom: 12 },
  typeChip: {
    padding: 8, borderRadius: 6, backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151',
  },
  typeChipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  textInput: {
    backgroundColor: '#1f2937', borderRadius: 8, padding: 12, color: '#e5e7eb',
    borderWidth: 1, borderColor: '#374151', minHeight: 100, textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#3b82f6', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 16,
  },
  langItem: {
    flexDirection: 'row', justifyContent: 'space-between', padding: 12,
    borderRadius: 8, borderWidth: 1, borderColor: '#374151', marginBottom: 8,
  },
});
