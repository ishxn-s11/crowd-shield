// CrowdShield i18n — Hindi (हिन्दी)
import type en from './en';
type Translations = typeof en;

const hi: Translations = {
  // Common
  appName: 'क्राउडशील्ड',
  appTagline: 'AI-संचालित भीड़ सुरक्षा मंच',
  loading: 'लोड हो रहा है...',
  error: 'त्रुटि',
  save: 'सहेजें',
  cancel: 'रद्द करें',
  delete: 'हटाएं',
  edit: 'संपादित करें',
  close: 'बंद करें',
  back: 'वापस',
  next: 'अगला',
  submit: 'जमा करें',
  search: 'खोजें',
  filter: 'फ़िल्टर',
  viewAll: 'सभी देखें →',
  noData: 'कोई डेटा उपलब्ध नहीं',
  retry: 'पुनः प्रयास करें',
  goHome: 'होम पर जाएं',

  // Navigation
  nav: {
    dashboard: 'डैशबोर्ड',
    zones: 'ज़ोन',
    cameras: 'कैमरे',
    liveMonitor: 'लाइव मॉनिटर',
    deviceCamera: 'डिवाइस कैमरा',
    alerts: 'अलर्ट',
    missing: 'लापता रिपोर्ट',
    incidents: 'घटनाएं',
    assistant: 'AI सहायक',
    teams: 'प्रतिक्रिया टीम',
    profile: 'मेरी प्रोफ़ाइल',
  },

  // Roles
  role: {
    OPERATOR: 'ऑपरेटर',
    COMMANDER: 'कमांडर',
  },

  // Auth
  auth: {
    signIn: 'साइन इन',
    signUp: 'खाता बनाएं',
    email: 'ईमेल',
    password: 'पासवर्ड',
    fullName: 'पूरा नाम',
    role: 'भूमिका',
    signedInAs: 'इस रूप में साइन इन',
    signOut: 'साइन आउट',
    createAccount: 'खाता बनाएं',
    alreadyHaveAccount: 'पहले से खाता है?',
    dontHaveAccount: 'खाता नहीं है?',
  },

  // Dashboard
  dashboard: {
    title: 'डैशबोर्ड अवलोकन',
    overallRisk: 'कुल जोखिम स्कोर',
    zoneRiskLevels: 'ज़ोन जोखिम स्तर',
    activeAlerts: 'सक्रिय अलर्ट',
    statusOverview: 'स्थिति अवलोकन',
    viewAllAlerts: 'सभी देखें →',
    noActiveAlerts: 'कोई सक्रिय अलर्ट नहीं',
    allZonesSafe: 'सभी ज़ोन सुरक्षित मानकों में काम कर रहे हैं।',
    zones: 'ज़ोन',
    alerts: 'अलर्ट',
    crowd: 'भीड़',
    risk: 'जोखिम',
    digitalTwin: 'वेन्यू डिजिटल ट्विन',
    live: 'लाइव',
    clickToInspect: 'निरीक्षण के लिए ज़ोन पर क्लिक करें',
  },

  // Risk levels
  risk: {
    LOW: 'कम',
    MODERATE: 'मध्यम',
    HIGH: 'उच्च',
    CRITICAL: 'गंभीर',
    lowDesc: 'सभी ज़ोन सुरक्षित संचालन मानकों में।',
    moderateDesc: 'उन्नत स्थितियों की निगरानी की जा रही है।',
    highDesc: 'उच्च सतर्कता। कई ज़ोन गंभीर सीमाओं के करीब हैं।',
    criticalDesc: 'तत्काल कार्रवाई आवश्यक।',
  },

  // Zone details
  zone: {
    riskScore: 'जोखिम स्कोर',
    people: 'लोग',
    density: 'घनत्व',
    velocity: 'गति',
    flowConflict: 'प्रवाह संघर्ष',
    bottleneck: 'बोतलनेक',
    allZones: 'सभी ज़ोन',
    venueDigitalTwin: 'वेन्यू डिजिटल ट्विन',
  },

  // Cameras
  cameras: {
    title: 'सीसीटीवी कैमरे',
    online: 'ऑनलाइन',
    offline: 'ऑफ़लाइन',
    total: 'कुल',
    live: 'लाइव',
  },

  // Device Camera
  deviceCamera: {
    title: 'डिवाइस कैमरा',
    startCamera: 'कैमरा शुरू करें',
    stopCamera: 'कैमरा बंद करें',
    cameraActive: 'कैमरा सक्रिय',
    tapToStart: 'कैमरा शुरू करने के लिए टैप करें',
    usesDeviceCamera: 'रीयल-टाइम भीड़ पहचान के लिए आपके डिवाइस कैमरे का उपयोग करता है',
    howItWorks: 'यह कैसे काम करता है',
    yoloDetection: 'YOLOv8 व्यक्ति पहचान डिवाइस पर चलती है',
    bytetrackTracking: 'ByteTrack प्रत्येक व्यक्ति को अद्वितीय ID प्रदान करता है',
    realtimeAnalysis: 'रीयल-टाइम घनत्व और प्रवाह विश्लेषण',
    stampedePrediction: 'LSTM मॉडल के माध्यम से भगदड़ जोखिम भविष्यवाणी',
    detectionResults: 'पहचान परिणाम',
    tracked: 'ट्रैक किया',
    zones: 'ज़ोन',
  },

  // Alerts
  alerts: {
    title: 'अलर्ट केंद्र',
    allClear: '✓ सभी स्पष्ट',
    noActiveAlerts: 'कोई सक्रिय अलर्ट नहीं',
    allZonesSafe: 'सभी ज़ोन सुरक्षित मानकों में काम कर रहे हैं',
    severity: 'गंभीरता',
    zone: 'ज़ोन',
    message: 'संदेश',
    time: 'समय',
    acknowledge: 'स्वीकार करें',
    dismiss: 'खारिज करें',
    timer: 'टाइमर',
  },

  // Missing Reports
  missing: {
    title: 'लापता रिपोर्ट',
    newReport: 'नई रिपोर्ट',
    persons: 'व्यक्ति',
    items: 'सामान',
    reportPerson: 'लापता व्यक्ति की रिपोर्ट',
    name: 'नाम',
    age: 'आयु',
    height: 'ऊंचाई',
    clothing: 'कपड़े',
    description: 'विवरण',
    lastSeenZone: 'अंतिम बार देखा गया ज़ोन',
    reporterName: 'आपका नाम',
    reporterContact: 'संपर्क',
    submitReport: 'रिपोर्ट जमा करें',
    noPersons: 'कोई लापता व्यक्ति रिपोर्ट नहीं',
    noItems: 'कोई लापता सामान रिपोर्ट नहीं',
    missing: 'लापता',
    found: 'मिला',
  },

  // Incidents
  incidents: {
    title: 'घटनाएं',
    all: 'सभी',
    active: 'सक्रिय',
    responding: 'प्रतिक्रिया',
    investigating: 'जांच',
    resolved: 'हल',
    type: 'प्रकार',
    severity: 'गंभीरता',
    zone: 'ज़ोन',
    reported: 'द्वारा रिपोर्ट',
    aiDetection: 'AI पहचान',
    citizenReport: 'नागरिक रिपोर्ट',
    cctvAi: 'CCTV AI',
  },

  // AI Assistant
  assistant: {
    title: 'AI सहायक',
    placeholder: 'जोखिम, मार्ग, घटनाओं के बारे में पूछें...',
    greeting: 'नमस्ते! मैं क्राउडशील्ड AI सहायक हूं। मुझसे जोखिम स्थिति, सिफारिशें, निकासी मार्ग, या स्थिति सारांश के बारे में पूछें।',
    crowhdShieldAi: 'क्राउडशील्ड AI',
    connectionError: 'कनेक्शन त्रुटि। कृपया जांचें कि API सर्वर चल रहा है।',
    quickActions: {
      riskStatus: 'वर्तमान जोखिम स्थिति क्या है?',
      evacuationRoutes: 'मुझे निकासी मार्ग दिखाएं',
      incidentSummary: 'घटना सारांश बनाएं',
      interventions: 'हस्तक्षेप की सिफारिश करें',
    },
  },

  // Teams
  teams: {
    title: 'प्रतिक्रिया टीम',
    create: 'बनाएं',
    teams: 'टीम',
    active: 'सक्रिय',
    personnel: 'कर्मचारी',
    leader: 'नेता',
    members: 'सदस्य',
    zone: 'ज़ोन',
    specialty: 'विशेषज्ञता',
    assign: 'नियुक्त करें',
    dispatch: 'भेजें',
    crowdControl: 'भीड़ नियंत्रण',
    medicalResponse: 'चिकित्सा प्रतिक्रिया',
    evacuation: 'निकासी',
    surveillance: 'निगरानी',
  },

  // Profile
  profile: {
    title: 'मेरी प्रोफ़ाइल',
    email: 'ईमेल',
    role: 'भूमिका',
    status: 'स्थिति',
    settings: 'सेटिंग्स',
    notifications: 'सूचनाएं',
    language: 'भाषा',
    darkMode: 'डार्क मोड',
    privacy: 'गोपनीयता',
    enabled: 'सक्षम',
    signOut: 'साइन आउट',
  },

  // Simulation
  simulation: {
    title: 'सिमुलेशन',
    start: 'सिमुलेशन शुरू करें',
    stop: 'सिमुलेशन बंद करें',
    scenario: 'परिदृश्य',
    speed: 'गति',
    scenarios: {
      normal: 'सामान्य',
      crowdSurge: 'भीड़ वृद्धि',
      risingDensity: 'बढ़ता घनत्व',
      gateBlocked: 'गेट अवरुद्ध',
      reverseFlow: 'विपरीत प्रवाह',
      panicLike: 'घबराहट जैसी',
      recovery: 'पुनर्प्राप्ति',
    },
  },

  // Errors
  errorPage: {
    title: 'कुछ गड़बड़ हो गई',
    description: 'एक अप्रत्याशित त्रुटि हुई। कृपया पुनः प्रयास करें।',
    technicalDetails: 'तकनीकी विवरण',
    tryAgain: 'पुनः प्रयास करें',
    goHome: 'होम पर जाएं',
    builtWith: '❤️ से बनाया गया — क्राउडशील्ड',
  },

  // Language selector
  language: {
    en: 'English',
    hi: 'हिन्दी',
    es: 'Español',
    select: 'भाषा',
  },

  // Permissions
  permissions: {
    title: 'क्राउडशील्ड सक्षम करें',
    subtitle: 'आपकी सुरक्षा के लिए, क्राउडशील्ड को निम्नलिखित तक पहुंच की आवश्यकता है:',
    camera: 'कैमरा पहुंच',
    cameraDesc: 'आपके डिवाइस कैमरे से रीयल-टाइम भीड़ पहचान',
    notifications: 'सूचनाएं',
    notificationsDesc: 'गंभीर भीड़ सुरक्षा अलर्ट और आपातकालीन चेतावनी',
    location: 'स्थान पहुंच',
    locationDesc: 'आपातकाल में निकटतम सुरक्षित मार्ग और वेन्यू नेविगेशन',
    grantAll: 'सभी अनुमतियां दें',
    skip: 'अभी के लिए छोड़ें (सीमित कार्यक्षमता)',
    granted: '✓ दिया गया',
    allow: 'अनुमति दें',
  },

  // Hero page
  hero: {
    title: 'क्राउडशील्ड',
    subtitle: 'AI-संचालित भीड़ सुरक्षा मंच',
    cta: 'कमांड सेंटर लॉन्च करें',
    aboutTitle: 'क्राउडशील्ड के बारे में',
    aboutText: 'क्राउडशील्ड एक AI-संचालित प्रारंभिक चेतावनी और भीड़ सुरक्षा मंच है जो रीयल-टाइम भीड़ घनत्व की निगरानी करता है, भगदड़ जोखिमों की भविष्यवाणी करता है, और भीड़ आपदाओं को रोकने के लिए बुद्धिमान हस्तक्षेप की सिफारिश करता है।',
    caseStudiesTitle: 'यह क्यों महत्वपूर्ण है',
    caseStudiesSubtitle: 'वास्तविक घटनाएं। वास्तविक जीवन खोए। AI अगली त्रासदी को रोक सकता है।',
    faqTitle: 'अक्सर पूछे जाने वाले प्रश्न',
    docsTitle: 'दस्तावेज़',
    githubTitle: 'GitHub रिपॉज़िटरी',
    apiDocsTitle: 'API दस्तावेज़',
    loginTitle: 'शुरू करें',
    loginSubtitle: 'कमांड सेंटर तक पहुंचने के लिए साइन इन करें',
    feature1: 'रीयल-टाइम निगरानी',
    feature1Desc: 'YOLOv8 व्यक्ति पहचान और ByteTrack ट्रैकिंग का उपयोग करके वीडियो फ़ीड से AI-संचालित भीड़ घनत्व अनुमान।',
    feature2: 'जोखिम भविष्यवाणी',
    feature2Desc: 'सटीक भगदड़ जोखिम भविष्यवाणी और प्रारंभिक चेतावनी के लिए XGBoost और LSTM को मिलाकर संयुक्त ML मॉडल।',
    feature3: 'डिजिटल ट्विन',
    feature3Desc: 'रीयल-टाइम ज़ोन ओवरले, हीटमैप और भीड़ प्रवाह विश्लेषण के साथ इंटरैक्टिव 3D वेन्यू विज़ुअलाइज़ेशन।',
    feature4: 'स्मार्ट अलर्ट',
    feature4Desc: 'बहुभाषी अलर्ट, एस्केलेशन टाइमर और हस्तक्षेप सिफारिशों के साथ बुद्धिमान सूचना प्रणाली।',
    feature5: 'प्रतिक्रिया टीम',
    feature5Desc: 'रीयल-टाइम असाइनमेंट, डिस्पैच ट्रैकिंग और घटना प्रबंधन के साथ प्रतिक्रिया टीमों का समन्वय।',
    feature6: 'मोबाइल पहुंच',
    feature6Desc: 'कैमरा-आधारित भीड़ पहचान, पुश नोटिफिकेशन और आपातकालीन नेविगेशन वाला नेटिव मोबाइल ऐप।',
  },
} as const;

export default hi;
