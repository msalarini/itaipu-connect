export const colors = {
    // Primary
    primary: '#2563EB',
    primaryDark: '#1E40AF',
    primaryLight: '#3B82F6',

    // Secondary
    secondary: '#6366F1', // indigo-500
    secondaryDark: '#4F46E5',

    // Background
    background: '#020617', // slate-950
    backgroundCard: '#0B1120',
    backgroundHover: '#1E293B', // slate-800
    muted: '#1E293B', // slate-800

    // Text
    text: '#E5E7EB', // gray-200
    textSecondary: '#9CA3AF', // gray-400
    textMuted: '#6B7280', // gray-500

    // Status
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // UI Elements
    border: '#1E293B', // slate-800
    borderLight: '#334155', // slate-700

    // Neutral
    white: '#FFFFFF',
    black: '#000000',
};

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
