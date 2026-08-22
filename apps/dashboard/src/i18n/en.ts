// CrowdShield i18n — English
export default {
  // Common
  appName: 'CROWDSHIELD',
  appTagline: 'AI-Powered Crowd Safety Platform',
  loading: 'Loading...',
  error: 'Error',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  edit: 'Edit',
  close: 'Close',
  back: 'Back',
  next: 'Next',
  submit: 'Submit',
  search: 'Search',
  filter: 'Filter',
  viewAll: 'View all →',
  noData: 'No data available',
  retry: 'Try Again',
  goHome: 'Go Home',

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    zones: 'Zones',
    cameras: 'Cameras',
    liveMonitor: 'Live Monitor',
    deviceCamera: 'Device Camera',
    alerts: 'Alerts',
    missing: 'Missing Reports',
    incidents: 'Incidents',
    assistant: 'AI Assistant',
    teams: 'Response Teams',
    profile: 'My Profile',
  },

  // Roles
  role: {
    OPERATOR: 'Operator',
    COMMANDER: 'Commander',
  },

  // Auth
  auth: {
    signIn: 'Sign In',
    signUp: 'Create Account',
    email: 'Email',
    password: 'Password',
    fullName: 'Full Name',
    role: 'Role',
    signedInAs: 'Signed in as',
    signOut: 'Sign Out',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard Overview',
    overallRisk: 'OVERALL RISK SCORE',
    zoneRiskLevels: 'ZONE RISK LEVELS',
    activeAlerts: 'ACTIVE ALERTS',
    statusOverview: 'STATUS OVERVIEW',
    viewAllAlerts: 'View all →',
    noActiveAlerts: 'No active alerts',
    allZonesSafe: 'All zones operating within safe parameters.',
    zones: 'Zones',
    alerts: 'Alerts',
    crowd: 'Crowd',
    risk: 'Risk',
    digitalTwin: 'VENUE DIGITAL TWIN',
    live: 'LIVE',
    clickToInspect: 'Click a zone to inspect',
  },

  // Risk levels
  risk: {
    LOW: 'LOW',
    MODERATE: 'MODERATE',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
    lowDesc: 'All zones within safe operating parameters.',
    moderateDesc: 'Monitoring elevated conditions.',
    highDesc: 'Heightened alert. Several zones approaching critical thresholds.',
    criticalDesc: 'Immediate action required.',
  },

  // Zone details
  zone: {
    riskScore: 'Risk Score',
    people: 'People',
    density: 'Density',
    velocity: 'Velocity',
    flowConflict: 'Flow Conflict',
    bottleneck: 'Bottleneck',
    allZones: 'ALL ZONES',
    venueDigitalTwin: 'VENUE DIGITAL TWIN',
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
    usesDeviceCamera: 'Uses your device camera for real-time crowd detection',
    howItWorks: 'How It Works',
    yoloDetection: 'YOLOv8 person detection runs on-device',
    bytetrackTracking: 'ByteTrack assigns unique IDs to each person',
    realtimeAnalysis: 'Real-time density & flow analysis',
    stampedePrediction: 'Stampede risk prediction via LSTM model',
    detectionResults: 'Detection Results',
    tracked: 'Tracked',
    zones: 'Zones',
  },

  // Alerts
  alerts: {
    title: 'Alert Center',
    allClear: '✓ All Clear',
    noActiveAlerts: 'No active alerts',
    allZonesSafe: 'All zones operating within safe parameters',
    severity: 'Severity',
    zone: 'Zone',
    message: 'Message',
    time: 'Time',
    acknowledge: 'Acknowledge',
    dismiss: 'Dismiss',
    timer: 'Timer',
  },

  // Missing Reports
  missing: {
    title: 'Missing Reports',
    newReport: 'New Report',
    persons: 'Persons',
    items: 'Items',
    reportPerson: 'Report Missing Person',
    name: 'Name',
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
    type: 'Type',
    severity: 'Severity',
    zone: 'Zone',
    reported: 'Reported by',
    aiDetection: 'AI Detection',
    citizenReport: 'Citizen Report',
    cctvAi: 'CCTV AI',
  },

  // AI Assistant
  assistant: {
    title: 'AI Assistant',
    placeholder: 'Ask about risks, routes, incidents...',
    greeting: 'Hello! I am the CrowdShield AI Assistant. Ask me about risk status, recommendations, evacuation routes, or situation summaries.',
    crowhdShieldAi: 'CROWDSHIELD AI',
    connectionError: 'Connection error. Please check that the API server is running.',
    quickActions: {
      riskStatus: 'What is the current risk status?',
      evacuationRoutes: 'Show me evacuation routes',
      incidentSummary: 'Generate incident summary',
      interventions: 'Recommend interventions',
    },
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
    crowdControl: 'Crowd Control',
    medicalResponse: 'Medical Response',
    evacuation: 'Evacuation',
    surveillance: 'Surveillance',
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

  // Simulation
  simulation: {
    title: 'SIMULATION',
    start: 'START SIMULATION',
    stop: 'STOP SIMULATION',
    scenario: 'Scenario',
    speed: 'Speed',
    scenarios: {
      normal: 'Normal',
      crowdSurge: 'Crowd Surge',
      risingDensity: 'Rising Density',
      gateBlocked: 'Gate Blocked',
      reverseFlow: 'Reverse Flow',
      panicLike: 'Panic-Like',
      recovery: 'Recovery',
    },
  },

  // Errors
  errorPage: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.',
    technicalDetails: 'Technical Details',
    tryAgain: 'Try Again',
    goHome: 'Go Home',
    builtWith: 'Built with ❤️ by CrowdShield',
  },

  // Language selector
  language: {
    en: 'English',
    hi: 'हिन्दी',
    es: 'Español',
    select: 'Language',
  },

  // Permissions
  permissions: {
    title: 'Enable CrowdShield',
    subtitle: 'To keep you safe, CrowdShield needs access to the following:',
    camera: 'Camera Access',
    cameraDesc: 'Real-time crowd detection from your device camera',
    notifications: 'Notifications',
    notificationsDesc: 'Critical crowd safety alerts and emergency warnings',
    location: 'Location Access',
    locationDesc: 'Nearby safe routes and venue navigation during emergencies',
    grantAll: 'Grant All Permissions',
    skip: 'Skip for now (limited functionality)',
    granted: '✓ Granted',
    allow: 'Allow',
  },

  // Hero page
  hero: {
    title: 'CROWDSHIELD',
    subtitle: 'AI-Powered Crowd Safety Platform',
    cta: 'Launch Command Center',
    aboutTitle: 'About CrowdShield',
    aboutText: 'CrowdShield is an AI-powered early-warning and crowd-safety platform that monitors real-time crowd density, predicts stampede risks, and recommends intelligent interventions to prevent crowd disasters.',
    caseStudiesTitle: 'WHY THIS MATTERS',
    caseStudiesSubtitle: 'Real incidents. Real lives lost. AI can prevent the next tragedy.',
    faqTitle: 'FREQUENTLY ASKED QUESTIONS',
    docsTitle: 'DOCUMENTATION',
    githubTitle: 'GITHUB REPOSITORY',
    apiDocsTitle: 'API DOCUMENTATION',
    loginTitle: 'GET STARTED',
    loginSubtitle: 'Sign in to access the command center',
    feature1: 'Real-Time Monitoring',
    feature1Desc: 'AI-powered crowd density estimation from video feeds using YOLOv8 person detection and ByteTrack tracking.',
    feature2: 'Risk Prediction',
    feature2Desc: 'Ensemble ML models combining XGBoost and LSTM for accurate stampede risk prediction and early warnings.',
    feature3: 'Digital Twin',
    feature3Desc: 'Interactive 3D venue visualization with real-time zone overlays, heatmaps, and crowd flow analysis.',
    feature4: 'Smart Alerts',
    feature4Desc: 'Intelligent notification system with multilingual alerts, escalation timers, and intervention recommendations.',
    feature5: 'Response Teams',
    feature5Desc: 'Coordinate response teams with real-time assignment, dispatch tracking, and incident management.',
    feature6: 'Mobile Access',
    feature6Desc: 'Native mobile app with camera-based crowd detection, push notifications, and emergency navigation.',
  },
} as const;
