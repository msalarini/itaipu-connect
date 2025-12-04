import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Share } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { ScreenContainer, AppButton } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
    const { user } = useAuth();

    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState<'MEMBER' | 'LEADER' | null>(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('ministry_members')
                .select(`
          id,
          user_id,
          ministry_role,
          profile:profiles (
            name,
            email
          )
        `)
                .eq('ministry_id', ministryId)
                .order('ministry_role', { ascending: true }); // LEADER comes before MEMBER alphabetically? No, L < M. So Leader first.

            if (error) {
                console.error('Error fetching members:', error);
            } else {
                setMembers(data as any);

                // Determine current user's role in this ministry
                const myMembership = data.find((m: any) => m.user_id === user?.id);
                if (myMembership) {
                    setCurrentUserRole(myMembership.ministry_role);
                }
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const renderMemberItem = ({ item }: { item: Member }) => (
        <View style={styles.card}>
            <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{item.profile.name.substring(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.memberName}>{item.profile.name}</Text>
                <Text style={styles.memberRole}>{item.ministry_role === 'LEADER' ? 'Líder' : 'Membro'}</Text>
            </View>
        </View>
    );

    return (
        <ScreenContainer>
            <View style={styles.header}>
                <Text style={styles.title}>Membros</Text>
                <Text style={styles.subtitle}>{ministryName}</Text>
            </View>

            {currentUserRole === 'LEADER' && (
                <View style={styles.actions}>
                    <AppButton
                        title="+ Convidar Membro"
                        variant="primary"
                        onPress={handleGenerateInvite}
                        style={styles.inviteButton}
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

const styles = StyleSheet.create({
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
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        color: colors.white,
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
});
