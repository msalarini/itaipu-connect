import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ScreenContainer, AppInput, AppButton } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';

export const ProfileScreen: React.FC = () => {
    const { user, profile, refreshProfile, signOut } = useAuth();

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
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                        {profile?.name?.substring(0, 2).toUpperCase() || 'US'}
                    </Text>
                </View>
                <Text style={styles.email}>{profile?.email}</Text>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{profile?.global_role || 'MEMBER'}</Text>
                </View>
            </View>

            <View style={styles.form}>
                <Text style={styles.sectionTitle}>Editar Informações</Text>

                <AppInput
                    label="Nome Completo"
                    value={name}
                    onChangeText={setName}
                    placeholder="Seu nome"
                />

                <AppInput
                    label="Telefone (WhatsApp)"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="(00) 00000-0000"
                    keyboardType="phone-pad"
                />

                <AppInput
                    label="Bio / Sobre mim"
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Conte um pouco sobre você..."
                    multiline
                    numberOfLines={3}
                />

                <AppButton
                    title="Salvar Alterações"
                    variant="primary"
                    onPress={handleSave}
                    loading={saving}
                    style={styles.saveButton}
                />

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Configurações</Text>

                {/* Placeholder for Notification Settings */}
                <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Em breve', 'Configurações de notificação virão na próxima atualização.')}>
                    <Text style={styles.settingLabel}>Notificações Push</Text>
                    <Text style={styles.settingValue}>Ativado</Text>
                </TouchableOpacity>

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
    email: {
        fontSize: typography.sizes.md,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    roleBadge: {
        backgroundColor: colors.backgroundCard,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
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
