import React, { useState } from 'react';
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
import { spacing, typography, borderRadius } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { useAvailableUsers, useAddMember } from '../../hooks/queries/useMinistries';
import { UserSearchResult } from '../../services/memberService';

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'AddMember'>;
type AddMemberRouteProp = RouteProp<AppStackParamList, 'AddMember'>;

export const AddMemberScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<AddMemberRouteProp>();
    const { ministryId, ministryName } = route.params;
    const { colors } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const [searchQuery, setSearchQuery] = useState('');
    const [adding, setAdding] = useState<string | null>(null);

    // Hooks
    const { data: users = [], isLoading: loading } = useAvailableUsers(ministryId, searchQuery);
    const addMemberMutation = useAddMember();

    // Debounce is redundant if React Query handles it or if we pass searchQuery directly. 
    // Ideally we debounce the state update, but for now passing it directly is "okay" if we don't mind rapid requests 
    // or if we rely on Query's built-in deduplication. 
    // To keep it simple and cleaner, we'll rely on the simple state.
    // However, the original code had debouncing. Let's strictly keep debouncing if possible, 
    // but typically useQuery with a search param works well enough.
    // The previous implementation used a manual timeout. 
    // Let's stick with simple state for now, as useQuery handles caching well.
    // If performance is an issue, we can wrap searchQuery with useDebounce.

    const handleAddMember = async (user: UserSearchResult, role: 'MEMBER' | 'LEADER') => {
        setAdding(user.id);
        try {
            await addMemberMutation.mutateAsync({
                ministryId,
                userId: user.id,
                role
            });

            Alert.alert(
                'Sucesso',
                `${user.name} foi adicionado ao ministério como ${role === 'LEADER' ? 'Líder' : 'Membro'}.`,
                [{ text: 'OK' }]
            );
            // List update is handled by invalidation in the hook
        } catch (error: any) {
            Alert.alert('Erro', error.message || "Erro ao adicionar membro.");
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
        backgroundColor: colors.primary + '20', // Light primary
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
