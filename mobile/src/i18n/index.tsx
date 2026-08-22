import { useState, useCallback, createContext, useContext } from 'react';
import { I18nManager } from 'react-native';

// ─── Translation type ──────────────────────────────────────────
export type Locale = 'en' | 'hi' | 'es';

// ─── English (base) ────────────────────────────────────────────
const en = {
  appName: 'CROWDSHIELD',
  appTagline: 'AI-Powered Crowd Safety',
  loading: 'Loading...',
  error: 'Error',
  save: 'Save',
  cancel: 'Cancel',
  submit: 'Submit',
  back: 'Back',
  search: 'Search',
  viewAll: 'View all →',

  // Nav
  nav: {
    dashboard: 'Dashboard',
    zones: 'Zones',
    cameras: 'Cameras',
    deviceCamera: 'Device Cam',
    alerts: 'Alerts',
    missing: 'Missing',
    incidents: 'Incidents',
    assistant: 'Assistant',
    teams: 'Teams',
    profile: 'Profile',
  },

  // Auth
  auth: {
    signIn: 'Sign In',
    signUp: 'Create Account',
    email: 'Email',
    password: 'Password',
    fullName: 'Full Name',
    role: 'Role',
    signOut: 'Sign Out',
  },

  // Dashboard
  dashboard: {
    overallRisk: 'OVERALL RISK SCORE',
    zoneRiskLevels: 'ZONE RISK LEVELS',
    activeAlerts: 'ACTIVE ALERTS',
    statusOverview: 'STATUS OVERVIEW',
    noActiveAlerts: 'No active alerts',
    zones: 'Zones',
    alerts: 'Alerts',
    crowd: 'Crowd',
    risk: 'Risk',
  },

  // Risk
  risk: {
    LOW: 'LOW',
    MODERATE: 'MODERATE',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },

  // Zone
  zone: {
    riskScore: 'Risk Score',
    people: 'People',
    density: 'Density',
    velocity: 'Velocity',
    flowConflict: 'Flow Conflict',
    bottleneck: 'Bottleneck',
    digitalTwin: 'VENUE DIGITAL TWIN',
    live: 'LIVE',
    allZones: 'ALL ZONES',
  },

  // Cameras
  cameras: {
    title: 'CCTV CAMERAS',
    online: 'Online',
    offline: 'Offline',
    total: 'Total',
    live: 'LIVE',
  },

  // Device Camera
  deviceCamera: {
    title: 'DEVICE CAMERA',
    startCamera: 'Start Camera',
    stopCamera: 'Stop Camera',
    cameraActive: 'Camera Active',
    tapToStart: 'Tap to start camera',
    howItWorks: 'How It Works',
    detectionResults: 'Detection Results',
    tracked: 'Tracked',
    zones: 'Zones',
    risk: 'Risk',
  },

  // Alerts
  alerts: {
    title: 'Alert Center',
    allClear: '✓ All Clear',
    noActiveAlerts: 'No active alerts',
    dismiss: 'Dismiss',
  },

  // Missing
  missing: {
    title: 'Missing Reports',
    newReport: 'New Report',
    persons: 'Persons',
    items: 'Items',
    reportPerson: 'Report Missing Person',
    name: 'Full name *',
    age: 'Age',
    height: 'Height',
    clothing: 'Clothing',
    description: 'Description',
    lastSeenZone: 'Last seen zone',
    reporterName: 'Your name',
    reporterContact: 'Contact',
    submitReport: 'Submit Report',
    noPersons: 'No missing person reports',
    noItems: 'No missing item reports',
    missing: 'MISSING',
    found: 'FOUND',
  },

  // Incidents
  incidents: {
    title: 'INCIDENTS',
    all: 'ALL',
    active: 'ACTIVE',
    responding: 'RESPONDING',
    investigating: 'INVESTIGATING',
    resolved: 'RESOLVED',
  },

  // Assistant
  assistant: {
    title: 'AI Assistant',
    placeholder: 'Ask about risks, routes, incidents...',
    greeting: 'Hello! I am the CrowdShield AI Assistant. Ask me about risk status, recommendations, evacuation routes, or situation summaries.',
    crowhdShieldAi: 'CROWDSHIELD AI',
    connectionError: 'Connection error. Check that the API server is running.',
  },

  // Teams
  teams: {
    title: 'RESPONSE TEAMS',
    create: 'Create',
    teams: 'Teams',
    active: 'Active',
    personnel: 'Personnel',
    leader: 'Leader',
    members: 'Members',
    zone: 'Zone',
    specialty: 'Specialty',
    assign: 'Assign',
    dispatch: 'Dispatch',
  },

  // Profile
  profile: {
    title: 'My Profile',
    email: 'EMAIL',
    role: 'ROLE',
    status: 'STATUS',
    settings: 'Settings',
    notifications: 'Notifications',
    language: 'Language',
    darkMode: 'Dark Mode',
    privacy: 'Privacy',
    enabled: 'Enabled',
    signOut: 'Sign Out',
  },

  // Permissions
  permissions: {
    title: 'Enable CrowdShield',
    subtitle: 'To keep you safe, CrowdShield needs access to:',
    camera: 'Camera Access',
    cameraDesc: 'Real-time crowd detection',
    notifications: 'Notifications',
    notificationsDesc: 'Critical safety alerts',
    location: 'Location Access',
    locationDesc: 'Emergency navigation',
    grantAll: 'Grant All Permissions',
    skip: 'Skip for now',
    granted: '✓ Granted',
    allow: 'Allow',
  },

  // Language
  language: {
    en: 'English',
    hi: 'हिन्दी',
    es: 'Español',
    select: 'Language',
  },
} as const;

