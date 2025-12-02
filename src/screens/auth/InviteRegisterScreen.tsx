import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer, AppButton, AppInput } from '../../components';
import { colors, spacing, typography } from '../../theme';

export const InviteRegisterScreen: React.FC = () => {
    return (
        <ScreenContainer scrollable>
            <View style={styles.container}>
                <Text style={styles.title}>Cadastro por Convite</Text>
                <Text style={styles.subtitle}>
                    Insira seu código de convite para criar sua conta
                </Text>

                <View style={styles.form}>
                    <AppInput
                        label="E-mail"
                        placeholder="seu@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <AppInput
                        label="Código de Convite"
                        placeholder="XXXXXX"
                        autoCapitalize="characters"
                    />
                    <AppInput label="Senha" placeholder="••••••••" secureTextEntry />
                    <AppInput
                        label="Confirmar Senha"
                        placeholder="••••••••"
                        secureTextEntry
                    />

                    <AppButton
                        title="Criar Conta"
                        variant="primary"
                        fullWidth
                        style={styles.button}
                    />

                    <AppButton title="Voltar ao Login" variant="outline" fullWidth />
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
        fontSize: typography.sizes['3xl'],
        fontWeight: typography.weights.bold,
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: typography.sizes.md,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing['3xl'],
    },
    form: {
        gap: spacing.md,
    },
    button: {
        marginTop: spacing.md,
    },
});
