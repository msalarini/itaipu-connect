import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { AppStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

interface Ministry {
    id: string;
    name: string;
    description: string;
}

export const MinistriesListScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { profile } = useAuth();
    const [ministries, setMinistries] = useState<Ministry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const isPastor = profile?.global_role === 'PASTOR';

    const fetchMinistries = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('ministries')
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                console.error('Error fetching ministries:', error);
            } else {
                setMinistries(data);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchMinistries();
    }, [fetchMinistries]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchMinistries();
        });
        return unsubscribe;
    }, [navigation, fetchMinistries]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchMinistries();
    };

    const handleMinistryPress = (ministry: Ministry) => {
        navigation.navigate('MinistryChannel', {
            ministryId: ministry.id,
            ministryName: ministry.name,
        });
    };

    const renderMinistryItem = ({ item }: { item: Ministry }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleMinistryPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{item.name.substring(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardDescription} numberOfLines={2}>
                        {item.description || 'Sem descrição'}
                    </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenContainer>
            <View style={styles.header}>
                <Text style={styles.title}>Ministérios</Text>
                <Text style={styles.subtitle}>Conheça os ministérios da nossa igreja</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
            ) : (
                <FlatList
                    data={ministries}
                    renderItem={renderMinistryItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>⛪</Text>
                            <Text style={styles.emptyTitle}>Nenhum ministério</Text>
                            <Text style={styles.emptyText}>
                                {isPastor
                                    ? 'Crie o primeiro ministério tocando no botão +'
                                    : 'Ainda não há ministérios cadastrados.'}
                            </Text>
                        </View>
                    }
                />
            )}

            {isPastor && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => navigation.navigate('CreateMinistry')}
                    accessibilityLabel="Criar novo ministério"
                    accessibilityRole="button"
                >
                    <Text style={styles.fabIcon}>+</Text>
                </TouchableOpacity>
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
        fontSize: typography.sizes['3xl'],
        fontWeight: typography.weights.bold,
        color: colors.text,
    },
    subtitle: {
        fontSize: typography.sizes.md,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    listContent: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.full,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        color: colors.white,
        fontWeight: typography.weights.bold,
        fontSize: typography.sizes.lg,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.semibold,
        color: colors.text,
    },
    cardDescription: {
        fontSize: typography.sizes.sm,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    chevron: {
        fontSize: 24,
        color: colors.textMuted,
        marginLeft: spacing.sm,
    },
    emptyContainer: {
        padding: spacing.xl,
        alignItems: 'center',
        marginTop: spacing.xl,
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
    },
    emptyText: {
        color: colors.textMuted,
        textAlign: 'center',
        fontSize: typography.sizes.md,
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

