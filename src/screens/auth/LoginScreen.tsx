import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer, AppButton, AppInput } from '../../components';
import { colors, spacing, typography } from '../../theme';

export const LoginScreen: React.FC = () => {
    return (
        <ScreenContainer scrollable>
            <View style={styles.container}>
                <Text style={styles.title}>Itaipu Connect</Text>
                <Text style={styles.subtitle}>Entre com sua conta</Text>

                <View style={styles.form}>
                    <AppInput
                        label="E-mail"
                        placeholder="seu@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <AppInput
                        label="Senha"
                        placeholder="••••••••"
                        secureTextEntry
                    />

                    <AppButton
                        title="Entrar"
                        variant="primary"
                        fullWidth
                        style={styles.button}
                    />

                    <AppButton
                        title="Tenho um código de convite"
                        variant="outline"
                        fullWidth
                    />
                </View>
            </View>
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing['2xl'],
        justifyContent: 'center',
    },
    title: {
        fontSize: typography.sizes['4xl'],
        fontWeight: typography.weights.bold,
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: typography.sizes.lg,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing['4xl'],
    },
    form: {
        gap: spacing.md,
    },
    button: {
        marginTop: spacing.md,
    },
});
