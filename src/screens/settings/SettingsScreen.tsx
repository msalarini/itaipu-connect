import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ScreenContainer } from '../../components';
import { spacing, typography, borderRadius } from '../../theme';
import Constants from 'expo-constants';
import { Linking } from 'react-native';
import { useUpdateProfile, useDeleteAccount } from '../../hooks/queries/useProfile';

export const SettingsScreen: React.FC = () => {
    const { theme, toggleTheme, colors } = useTheme();
    const { signOut, user, profile, refreshProfile } = useAuth();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const updateProfileMutation = useUpdateProfile();

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

    const handlePushNotificationToggle = async (value: boolean) => {
        if (!user || !profile) return;

        try {
            const updatedPreferences = {
                ...profile.preferences,
                push_notifications: value
            };

            await updateProfileMutation.mutateAsync({
                userId: user.id,
                updates: { preferences: updatedPreferences }
            });

            if (refreshProfile) await refreshProfile();
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível atualizar as preferências.');
            console.error(error);
        }
    };

    const deleteAccountMutation = useDeleteAccount();

    const handleDeleteAccount = () => {
        Alert.alert(
            'Excluir Conta',
            'Tem certeza absoluta? Esta ação é irreversível e excluirá todos os seus dados.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir Minha Conta',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAccountMutation.mutateAsync();
                            signOut();
                        } catch (error: any) {
                            Alert.alert('Erro', error.message || 'Falha ao excluir conta.');
                        }
                    }
                }
            ]
        );
    };

    const openLegalUrl = (url: string) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
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
                            value={profile?.preferences?.push_notifications ?? true}
                            onValueChange={handlePushNotificationToggle}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={colors.white}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>LEGAL</Text>

                    <TouchableOpacity style={styles.row} onPress={() => openLegalUrl('https://example.com/terms')}>
                        <Text style={styles.rowLabel}>Termos de Uso</Text>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.row} onPress={() => openLegalUrl('https://example.com/privacy')}>
                        <Text style={styles.rowLabel}>Política de Privacidade</Text>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
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

                <View style={[styles.section, { borderColor: colors.error }]}>
                    <Text style={[styles.sectionTitle, { color: colors.error }]}>ZONA DE PERIGO</Text>
                    <TouchableOpacity style={styles.row} onPress={handleDeleteAccount}>
                        <Text style={{ ...styles.rowLabel, color: colors.error }}>Excluir Conta</Text>
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
    chevron: {
        fontSize: 20,
        color: colors.textMuted,
    },
});
