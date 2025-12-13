// Palette definitions
const palette = {
    primary: '#2563EB',
    primaryDark: '#1E40AF',
    primaryLight: '#3B82F6',

    secondary: '#6366F1', // indigo-500
    secondaryDark: '#4F46E5',

    // Slate
    slate50: '#F8FAFC',
    slate100: '#F1F5F9',
    slate200: '#E2E8F0',
    slate300: '#CBD5E1',
    slate400: '#94A3B8',
    slate500: '#64748B',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1E293B',
    slate900: '#0F172A',
    slate950: '#020617',

    // Status
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    white: '#FFFFFF',
    black: '#000000',
};

export const darkColors = {
    // Primary
    primary: palette.primary,
    primaryDark: palette.primaryDark,
    primaryLight: palette.primaryLight,

    // Secondary
    secondary: palette.secondary,
    secondaryDark: palette.secondaryDark,

    // Background
    background: palette.slate950,
    backgroundCard: '#0B1120', // slightly lighter than 950
    backgroundHover: palette.slate800,
    muted: palette.slate800,

    // Text
    text: '#E5E7EB', // gray-200
    textSecondary: '#9CA3AF', // gray-400
    textMuted: '#6B7280', // gray-500

    // Status
    success: palette.success,
    warning: palette.warning,
    error: palette.error,
    info: palette.info,

    // UI Elements
    border: palette.slate800,
    borderLight: palette.slate700,

    // Neutral
    white: palette.white,
    black: palette.black,
};

export const lightColors = {
    // Primary
    primary: palette.primary,
    primaryDark: palette.primaryDark,
    primaryLight: palette.primaryLight,

    // Secondary
    secondary: palette.secondary,
    secondaryDark: palette.secondaryDark,

    // Background
    background: palette.slate50,
    backgroundCard: palette.white,
    backgroundHover: palette.slate100,
    muted: palette.slate200,

    // Text
    text: palette.slate900,
    textSecondary: palette.slate600,
    textMuted: palette.slate400,

    // Status
    success: palette.success,
    warning: palette.warning,
    error: palette.error,
    info: palette.info,

    // UI Elements
    border: palette.slate300,
    borderLight: palette.slate200,

    // Neutral
    white: palette.white,
    black: palette.black,
};

// Default to Dark for backward compatibility until refactor is complete
export const colors = darkColors;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
};

export const typography = {
    sizes: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
    },
    weights: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },
};

export const borderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
};
