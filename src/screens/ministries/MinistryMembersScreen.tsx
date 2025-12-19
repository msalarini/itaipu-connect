import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Share } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, AppButton } from '../../components';
import { spacing, typography, borderRadius } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useMinistryMembers, useUpdateMemberRole, useRemoveMember } from '../../hooks/queries/useMinistries';

type MinistryMembersRouteProp = RouteProp<AppStackParamList, 'MinistryMembers'>;

interface Member {
    id: string; // This is the ministry_member id
    user_id: string;
    ministry_role: 'MEMBER' | 'LEADER';
    profile: {
        name: string;
        email: string;
    };
}

export const MinistryMembersScreen: React.FC = () => {
    const route = useRoute<MinistryMembersRouteProp>();
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const { ministryId, ministryName } = route.params;
    const { user, profile } = useAuth();
    const { colors } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const isPastor = profile?.global_role === 'PASTOR';

    const { data: members = [], isLoading: loading } = useMinistryMembers(ministryId);
    const updateRoleMutation = useUpdateMemberRole();
    const removeMemberMutation = useRemoveMember();

    const currentUserRole = React.useMemo(() => {
        const membership = members.find((m: any) => m.user_id === user?.id);
        return membership?.ministry_role || null;
    }, [members, user?.id]);

    const handleGenerateInvite = async () => {
        try {
            // Generate a random 6-char code
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();

            // Create invite in DB
            const { error } = await supabase.from('invites').insert({
                email: 'pending@invite', // Placeholder or optional in schema? Schema says email not null. Let's use a placeholder or change schema.
                // Wait, schema says email text not null. 
                // For a generic invite code, we might want to relax this or put a dummy email.
                // Let's check schema: "email text not null". 
                // Strategy: We'll ask the user for an email to invite, OR we modify schema to allow null email for generic codes.
                // For MVP, let's ask for email? Or just put "generic_invite" if we want a shareable code.
                // Let's assume we want a shareable code for now, so we'll put a placeholder email.
                code,
                global_role: 'MEMBER',
                ministries_default: [ministryId],
                created_by: user?.id,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h expiration
            });

            if (error) {
                Alert.alert('Erro ao gerar convite', error.message);
                return;
            }

            // Share the code
            Alert.alert(
                'Convite Gerado',
                `Código: ${code}\n\nEste código expira em 24 horas.`,
                [
                    {
                        text: 'Copiar/Compartilhar',
                        onPress: () => {
                            Share.share({
                                message: `Entre para o ministério ${ministryName} no Itaipu Connect usando o código: ${code}`,
                            });
                        },
                    },
                    { text: 'OK' },
                ]
            );

        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Falha ao gerar convite.');
        }
    };

    const handleMemberActions = (member: Member) => {
        // Don't allow actions on yourself
        if (member.user_id === user?.id) {
            Alert.alert('Ação não permitida', 'Você não pode modificar sua própria participação.');
            return;
        }

        // Only LEADER or PASTOR can manage members
        if (currentUserRole !== 'LEADER' && !isPastor) {
            return;
        }

        const actions: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [
            { text: 'Cancelar', style: 'cancel' },
        ];

        if (member.ministry_role === 'MEMBER') {
            actions.push({
                text: 'Promover para Líder',
                onPress: () => handleChangeRole(member, 'LEADER'),
            });
        } else {
            actions.push({
                text: 'Rebaixar para Membro',
                onPress: () => handleChangeRole(member, 'MEMBER'),
            });
        }

        actions.push({
            text: 'Remover do Ministério',
            style: 'destructive',
            onPress: () => handleRemoveMember(member),
        });

        Alert.alert(member.profile.name, 'O que deseja fazer?', actions);
    };

    const handleChangeRole = async (member: Member, newRole: 'MEMBER' | 'LEADER') => {
        try {
            await updateRoleMutation.mutateAsync({
                ministryId,
                userId: member.user_id,
                newRole
            });
            Alert.alert('Sucesso', `${member.profile.name} agora é ${newRole === 'LEADER' ? 'Líder' : 'Membro'}.`);
        } catch (error: any) {
            Alert.alert('Erro', error.message);
        }
    };

    const handleRemoveMember = (member: Member) => {
        Alert.alert(
            'Remover Membro',
            `Tem certeza que deseja remover ${member.profile.name} do ministério?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Remover',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeMemberMutation.mutateAsync({
                                ministryId,
                                userId: member.user_id
                            });
                            Alert.alert('Sucesso', `${member.profile.name} foi removido do ministério.`);
                        } catch (error: any) {
                            Alert.alert('Erro', error.message);
                        }
                    },
                },
            ]
        );
    };

    const canManageMembers = currentUserRole === 'LEADER' || isPastor;

    const renderMemberItem = ({ item }: { item: Member }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleMemberActions(item)}
            disabled={!canManageMembers}
            activeOpacity={canManageMembers ? 0.7 : 1}
        >
            <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{item.profile.name.substring(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.memberName}>
                    {item.profile.name}
                    {item.user_id === user?.id && ' (Você)'}
                </Text>
                <Text style={styles.memberRole}>{item.ministry_role === 'LEADER' ? 'Líder' : 'Membro'}</Text>
            </View>
            {canManageMembers && item.user_id !== user?.id && (
                <Text style={styles.actionHint}>⋮</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <ScreenContainer>
            <View style={styles.header}>
                <Text style={styles.title}>Membros</Text>
                <Text style={styles.subtitle}>{ministryName}</Text>
            </View>

            {(currentUserRole === 'LEADER' || isPastor) && (
                <View style={styles.actions}>
                    <AppButton
                        title="+ Adicionar Membro"
                        variant="primary"
                        onPress={() => navigation.navigate('AddMember', { ministryId, ministryName })}
                        style={styles.inviteButton}
                    />
                </View>
            )}

            {isPastor && (
                <View style={styles.actions}>
                    <AppButton
                        title="Editar Ministério"
                        variant="outline"
                        onPress={() => navigation.navigate('EditMinistry', { ministryId })}
                    />
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
            ) : (
                <FlatList
                    data={members}
                    renderItem={renderMemberItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Nenhum membro encontrado.</Text>
                        </View>
                    }
                />
            )}
        </ScreenContainer>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    header: {
        padding: spacing.lg,
        paddingBottom: spacing.sm,
    },
    title: {
        fontSize: typography.sizes['2xl'],
        fontWeight: typography.weights.bold,
        color: colors.text,
    },
    subtitle: {
        fontSize: typography.sizes.md,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    actions: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    inviteButton: {
        marginBottom: spacing.xs,
    },
    listContent: {
        padding: spacing.lg,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.full,
        backgroundColor: colors.primary + '20', // Light primary
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        color: colors.primary,
        fontWeight: typography.weights.bold,
        fontSize: typography.sizes.md,
    },
    cardContent: {
        flex: 1,
    },
    memberName: {
        fontSize: typography.sizes.md,
        fontWeight: typography.weights.semibold,
        color: colors.text,
    },
    memberRole: {
        fontSize: typography.sizes.xs,
        color: colors.textMuted,
        marginTop: 2,
    },
    emptyContainer: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        color: colors.textMuted,
        textAlign: 'center',
        fontSize: typography.sizes.md,
    },
    actionHint: {
        fontSize: 20,
        color: colors.textMuted,
        marginLeft: spacing.sm,
    },
});
