import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, AppInput, AppButton } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { getUsersNotInMinistry, addMemberToMinistry, UserSearchResult } from '../../services/memberService';

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'AddMember'>;
type AddMemberRouteProp = RouteProp<AppStackParamList, 'AddMember'>;

export const AddMemberScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<AddMemberRouteProp>();
    const { ministryId, ministryName } = route.params;

    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<UserSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState<string | null>(null);

    const fetchUsers = useCallback(async (query: string = '') => {
        setLoading(true);
        try {
            const data = await getUsersNotInMinistry(ministryId, query);
            setUsers(data);
        } catch (error: any) {
            Alert.alert('Erro', error.message);
        } finally {
            setLoading(false);
        }
    }, [ministryId]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchUsers(searchQuery);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, fetchUsers]);

    const handleAddMember = async (user: UserSearchResult, role: 'MEMBER' | 'LEADER') => {
        setAdding(user.id);
        try {
            await addMemberToMinistry(ministryId, user.id, role);
            Alert.alert(
                'Sucesso',
                `${user.name} foi adicionado ao ministério como ${role === 'LEADER' ? 'Líder' : 'Membro'}.`,
                [{ text: 'OK' }]
            );
            // Remove from list
            setUsers(prev => prev.filter(u => u.id !== user.id));
        } catch (error: any) {
            Alert.alert('Erro', error.message);
        } finally {
            setAdding(null);
        }
    };

    const showAddOptions = (user: UserSearchResult) => {
        Alert.alert(
            `Adicionar ${user.name}`,
            'Como qual função?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Como Membro', onPress: () => handleAddMember(user, 'MEMBER') },
                { text: 'Como Líder', onPress: () => handleAddMember(user, 'LEADER') },
            ]
        );
    };

    const renderUserItem = ({ item }: { item: UserSearchResult }) => (
        <TouchableOpacity
            style={styles.userCard}
            onPress={() => showAddOptions(item)}
            disabled={adding === item.id}
        >
            <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{item.name.substring(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
            </View>
            {adding === item.id ? (
                <ActivityIndicator size="small" color={colors.primary} />
            ) : (
                <Text style={styles.addIcon}>+</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <ScreenContainer>
            <View style={styles.header}>
                <Text style={styles.subtitle}>Adicionar membro ao</Text>
                <Text style={styles.title}>{ministryName}</Text>
            </View>

            <View style={styles.searchContainer}>
                <AppInput
                    placeholder="Buscar por nome ou email..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading && users.length === 0 ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderUserItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>👥</Text>
                            <Text style={styles.emptyTitle}>
                                {searchQuery ? 'Nenhum usuário encontrado' : 'Todos já são membros'}
                            </Text>
                            <Text style={styles.emptyText}>
                                {searchQuery
                                    ? 'Tente buscar por outro nome ou email.'
                                    : 'Não há mais usuários para adicionar a este ministério.'}
                            </Text>
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
        fontSize: typography.sizes.sm,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    searchContainer: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    loader: {
        marginTop: spacing.xl,
    },
    listContent: {
        padding: spacing.lg,
        paddingTop: 0,
    },
    userCard: {
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
        width: 44,
        height: 44,
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
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: typography.sizes.md,
        fontWeight: typography.weights.semibold,
        color: colors.text,
    },
    userEmail: {
        fontSize: typography.sizes.sm,
        color: colors.textMuted,
        marginTop: 2,
    },
    addIcon: {
        fontSize: 24,
        color: colors.primary,
        fontWeight: typography.weights.bold,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: spacing.xl,
        marginTop: spacing.xl,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.bold,
        color: colors.text,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: typography.sizes.md,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
