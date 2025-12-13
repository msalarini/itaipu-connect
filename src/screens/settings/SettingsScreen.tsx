import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ScreenContainer } from '../../components';
import { spacing, typography, borderRadius } from '../../theme';
import Constants from 'expo-constants';

export const SettingsScreen: React.FC = () => {
    const { theme, toggleTheme, colors } = useTheme();
    const { signOut } = useAuth();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const handleSignOut = () => {
        Alert.alert(
            'Sair da Conta',
            'Tem certeza que deseja sair?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: signOut
                }
            ]
        );
    };

    return (
        <ScreenContainer style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Configurações</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>APARÊNCIA</Text>

                    <View style={styles.row}>
                        <View>
                            <Text style={styles.rowLabel}>Modo Escuro</Text>
                            <Text style={styles.rowSubLabel}>
                                {theme === 'dark' ? 'Ativado' : 'Desativado'}
                            </Text>
                        </View>
                        <Switch
                            value={theme === 'dark'}
                            onValueChange={toggleTheme}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={colors.white}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>NOTIFICAÇÕES</Text>

                    <View style={styles.row}>
                        <View>
                            <Text style={styles.rowLabel}>Notificações Push</Text>
                            <Text style={styles.rowSubLabel}>
                                Receber avisos e novidades
                            </Text>
                        </View>
                        <Switch
                            value={true}
                            onValueChange={() => Alert.alert('Em breve', 'Configuração de notificações virá na próxima atualização.')}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={colors.white}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>SOBRE</Text>

                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Versão</Text>
                        <Text style={styles.rowValue}>
                            {Constants.expoConfig?.version || '1.2.0'}
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.row} onPress={handleSignOut}>
                        <Text style={styles.signOutText}>Sair da Conta</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.footer}>
                    Itaipu Connect © 2024
                </Text>
            </ScrollView>
        </ScreenContainer>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.lg,
    },
    title: {
        fontSize: typography.sizes['3xl'],
        fontWeight: typography.weights.bold,
        color: colors.text,
        marginBottom: spacing.xl,
        marginTop: spacing.md,
    },
    section: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        borderColor: colors.border,
        borderWidth: 1,
        marginBottom: spacing.xl,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.bold,
        color: colors.textSecondary,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.xs,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomColor: colors.border,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    rowLabel: {
        fontSize: typography.sizes.md,
        fontWeight: typography.weights.medium,
        color: colors.text,
    },
    rowSubLabel: {
        fontSize: typography.sizes.xs,
        color: colors.textSecondary,
        marginTop: 2,
    },
    rowValue: {
        fontSize: typography.sizes.md,
        color: colors.textSecondary,
    },
    signOutText: {
        fontSize: typography.sizes.md,
        fontWeight: typography.weights.medium,
        color: colors.error,
    },
    footer: {
        textAlign: 'center',
        fontSize: typography.sizes.xs,
        color: colors.textMuted,
        marginTop: spacing.lg,
    },
});
