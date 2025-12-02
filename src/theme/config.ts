import { createConfig } from '@gluestack-style/react';

export const config = createConfig({
    aliases: {
        bg: 'backgroundColor',
        bgColor: 'backgroundColor',
        p: 'padding',
        px: 'paddingHorizontal',
        py: 'paddingVertical',
        pt: 'paddingTop',
        pb: 'paddingBottom',
        pl: 'paddingLeft',
        pr: 'paddingRight',
        m: 'margin',
        mx: 'marginHorizontal',
        my: 'marginVertical',
        mt: 'marginTop',
        mb: 'marginBottom',
        ml: 'marginLeft',
        mr: 'marginRight',
    },
    tokens: {
        colors: {
            // Primary
            primary: '#2563EB',
            primaryDark: '#1E40AF',
            primaryLight: '#3B82F6',

            // Background
            background: '#020617', // slate-950
            backgroundCard: '#0B1120',
            backgroundHover: '#1E293B', // slate-800

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
        },
        space: {
            '1': 4,
            '2': 8,
            '3': 12,
            '4': 16,
            '5': 20,
            '6': 24,
            '8': 32,
            '10': 40,
            '12': 48,
            '16': 64,
            '20': 80,
        },
        fontSizes: {
            xs: 12,
            sm: 14,
            md: 16,
            lg: 18,
            xl: 20,
            '2xl': 24,
            '3xl': 30,
            '4xl': 36,
        },
        radii: {
            none: 0,
            sm: 4,
            md: 8,
            lg: 12,
            xl: 16,
            full: 9999,
        },
    },
} as const);

export type Config = typeof config;

declare module '@gluestack-style/react' {
    interface ICustomConfig extends Config { }
}
