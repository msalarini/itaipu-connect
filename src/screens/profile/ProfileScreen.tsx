import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, AppInput, AppButton } from '../../components';
import { spacing, typography, borderRadius } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { useProfile } from '../../hooks/queries/useProfile';

type ProfileNavigationProp = NativeStackNavigationProp<AppStackParamList>;

export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<ProfileNavigationProp>();
    const { user, profile, refreshProfile, signOut } = useAuth();

    const { data: userProfile, isLoading } = useProfile(user?.id);
    const displayProfile = userProfile || profile;

    const isPastor = displayProfile?.global_role === 'PASTOR';

    const { colors } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const handleSignOut = async () => {
        Alert.alert(
            'Sair',
            'Tem certeza que deseja sair?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                    }
                },
            ]
        );
    };

    return (
        <ScreenContainer scrollable>
            <View style={styles.header}>
                <View style={[styles.avatarPlaceholder, displayProfile?.avatar_url && styles.avatarImage]}>
                    {displayProfile?.avatar_url ? (
                        <Image
                            source={{ uri: displayProfile.avatar_url }}
                            style={styles.avatar}
                        />
                    ) : (
                        <Text style={styles.avatarText}>
                            {displayProfile?.name?.substring(0, 2).toUpperCase() || 'US'}
                        </Text>
                    )}
                </View>
                <Text style={styles.name}>{displayProfile?.name}</Text>
                <Text style={styles.email}>{displayProfile?.email}</Text>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{displayProfile?.global_role || 'MEMBER'}</Text>
                </View>
            </View>

            <View style={styles.form}>
                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Telefone</Text>
                        <Text style={styles.infoValue}>{displayProfile?.phone || 'Não informado'}</Text>
                    </View>
                    <View style={styles.dividerLight} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Bio</Text>
                        <Text style={styles.infoValue}>{displayProfile?.bio || 'Sem biografia'}</Text>
                    </View>
                </View>

                <AppButton
                    title="Editar Perfil"
                    variant="outline"
                    onPress={() => navigation.navigate('EditProfile')}
                    style={styles.editButton}
                />

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Configurações</Text>

                <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Settings')}>
                    <Text style={styles.settingLabel}>Configurações do App</Text>
                    <Text style={styles.settingValue}>→</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                {isPastor && (
                    <>
                        <Text style={styles.sectionTitle}>Administração</Text>
                        <TouchableOpacity
                            style={styles.settingItem}
                            onPress={() => navigation.navigate('Invites')}
                        >
                            <Text style={styles.settingLabel}>Gerenciar Convites</Text>
                            <Text style={styles.settingValue}>→</Text>
                        </TouchableOpacity>
                    </>
                )}

                <View style={styles.divider} />

                <AppButton
                    title="Sair da Conta"
                    variant="outline"
                    onPress={handleSignOut}
                    style={styles.logoutButton}
                    textStyle={{ color: colors.error }}
                />

                <Text style={styles.version}>Versão 1.0.0 (MVP)</Text>
            </View>
        </ScreenContainer>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    header: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        marginBottom: spacing.md,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: borderRadius.full,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        borderWidth: 4,
        borderColor: colors.backgroundCard,
    },
    avatarText: {
        fontSize: typography.sizes['4xl'],
        fontWeight: typography.weights.bold,
        color: colors.white,
    },
    avatarImage: {
        borderWidth: 2,
        borderColor: colors.primary,
        overflow: 'hidden',
        padding: 0,
        backgroundColor: colors.background,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    name: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold,
        color: colors.text,
        marginBottom: 2,
    },
    email: {
        fontSize: typography.sizes.sm,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    roleBadge: {
        backgroundColor: colors.backgroundCard,
        paddingHorizontal: spacing.md,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border,
    },
    roleText: {
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.bold,
        color: colors.primary,
    },
    form: {
        padding: spacing.lg,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.xl,
    },
    infoSection: {
        marginBottom: spacing.lg,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    infoLabel: {
        fontSize: typography.sizes.sm,
        color: colors.textSecondary,
    },
    infoValue: {
        fontSize: typography.sizes.md,
        color: colors.text,
        fontWeight: typography.weights.medium,
        maxWidth: '70%',
        textAlign: 'right',
    },
    dividerLight: {
        height: 1,
        backgroundColor: colors.backgroundHover,
        marginVertical: spacing.xs,
    },
    editButton: {
        marginTop: spacing.xs,
    },
    sectionTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.bold,
        color: colors.text,
        marginBottom: spacing.md,
    },
    saveButton: {
        marginTop: spacing.md,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.xl,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    settingLabel: {
        fontSize: typography.sizes.md,
        color: colors.text,
    },
    settingValue: {
        fontSize: typography.sizes.sm,
        color: colors.primary,
        fontWeight: typography.weights.medium,
    },
    logoutButton: {
        borderColor: colors.error,
    },
    version: {
        textAlign: 'center',
        marginTop: spacing.xl,
        color: colors.textMuted,
        fontSize: typography.sizes.xs,
    },
});