// ─── Hindi ──────────────────────────────────────────────────────
const hi: Record<string, any> = {
  ...en,
  appName: 'क्राउडशील्ड',
  appTagline: 'AI-संचालित भीड़ सुरक्षा',
  loading: 'लोड हो रहा है...',
  error: 'त्रुटि',
  save: 'सहेजें',
  cancel: 'रद्द करें',
  submit: 'जमा करें',
  back: 'वापस',
  search: 'खोजें',
  viewAll: 'सभी देखें →',
  nav: { dashboard: 'डैशबोर्ड', zones: 'ज़ोन', cameras: 'कैमरे', deviceCamera: 'डिवाइस कैमरा', alerts: 'अलर्ट', missing: 'लापता', incidents: 'घटनाएं', assistant: 'AI सहायक', teams: 'टीम', profile: 'प्रोफ़ाइल' },
  auth: { signIn: 'साइन इन', signUp: 'खाता बनाएं', email: 'ईमेल', password: 'पासवर्ड', fullName: 'पूरा नाम', role: 'भूमिका', signOut: 'साइन आउट' },
  dashboard: { overallRisk: 'कुल जोखिम स्कोर', zoneRiskLevels: 'ज़ोन जोखिम स्तर', activeAlerts: 'सक्रिय अलर्ट', statusOverview: 'स्थिति अवलोकन', noActiveAlerts: 'कोई सक्रिय अलर्ट नहीं', zones: 'ज़ोन', alerts: 'अलर्ट', crowd: 'भीड़', risk: 'जोखिम' },
  risk: { LOW: 'कम', MODERATE: 'मध्यम', HIGH: 'उच्च', CRITICAL: 'गंभीर' },
  zone: { riskScore: 'जोखिम स्कोर', people: 'लोग', density: 'घनत्व', velocity: 'गति', flowConflict: 'प्रवाह संघर्ष', bottleneck: 'बोतलनेक', digitalTwin: 'वेन्यू डिजिटल ट्विन', live: 'लाइव', allZones: 'सभी ज़ोन' },
  cameras: { title: 'सीसीटीवी कैमरे', online: 'ऑनलाइन', offline: 'ऑफ़लाइन', total: 'कुल', live: 'लाइव' },
  deviceCamera: { title: 'डिवाइस कैमरा', startCamera: 'कैमरा शुरू करें', stopCamera: 'कैमरा बंद करें', cameraActive: 'कैमरा सक्रिय', tapToStart: 'कैमरा शुरू करने के लिए टैप करें', howItWorks: 'यह कैसे काम करता है', detectionResults: 'पहचान परिणाम', tracked: 'ट्रैक किया', zones: 'ज़ोन', risk: 'जोखिम' },
  alerts: { title: 'अलर्ट केंद्र', allClear: '✓ सभी स्पष्ट', noActiveAlerts: 'कोई सक्रिय अलर्ट नहीं', dismiss: 'खारिज करें' },
  missing: { title: 'लापता रिपोर्ट', newReport: 'नई रिपोर्ट', persons: 'व्यक्ति', items: 'सामान', reportPerson: 'लापता व्यक्ति की रिपोर्ट', name: 'पूरा नाम *', age: 'आयु', height: 'ऊंचाई', clothing: 'कपड़े', description: 'विवरण', lastSeenZone: 'अंतिम बार देखा गया ज़ोन', reporterName: 'आपका नाम', reporterContact: 'संपर्क', submitReport: 'रिपोर्ट जमा करें', noPersons: 'कोई लापता व्यक्ति रिपोर्ट नहीं', noItems: 'कोई लापता सामान रिपोर्ट नहीं', missing: 'लापता', found: 'मिला' },
  incidents: { title: 'घटनाएं', all: 'सभी', active: 'सक्रिय', responding: 'प्रतिक्रिया', investigating: 'जांच', resolved: 'हल' },
  assistant: { title: 'AI सहायक', placeholder: 'जोखिम, मार्ग, घटनाओं के बारे में पूछें...', greeting: 'नमस्ते! मैं क्राउडशील्ड AI सहायक हूं।', crowhdShieldAi: 'क्राउडशील्ड AI', connectionError: 'कनेक्शन त्रुटि। कृपया API सर्वर जांचें।' },
  teams: { title: 'प्रतिक्रिया टीम', create: 'बनाएं', teams: 'टीम', active: 'सक्रिय', personnel: 'कर्मचारी', leader: 'नेता', members: 'सदस्य', zone: 'ज़ोन', specialty: 'विशेषज्ञता', assign: 'नियुक्त करें', dispatch: 'भेजें' },
  profile: { title: 'मेरी प्रोफ़ाइल', email: 'ईमेल', role: 'भूमिका', status: 'स्थिति', settings: 'सेटिंग्स', notifications: 'सूचनाएं', language: 'भाषा', darkMode: 'डार्क मोड', privacy: 'गोपनीयता', enabled: 'सक्षम', signOut: 'साइन आउट' },
  permissions: { title: 'क्राउडशील्ड सक्षम करें', subtitle: 'आपकी सुरक्षा के लिए अनुमतियां आवश्यक हैं:', camera: 'कैमरा पहुंच', cameraDesc: 'रीयल-टाइम भीड़ पहचान', notifications: 'सूचनाएं', notificationsDesc: 'गंभीर सुरक्षा अलर्ट', location: 'स्थान पहुंच', locationDesc: 'आपातकालीन नेविगेशन', grantAll: 'सभी अनुमतियां दें', skip: 'अभी के लिए छोड़ें', granted: '✓ दिया गया', allow: 'अनुमति दें' },
  language: { en: 'English', hi: 'हिन्दी', es: 'Español', select: 'भाषा' },
};

