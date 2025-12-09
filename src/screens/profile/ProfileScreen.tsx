import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, AppInput, AppButton } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { AppStackParamList } from '../../navigation/AppNavigator';

type ProfileNavigationProp = NativeStackNavigationProp<AppStackParamList, 'MainTabs'>;

export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<ProfileNavigationProp>();
    const { user, profile, refreshProfile, signOut } = useAuth();

    const isPastor = profile?.global_role === 'PASTOR';

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setName(profile.name || '');
            setPhone(profile.phone || '');
            setBio(profile.bio || '');
        }
    }, [profile]);

    const handleSave = async () => {
        if (!user) return;
        if (!name.trim()) {
            Alert.alert('Erro', 'O nome é obrigatório.');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name,
                    phone,
                    bio,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) {
                Alert.alert('Erro ao atualizar', error.message);
            } else {
                await refreshProfile();
                Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Ocorreu um erro inesperado.');
        } finally {
            setSaving(false);
        }
    };

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
                <View style={[styles.avatarPlaceholder, profile?.avatar_url && styles.avatarImage]}>
                    {profile?.avatar_url ? (
                        <Image
                            source={{ uri: profile.avatar_url }}
                            style={styles.avatar}
                        />
                    ) : (
                        <Text style={styles.avatarText}>
                            {profile?.name?.substring(0, 2).toUpperCase() || 'US'}
                        </Text>
                    )}
                </View>
                <Text style={styles.name}>{profile?.name}</Text>
                <Text style={styles.email}>{profile?.email}</Text>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{profile?.global_role || 'MEMBER'}</Text>
                </View>
            </View>

            <View style={styles.form}>
                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Telefone</Text>
                        <Text style={styles.infoValue}>{profile?.phone || 'Não informado'}</Text>
                    </View>
                    <View style={styles.dividerLight} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Bio</Text>
                        <Text style={styles.infoValue}>{profile?.bio || 'Sem biografia'}</Text>
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

                {/* Placeholder for Notification Settings */}
                <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Em breve', 'Configurações de notificação virão na próxima atualização.')}>
                    <Text style={styles.settingLabel}>Notificações Push</Text>
                    <Text style={styles.settingValue}>Ativado</Text>
                </TouchableOpacity>

                {isPastor && (
                    <>
                        <View style={styles.divider} />
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

const styles = StyleSheet.create({
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
