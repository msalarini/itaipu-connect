import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components';
import { colors, spacing, typography } from '../../theme';

export const EventsScreen: React.FC = () => {
    return (
        <ScreenContainer>
            <View style={styles.container}>
                <Text style={styles.title}>Eventos</Text>
                <Text style={styles.subtitle}>
                    Próximos eventos e atividades
                </Text>
            </View>
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing['2xl'],
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: typography.sizes['3xl'],
        fontWeight: typography.weights.bold,
        color: colors.text,
        marginBottom: spacing.md,
    },
    subtitle: {
        fontSize: typography.sizes.md,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
