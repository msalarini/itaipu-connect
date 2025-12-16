import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { ScreenContainer, AppButton } from '../../components';
import { spacing, typography, borderRadius } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../services/supabaseClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { useEvents } from '../../hooks/queries/useEvents';
import { Event } from '../../types';

export const EventsScreen: React.FC = () => {
    const { profile } = useAuth();
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const { colors } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const [eventsState, setEventsState] = useState<Event[]>([]); // Keep local state if needed for strict type matching, or rely on hook
    const { data: events = [], isLoading: loading } = useEvents();

    // Check permissions: PASTOR can create global events, LEADER can create ministry events
    const canCreate = profile?.global_role === 'PASTOR' || profile?.global_role === 'LEADER';

    const renderEventItem = ({ item }: { item: Event }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('EventDetails', { event: item })}
            activeOpacity={0.7}
        >
            <View style={styles.dateBadge}>
                <Text style={styles.dateDay}>{format(new Date(item.event_date), 'dd', { locale: ptBR })}</Text>
                <Text style={styles.dateMonth}>{format(new Date(item.event_date), 'MMM', { locale: ptBR }).toUpperCase()}</Text>
            </View>

            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardInfo}>
                    🕒 {format(new Date(item.event_date), 'HH:mm', { locale: ptBR })}
                </Text>
                <Text style={styles.cardInfo}>📍 {item.location}</Text>
                {item.ministry && (
                    <Text style={styles.ministryBadge}>{item.ministry.name}</Text>
                )}
                {item.description && (
                    <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenContainer>
            <View style={styles.header}>
                <Text style={styles.title}>Próximos Eventos</Text>
                {canCreate && (
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => navigation.navigate('CreateEvent' as any)} // We'll create this screen next
                    >
                        <Text style={styles.createButtonText}>+ Novo</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
            ) : (
                <FlatList
                    data={events}
                    renderItem={renderEventItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Nenhum evento agendado.</Text>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: typography.sizes['3xl'],
        fontWeight: typography.weights.bold,
        color: colors.text,
    },
    createButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    createButtonText: {
        color: colors.white,
        fontWeight: typography.weights.bold,
        fontSize: typography.sizes.sm,
    },
    listContent: {
        padding: spacing.lg,
    },
    card: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
    },
    dateBadge: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
        minWidth: 60,
        height: 70,
        borderWidth: 1,
        borderColor: colors.border,
    },
    dateDay: {
        fontSize: typography.sizes['2xl'],
        fontWeight: typography.weights.bold,
        color: colors.primary,
    },
    dateMonth: {
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.bold,
        color: colors.textSecondary,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.semibold,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    cardInfo: {
        fontSize: typography.sizes.sm,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    ministryBadge: {
        fontSize: typography.sizes.xs,
        color: colors.primary,
        fontWeight: typography.weights.medium,
        marginTop: spacing.xs,
        marginBottom: spacing.xs,
    },
    cardDescription: {
        fontSize: typography.sizes.sm,
        color: colors.textMuted,
        marginTop: spacing.xs,
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
