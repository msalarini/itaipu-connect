import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScreenContainer, AppButton } from '../../components';
import { spacing, typography, borderRadius } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import { EventRSVP } from '../../types';
import { useEventAttendees, useUserRSVP, useRSVPMutation } from '../../hooks/queries/useEvents';

type EventDetailsRouteProp = RouteProp<AppStackParamList, 'EventDetails'>;

export const EventDetailsScreen: React.FC = () => {
    const route = useRoute<EventDetailsRouteProp>();
    const navigation = useNavigation();
    const { event } = route.params;
    const { user } = useAuth();
    const { colors } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const { data: attendees = [], isLoading: loadingAttendees } = useEventAttendees(event.id);
    const { data: rsvpData, isLoading: loadingRSVP } = useUserRSVP(event.id, user?.id);
    const rsvpMutation = useRSVPMutation();

    const myRSVP = rsvpData?.status;
    const isProcessing = rsvpMutation.isPending;
    const isLoading = loadingAttendees || loadingRSVP;

    const handleRSVP = (status: 'CONFIRMED' | 'DECLINED') => {
        if (!user || myRSVP === status) return;

        rsvpMutation.mutate(
            { eventId: event.id, userId: user.id, status },
            {
                onSuccess: () => {
                    if (status === 'CONFIRMED') {
                        Alert.alert('Presença Confirmada!', 'Te esperamos lá! 🎉');
                    }
                },
                onError: (error: any) => {
                    Alert.alert('Erro', 'Falha ao atualizar presença: ' + error.message);
                }
            }
        );
    };

    const isConfirmed = myRSVP === 'CONFIRMED';
    const isDeclined = myRSVP === 'DECLINED';

    const eventDate = new Date(event.event_date);

    return (
        <ScreenContainer>
            <ScrollView contentContainerStyle={styles.content}>

                {/* Header Image / Date Badge Area */}
                <View style={styles.headerArea}>
                    <View style={styles.dateBadgeLarge}>
                        <Text style={styles.dateDay}>{format(eventDate, 'dd', { locale: ptBR })}</Text>
                        <Text style={styles.dateMonth}>{format(eventDate, 'MMMM', { locale: ptBR }).toUpperCase()}</Text>
                    </View>
                    <View style={styles.titleArea}>
                        <Text style={styles.title}>{event.title}</Text>
                        {event.ministry && (
                            <Text style={styles.ministryTag}>{event.ministry.name}</Text>
                        )}
                    </View>
                </View>

                {/* Info Cards */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>🕒</Text>
                        <View>
                            <Text style={styles.infoLabel}>Horário</Text>
                            <Text style={styles.infoValue}>
                                {format(eventDate, "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.infoIcon}>📍</Text>
                        <View>
                            <Text style={styles.infoLabel}>Local</Text>
                            <Text style={styles.infoValue}>{event.location}</Text>
                        </View>
                    </View>
                </View>

                {/* Description */}
                {event.description && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Sobre o evento</Text>
                        <Text style={styles.description}>{event.description}</Text>
                    </View>
                )}

                {/* RSVP Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sua Presença</Text>
                    <View style={styles.rsvpButtons}>
                        <AppButton
                            title={isConfirmed ? "✅ Confirmado" : "Eu vou!"}
                            variant={isConfirmed ? "primary" : "outline"}
                            onPress={() => handleRSVP('CONFIRMED')}
                            loading={isProcessing && !isDeclined}
                            disabled={isProcessing}
                            style={styles.rsvpButton}
                        />
                        <AppButton
                            title={isDeclined ? "❌ Não vou" : "Não vou"}
                            variant={isDeclined ? "secondary" : "outline"}
                            onPress={() => handleRSVP('DECLINED')}
                            loading={isProcessing && isDeclined}
                            disabled={isProcessing}
                            style={[styles.rsvpButton, isDeclined && { backgroundColor: colors.backgroundHover }]}
                            textStyle={isDeclined ? { color: colors.textMuted } : undefined}
                        />
                    </View>
                </View>

                {/* Attendees List */}
                <View style={styles.section}>
                    <View style={styles.attendeesHeader}>
                        <Text style={styles.sectionTitle}>Quem vai?</Text>
                        <Text style={styles.attendeeCount}>
                            {attendees.length} confirmados
                        </Text>
                    </View>

                    {isLoading ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : attendees.length === 0 ? (
                        <Text style={styles.emptyText}>Seja o primeiro a confirmar!</Text>
                    ) : (
                        <View style={styles.attendeesList}>
                            {attendees.map(attendee => (
                                <View key={attendee.id} style={styles.attendeeItem}>
                                    <View style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarText}>
                                            {attendee.profile?.name?.substring(0, 2).toUpperCase() ?? '??'}
                                        </Text>
                                    </View>
                                    <Text style={styles.attendeeName} numberOfLines={1}>
                                        {attendee.user_id === user?.id ? 'Você' : attendee.profile?.name}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

            </ScrollView>
        </ScreenContainer>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    content: {
        padding: spacing.lg,
        paddingBottom: spacing['4xl'],
    },
    headerArea: {
        flexDirection: 'row',
        marginBottom: spacing.xl,
        alignItems: 'center',
    },
    dateBadgeLarge: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.primary,
        minWidth: 80,
        height: 90,
        marginRight: spacing.lg,
    },
    dateDay: {
        fontSize: typography.sizes['3xl'],
        fontWeight: typography.weights.bold,
        color: colors.primary,
    },
    dateMonth: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.bold,
        color: colors.textSecondary,
    },
    titleArea: {
        flex: 1,
    },
    title: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold,
        color: colors.text,
        marginBottom: spacing.xs,
        lineHeight: 28,
    },
    ministryTag: {
        fontSize: typography.sizes.sm,
        color: colors.primary,
        fontWeight: typography.weights.medium,
        backgroundColor: colors.primary + '20', // Light primary
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    infoCard: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoIcon: {
        fontSize: 20,
        marginRight: spacing.md,
        marginTop: 2,
        color: colors.text,
    },
    infoLabel: {
        fontSize: typography.sizes.xs,
        color: colors.textSecondary,
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: typography.sizes.md,
        color: colors.text,
        fontWeight: typography.weights.medium,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.md,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.bold,
        color: colors.text,
        marginBottom: spacing.md,
    },
    description: {
        fontSize: typography.sizes.md,
        color: colors.textSecondary,
        lineHeight: 24,
    },
    rsvpButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    rsvpButton: {
        flex: 1,
    },
    attendeesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: spacing.md,
    },
    attendeeCount: {
        fontSize: typography.sizes.sm,
        color: colors.textMuted,
    },
    attendeesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    attendeeItem: {
        alignItems: 'center',
        width: 60,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.full,
        backgroundColor: colors.backgroundCard,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xs,
        borderWidth: 1,
        borderColor: colors.border,
    },
    avatarText: {
        fontSize: typography.sizes.md,
        fontWeight: typography.weights.bold,
        color: colors.textSecondary,
    },
    attendeeName: {
        fontSize: typography.sizes.xs,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: typography.sizes.md,
        color: colors.textMuted,
        fontStyle: 'italic',
    },
});
