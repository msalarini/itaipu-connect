import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components';
import { spacing, typography, borderRadius } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { useMinistries } from '../../hooks/queries/useMinistries';
import { Ministry } from '../../types';
import { MinistryCard } from '../../components/MinistryCard';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export const MinistriesListScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { profile } = useAuth();
    const { colors } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const { data: ministries = [], isLoading: loading, refetch, isRefetching } = useMinistries();

    const isPastor = profile?.global_role === 'PASTOR';

    const handleRefresh = () => {
        refetch();
    };


    const handleMinistryPress = (ministry: Ministry) => {
        navigation.navigate('MinistryChannel', {
            ministryId: ministry.id,
            ministryName: ministry.name,
        });
    };


    const renderMinistryItem = ({ item }: { item: Ministry }) => (
        <MinistryCard
            ministry={item}
            onPress={handleMinistryPress}
            colors={colors}
        />
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
                            refreshing={isRefetching}
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

const getStyles = (colors: any) => StyleSheet.create({
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

