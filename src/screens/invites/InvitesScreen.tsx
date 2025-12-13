import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components';

import { spacing, typography, borderRadius } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { AppStackParamList } from '../../navigation/AppNavigator';
import {
    Invite,
    listInvites,
    deleteInvite,
    getInviteStatus,
    getTimeUntilExpiration
} from '../../services/inviteService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'Invites'>;

export const InvitesScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { colors } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchInvites = useCallback(async () => {
        try {
            const data = await listInvites();
            setInvites(data);
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível carregar os convites.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchInvites();
    }, [fetchInvites]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchInvites();
        });
        return unsubscribe;
    }, [navigation, fetchInvites]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchInvites();
    };

    const handleCopyCode = async (code: string) => {
        await Clipboard.setStringAsync(code);
        Alert.alert('Copiado!', `Código ${code} copiado para a área de transferência.`);
    };

    const handleDelete = (invite: Invite) => {
        const status = getInviteStatus(invite);
        if (status === 'used') {
            Alert.alert('Não permitido', 'Não é possível excluir um convite já utilizado.');
            return;
        }

        Alert.alert(
            'Excluir Convite',
            `Tem certeza que deseja excluir o convite para ${invite.email}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteInvite(invite.id);
                            setInvites(prev => prev.filter(i => i.id !== invite.id));
                            Alert.alert('Sucesso', 'Convite excluído com sucesso.');
                        } catch (error: any) {
                            Alert.alert('Erro', error.message || 'Não foi possível excluir o convite.');
                        }
                    },
                },
            ]
        );
    };

    const getStatusColor = (status: 'active' | 'used' | 'expired') => {
        switch (status) {
            case 'active':
                return colors.success || '#10B981'; // Fallback if success not in theme
            case 'used':
                return colors.primary;
            case 'expired':
                return colors.error;
        }
    };

    const getStatusLabel = (status: 'active' | 'used' | 'expired') => {
        switch (status) {
            case 'active':
                return 'Ativo';
            case 'used':
                return 'Usado';
            case 'expired':
                return 'Expirado';
        }
    };

    const renderInviteItem = ({ item }: { item: Invite }) => {
        const status = getInviteStatus(item);
        const statusColor = getStatusColor(status);
        const statusLabel = getStatusLabel(status);

        return (
            <View style={styles.inviteCard}>
                <View style={styles.inviteHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusText}>{statusLabel}</Text>
                    </View>
                    <Text style={styles.inviteRole}>{item.global_role}</Text>
                </View>

                <Text style={styles.inviteEmail}>{item.email}</Text>

                <TouchableOpacity
                    style={styles.codeContainer}
                    onPress={() => handleCopyCode(item.code)}
                    disabled={status !== 'active'}
                >
                    <Text style={styles.codeLabel}>Código:</Text>
                    <Text style={styles.codeValue}>{item.code}</Text>
                    {status === 'active' && <Text style={styles.copyHint}>📋 Tocar para copiar</Text>}
                </TouchableOpacity>

                <View style={styles.inviteFooter}>
                    <Text style={styles.footerText}>
                        Criado em {format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </Text>
                    {status === 'active' && (
                        <Text style={styles.footerText}>
                            Expira em {getTimeUntilExpiration(item.expires_at)}
                        </Text>
                    )}
                    {status === 'used' && item.used_at && (
                        <Text style={styles.footerText}>
                            Usado em {format(new Date(item.used_at), "dd/MM/yyyy", { locale: ptBR })}
                        </Text>
                    )}
                </View>

                {status !== 'used' && (
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(item)}
                    >
                        <Text style={styles.deleteText}>Excluir</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📨</Text>
            <Text style={styles.emptyTitle}>Nenhum convite criado</Text>
            <Text style={styles.emptySubtitle}>
                Crie convites para que novos membros possam se cadastrar no app.
            </Text>
        </View>
    );

    return (
        <ScreenContainer>
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : (
                <FlatList
                    data={invites}
                    renderItem={renderInviteItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyList}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                        />
                    }
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateInvite')}
                accessibilityLabel="Criar novo convite"
                accessibilityRole="button"
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
        </ScreenContainer>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    loader: {
        flex: 1,
        justifyContent: 'center',
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: 100,
    },
    inviteCard: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    inviteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    statusText: {
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.bold,
        color: colors.white,
    },
    inviteRole: {
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.medium,
        color: colors.textSecondary,
        backgroundColor: colors.background,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    inviteEmail: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.medium,
        color: colors.text,
        marginBottom: spacing.md,
    },
    codeContainer: {
        backgroundColor: colors.background,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    codeLabel: {
        fontSize: typography.sizes.xs,
        color: colors.textMuted,
        marginBottom: spacing.xs,
    },
    codeValue: {
        fontSize: typography.sizes['2xl'],
        fontWeight: typography.weights.bold,
        color: colors.primary,
        letterSpacing: 4,
    },
    copyHint: {
        fontSize: typography.sizes.xs,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    inviteFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: {
        fontSize: typography.sizes.xs,
        color: colors.textMuted,
    },
    deleteButton: {
        marginTop: spacing.md,
        paddingVertical: spacing.sm,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    deleteText: {
        fontSize: typography.sizes.sm,
        color: colors.error,
        fontWeight: typography.weights.medium,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing['2xl'],
        marginTop: spacing['3xl'],
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold,
        color: colors.text,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: typography.sizes.md,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: spacing.xl,
        right: spacing.xl,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    fabIcon: {
        fontSize: 32,
        color: colors.white,
        fontWeight: typography.weights.bold,
        marginTop: -2,
    },
});
