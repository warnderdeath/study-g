// Premium Dark Theme - Gold & Black Engineering Aesthetic

export const colors = {
  // Primary Colors
  background: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceLight: '#2A2A2A',

  // Premium Gold Accents
  primary: '#D4AF37', // Rich Gold
  primaryLight: '#E5C158',
  primaryDark: '#C19B2B',

  // Text Colors
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',

  // Status Colors
  success: '#4CAF50',
  warning: '#FFA726',
  error: '#EF5350',
  info: '#29B6F6',

  // Functional Colors
  border: '#333333',
  borderLight: '#404040',
  cardBg: '#1A1A1A',
  modalBg: 'rgba(0, 0, 0, 0.95)',

  // Timer & Focus Colors
  focus: '#D4AF37',
  focusGlow: 'rgba(212, 175, 55, 0.2)',

  // Chart Colors
  chart: {
    primary: '#D4AF37',
    secondary: '#E5C158',
    tertiary: '#C19B2B',
    grid: '#2A2A2A',
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 48,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 5.46,
    elevation: 6,
  },
  gold: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  }
};
