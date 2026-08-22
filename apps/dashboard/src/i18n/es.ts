// CrowdShield i18n — Spanish (Español)
import type en from './en';
type Translations = typeof en;

const es: Translations = {
  // Common
  appName: 'CROWDSHIELD',
  appTagline: 'Plataforma de Seguridad Multitudinaria con IA',
  loading: 'Cargando...',
  error: 'Error',
  save: 'Guardar',
  cancel: 'Cancelar',
  delete: 'Eliminar',
  edit: 'Editar',
  close: 'Cerrar',
  back: 'Volver',
  next: 'Siguiente',
  submit: 'Enviar',
  search: 'Buscar',
  filter: 'Filtrar',
  viewAll: 'Ver todo →',
  noData: 'No hay datos disponibles',
  retry: 'Reintentar',
  goHome: 'Ir al inicio',

  // Navigation
  nav: {
    dashboard: 'Panel',
    zones: 'Zonas',
    cameras: 'Cámaras',
    liveMonitor: 'Monitor en Vivo',
    deviceCamera: 'Cámara del Dispositivo',
    alerts: 'Alertas',
    missing: 'Reportes de Desaparecidos',
    incidents: 'Incidentes',
    assistant: 'Asistente IA',
    teams: 'Equipos de Respuesta',
    profile: 'Mi Perfil',
  },

  // Roles
  role: {
    OPERATOR: 'Operador',
    COMMANDER: 'Comandante',
  },

  // Auth
  auth: {
    signIn: 'Iniciar Sesión',
    signUp: 'Crear Cuenta',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    fullName: 'Nombre Completo',
    role: 'Rol',
    signedInAs: 'Conectado como',
    signOut: 'Cerrar Sesión',
    createAccount: 'Crear Cuenta',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    dontHaveAccount: '¿No tienes una cuenta?',
  },

  // Dashboard
  dashboard: {
    title: 'Resumen del Panel',
    overallRisk: 'PUNTUACIÓN DE RIESGO GENERAL',
    zoneRiskLevels: 'NIVELES DE RIESGO POR ZONA',
    activeAlerts: 'ALERTAS ACTIVAS',
    statusOverview: 'RESUMEN DE ESTADO',
    viewAllAlerts: 'Ver todo →',
    noActiveAlerts: 'No hay alertas activas',
    allZonesSafe: 'Todas las zonas operan dentro de parámetros seguros.',
    zones: 'Zonas',
    alerts: 'Alertas',
    crowd: 'Multitud',
    risk: 'Riesgo',
    digitalTwin: 'GEMELO DIGITAL DEL RECINTO',
    live: 'EN VIVO',
    clickToInspect: 'Haga clic en una zona para inspeccionar',
  },

  // Risk levels
  risk: {
    LOW: 'BAJO',
    MODERATE: 'MODERADO',
    HIGH: 'ALTO',
    CRITICAL: 'CRÍTICO',
    lowDesc: 'Todas las zonas dentro de parámetros operativos seguros.',
    moderateDesc: 'Monitoreando condiciones elevadas.',
    highDesc: 'Alerta elevada. Varias zonas se acercan a umbrales críticos.',
    criticalDesc: 'Acción inmediata requerida.',
  },

  // Zone details
  zone: {
    riskScore: 'Puntuación de Riesgo',
    people: 'Personas',
    density: 'Densidad',
    velocity: 'Velocidad',
    flowConflict: 'Conflicto de Flujo',
    bottleneck: 'Cuello de Botella',
    allZones: 'TODAS LAS ZONAS',
    venueDigitalTwin: 'GEMELO DIGITAL DEL RECINTO',
  },

  // Cameras
  cameras: {
    title: 'CÁMARAS CCTV',
    online: 'En línea',
    offline: 'Fuera de línea',
    total: 'Total',
    live: 'EN VIVO',
  },

  // Device Camera
  deviceCamera: {
    title: 'CÁMARA DEL DISPOSITIVO',
    startCamera: 'Iniciar Cámara',
    stopCamera: 'Detener Cámara',
    cameraActive: 'Cámara Activa',
    tapToStart: 'Toque para iniciar la cámara',
    usesDeviceCamera: 'Usa la cámara de su dispositivo para detección de multitudes en tiempo real',
    howItWorks: 'Cómo Funciona',
    yoloDetection: 'Detección de personas YOLOv8 ejecutándose en el dispositivo',
    bytetrackTracking: 'ByteTrack asigna IDs únicos a cada persona',
    realtimeAnalysis: 'Análisis de densidad y flujo en tiempo real',
    stampedePrediction: 'Predicción de riesgo de estampida mediante modelo LSTM',
    detectionResults: 'Resultados de Detección',
    tracked: 'Rastreados',
    zones: 'Zonas',
  },

  // Alerts
  alerts: {
    title: 'Centro de Alertas',
    allClear: '✓ Todo Despejado',
    noActiveAlerts: 'No hay alertas activas',
    allZonesSafe: 'Todas las zonas operan dentro de parámetros seguros',
    severity: 'Gravedad',
    zone: 'Zona',
    message: 'Mensaje',
    time: 'Tiempo',
    acknowledge: 'Reconocer',
    dismiss: 'Descartar',
    timer: 'Temporizador',
  },

  // Missing Reports
  missing: {
    title: 'Reportes de Desaparecidos',
    newReport: 'Nuevo Reporte',
    persons: 'Personas',
    items: 'Objetos',
    reportPerson: 'Reportar Persona Desaparecida',
    name: 'Nombre',
    age: 'Edad',
    height: 'Altura',
    clothing: 'Ropa',
    description: 'Descripción',
    lastSeenZone: 'Última zona vista',
    reporterName: 'Su nombre',
    reporterContact: 'Contacto',
    submitReport: 'Enviar Reporte',
    noPersons: 'No hay reportes de personas desaparecidas',
    noItems: 'No hay reportes de objetos perdidos',
    missing: 'DESAPARECIDA',
    found: 'ENCONTRADA',
  },

  // Incidents
  incidents: {
    title: 'INCIDENTES',
    all: 'TODOS',
    active: 'ACTIVOS',
    responding: 'RESPONDIENDO',
    investigating: 'INVESTIGANDO',
    resolved: 'RESUELTOS',
    type: 'Tipo',
    severity: 'Gravedad',
    zone: 'Zona',
    reported: 'Reportado por',
    aiDetection: 'Detección IA',
    citizenReport: 'Reporte Ciudadano',
    cctvAi: 'CCTV IA',
  },

  // AI Assistant
  assistant: {
    title: 'Asistente IA',
    placeholder: 'Pregunte sobre riesgos, rutas, incidentes...',
    greeting: '¡Hola! Soy el Asistente IA de CrowdShield. Pregúnteme sobre el estado de riesgo, recomendaciones, rutas de evacuación o resúmenes de situación.',
    crowhdShieldAi: 'CROWDSHIELD AI',
    connectionError: 'Error de conexión. Verifique que el servidor API esté ejecutándose.',
    quickActions: {
      riskStatus: '¿Cuál es el estado de riesgo actual?',
      evacuationRoutes: 'Muéstreme las rutas de evacuación',
      incidentSummary: 'Generar resumen del incidente',
      interventions: 'Recomendar intervenciones',
    },
  },

  // Teams
  teams: {
    title: 'EQUIPOS DE RESPUESTA',
    create: 'Crear',
    teams: 'Equipos',
    active: 'Activos',
    personnel: 'Personal',
    leader: 'Líder',
    members: 'Miembros',
    zone: 'Zona',
    specialty: 'Especialidad',
    assign: 'Asignar',
    dispatch: 'Despachar',
    crowdControl: 'Control de Multitudes',
    medicalResponse: 'Respuesta Médica',
    evacuation: 'Evacuación',
    surveillance: 'Vigilancia',
  },

  // Profile
  profile: {
    title: 'Mi Perfil',
    email: 'CORREO',
    role: 'ROL',
    status: 'ESTADO',
    settings: 'Configuración',
    notifications: 'Notificaciones',
    language: 'Idioma',
    darkMode: 'Modo Oscuro',
    privacy: 'Privacidad',
    enabled: 'Habilitado',
    signOut: 'Cerrar Sesión',
  },

  // Simulation
  simulation: {
    title: 'SIMULACIÓN',
    start: 'INICIAR SIMULACIÓN',
    stop: 'DETENER SIMULACIÓN',
    scenario: 'Escenario',
    speed: 'Velocidad',
    scenarios: {
      normal: 'Normal',
      crowdSurge: 'Aumento de Multitud',
      risingDensity: 'Densidad Crescente',
      gateBlocked: 'Puerta Bloqueada',
      reverseFlow: 'Flujo Inverso',
      panicLike: 'Similar al Pánico',
      recovery: 'Recuperación',
    },
  },

  // Errors
  errorPage: {
    title: 'Algo salió mal',
    description: 'Ocurrió un error inesperado. Por favor, inténtelo de nuevo.',
    technicalDetails: 'Detalles Técnicos',
    tryAgain: 'Reintentar',
    goHome: 'Ir al Inicio',
    builtWith: 'Hecho con ❤️ por CrowdShield',
  },

  // Language selector
  language: {
    en: 'English',
    hi: 'हिन्दी',
    es: 'Español',
    select: 'Idioma',
  },

  // Permissions
  permissions: {
    title: 'Habilitar CrowdShield',
    subtitle: 'Para mantenerlo seguro, CrowdShield necesita acceso a lo siguiente:',
    camera: 'Acceso a Cámara',
    cameraDesc: 'Detección de multitudes en tiempo real desde la cámara de su dispositivo',
    notifications: 'Notificaciones',
    notificationsDesc: 'Alertas críticas de seguridad y advertencias de emergencia',
    location: 'Acceso a Ubicación',
    locationDesc: 'Rutas seguras cercanas y navegación del recinto en emergencias',
    grantAll: 'Conceder Todos los Permisos',
    skip: 'Omitir por ahora (funcionalidad limitada)',
    granted: '✓ Concedido',
    allow: 'Permitir',
  },

  // Hero page
  hero: {
    title: 'CROWDSHIELD',
    subtitle: 'Plataforma de Seguridad Multitudinaria con IA',
    cta: 'Iniciar Centro de Comando',
    aboutTitle: 'Sobre CrowdShield',
    aboutText: 'CrowdShield es una plataforma de alerta temprana y seguridad multitudinaria impulsada por IA que monitorea la densidad de multitudes en tiempo real, predice riesgos de estampida y recomienda intervenciones inteligentes para prevenir desastres multitudinarios.',
    caseStudiesTitle: 'POR QUÉ ESTO IMPORTA',
    caseStudiesSubtitle: 'Incidentes reales. Vidas reales perdidas. La IA puede prevenir la próxima tragedia.',
    faqTitle: 'PREGUNTAS FRECUENTES',
    docsTitle: 'DOCUMENTACIÓN',
    githubTitle: 'REPOSITORIO GITHUB',
    apiDocsTitle: 'DOCUMENTACIÓN API',
    loginTitle: 'COMENZAR',
    loginSubtitle: 'Inicie sesión para acceder al centro de comando',
    feature1: 'Monitoreo en Tiempo Real',
    feature1Desc: 'Estimación de densidad multitudinaria con IA desde feeds de video usando detección de personas YOLOv8 y rastreo ByteTrack.',
    feature2: 'Predicción de Riesgos',
    feature2Desc: 'Modelos ML ensemble combinando XGBoost y LSTM para predicción precisa de riesgo de estampida y alertas tempranas.',
    feature3: 'Gemelo Digital',
    feature3Desc: 'Visualización 3D interactiva del recinto con superposiciones de zona en tiempo real, mapas de calor y análisis de flujo multitudinario.',
    feature4: 'Alertas Inteligentes',
    feature4Desc: 'Sistema de notificaciones inteligente con alertas multilingües, temporizadores de escalamiento y recomendaciones de intervención.',
    feature5: 'Equipos de Respuesta',
    feature5Desc: 'Coordine equipos de respuesta con asignación en tiempo real, seguimiento de despacho y gestión de incidentes.',
    feature6: 'Acceso Móvil',
    feature6Desc: 'Aplicación móvil nativa con detección multitudinaria por cámara, notificaciones push y navegación de emergencia.',
  },
} as const;

export default es;
