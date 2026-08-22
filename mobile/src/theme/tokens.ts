// CrowdShield Mobile — Design Tokens
export const Colors = {
  red: '#C50022',
  redLight: '#C5002220',
  redGlow: '#C5002240',
  black: '#000000',
  bg: '#0a0a0f',
  surface: '#12121a',
  surfaceLight: '#1a1a25',
  beige: '#B5AC8A',
  beigeMuted: '#B5AC8A60',
  beigeLight: '#B5AC8A20',
  text: '#e8e4dd',
  textMuted: '#8a8580',
  textDim: '#5a5550',
  glass: 'rgba(18, 18, 26, 0.85)',
  glassBorder: 'rgba(181, 172, 138, 0.12)',
  glassHighlight: 'rgba(181, 172, 138, 0.06)',
  green: '#5cb85c',
  greenLight: '#5cb85c20',
  orange: '#f0ad4e',
  orangeLight: '#f0ad4e20',
  white: '#ffffff',
};

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
};

export const BorderRadius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 999,
};

export const FontSize = {
  xs: 10, sm: 12, md: 14, lg: 16, xl: 18, xxl: 22, xxxl: 28, hero: 36,
};

export const Glass = {
  bg: Colors.glass,
  border: `1px solid ${Colors.glassBorder}`,
  shadow: '0 4px 30px rgba(0,0,0,0.3)',
};

export const NeuShadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  redGlow: {
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Backward-compatible lowercase exports for existing screens
export const colors = {
  ...Colors,
  critical: Colors.red,
  inputBg: Colors.surfaceLight,
  inputBorder: Colors.glassBorder,
  textBright: Colors.text,
  redDim: Colors.red + '60',
};

export const riskColors: Record<string, string> = {
  LOW: Colors.green,
  MODERATE: Colors.orange,
  HIGH: '#f0ad4e',
  CRITICAL: Colors.red,
};

export const spacing = Spacing;
export const radius = BorderRadius;