// ─── Spanish ────────────────────────────────────────────────────
const es: Record<string, any> = {
  ...en,
  appName: 'CROWDSHIELD',
  appTagline: 'Seguridad Multitudinaria con IA',
  loading: 'Cargando...',
  error: 'Error',
  save: 'Guardar',
  cancel: 'Cancelar',
  submit: 'Enviar',
  back: 'Volver',
  search: 'Buscar',
  viewAll: 'Ver todo →',
  nav: { dashboard: 'Panel', zones: 'Zonas', cameras: 'Cámaras', deviceCamera: 'Cámara', alerts: 'Alertas', missing: 'Desaparecidos', incidents: 'Incidentes', assistant: 'Asistente IA', teams: 'Equipos', profile: 'Perfil' },
  auth: { signIn: 'Iniciar Sesión', signUp: 'Crear Cuenta', email: 'Correo', password: 'Contraseña', fullName: 'Nombre Completo', role: 'Rol', signOut: 'Cerrar Sesión' },
  dashboard: { overallRisk: 'PUNTUACIÓN DE RIESGO', zoneRiskLevels: 'RIESGO POR ZONA', activeAlerts: 'ALERTAS ACTIVAS', statusOverview: 'RESUMEN DE ESTADO', noActiveAlerts: 'No hay alertas activas', zones: 'Zonas', alerts: 'Alertas', crowd: 'Multitud', risk: 'Riesgo' },
  risk: { LOW: 'BAJO', MODERATE: 'MODERADO', HIGH: 'ALTO', CRITICAL: 'CRÍTICO' },
  zone: { riskScore: 'Puntuación', people: 'Personas', density: 'Densidad', velocity: 'Velocidad', flowConflict: 'Conflicto', bottleneck: 'Cuello Botella', digitalTwin: 'GEMELO DIGITAL', live: 'EN VIVO', allZones: 'TODAS LAS ZONAS' },
  cameras: { title: 'CÁMARAS CCTV', online: 'En línea', offline: 'Fuera de línea', total: 'Total', live: 'EN VIVO' },
  deviceCamera: { title: 'CÁMARA DEL DISPOSITIVO', startCamera: 'Iniciar Cámara', stopCamera: 'Detener Cámara', cameraActive: 'Cámara Activa', tapToStart: 'Toque para iniciar', howItWorks: 'Cómo Funciona', detectionResults: 'Resultados', tracked: 'Rastreados', zones: 'Zonas', risk: 'Riesgo' },
  alerts: { title: 'Centro de Alertas', allClear: '✓ Todo Despejado', noActiveAlerts: 'No hay alertas activas', dismiss: 'Descartar' },
  missing: { title: 'Desaparecidos', newReport: 'Nuevo Reporte', persons: 'Personas', items: 'Objetos', reportPerson: 'Reportar Desaparecido', name: 'Nombre completo *', age: 'Edad', height: 'Altura', clothing: 'Ropa', description: 'Descripción', lastSeenZone: 'Última zona vista', reporterName: 'Su nombre', reporterContact: 'Contacto', submitReport: 'Enviar Reporte', noPersons: 'No hay reportes', noItems: 'No hay reportes', missing: 'DESAPARECIDA', found: 'ENCONTRADA' },
  incidents: { title: 'INCIDENTES', all: 'TODOS', active: 'ACTIVOS', responding: 'RESPONDIENDO', investigating: 'INVESTIGANDO', resolved: 'RESUELTOS' },
  assistant: { title: 'Asistente IA', placeholder: 'Pregunte sobre riesgos, rutas...', greeting: '¡Hola! Soy el Asistente IA de CrowdShield.', crowhdShieldAi: 'CROWDSHIELD AI', connectionError: 'Error de conexión. Verifique el servidor.' },
  teams: { title: 'EQUIPOS DE RESPUESTA', create: 'Crear', teams: 'Equipos', active: 'Activos', personnel: 'Personal', leader: 'Líder', members: 'Miembros', zone: 'Zona', specialty: 'Especialidad', assign: 'Asignar', dispatch: 'Despachar' },
  profile: { title: 'Mi Perfil', email: 'CORREO', role: 'ROL', status: 'ESTADO', settings: 'Configuración', notifications: 'Notificaciones', language: 'Idioma', darkMode: 'Modo Oscuro', privacy: 'Privacidad', enabled: 'Habilitado', signOut: 'Cerrar Sesión' },
  permissions: { title: 'Habilitar CrowdShield', subtitle: 'Para su seguridad se necesitan permisos:', camera: 'Acceso a Cámara', cameraDesc: 'Detección en tiempo real', notifications: 'Notificaciones', notificationsDesc: 'Alertas de seguridad', location: 'Acceso a Ubicación', locationDesc: 'Navegación de emergencia', grantAll: 'Conceder Todos', skip: 'Omitir por ahora', granted: '✓ Concedido', allow: 'Permitir' },
  language: { en: 'English', hi: 'हिन्दी', es: 'Español', select: 'Idioma' },
};

// ─── All translations ──────────────────────────────────────────
const translations: Record<Locale, any> = { en, hi, es };

// ─── Context ────────────────────────────────────────────────────
interface I18nContextValue {
  locale: Locale;
  t: typeof en;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  t: en,
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export { translations };
export type TranslationKeys = typeof en;
