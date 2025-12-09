import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScreenContainer, AppButton } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../context/AuthContext';
import { eventService, EventRSVP } from '../../services/eventService';

type EventDetailsRouteProp = RouteProp<AppStackParamList, 'EventDetails'>;

export const EventDetailsScreen: React.FC = () => {
    const route = useRoute<EventDetailsRouteProp>();
    const navigation = useNavigation();
    const { event } = route.params;
    const { user } = useAuth();

    const [attendees, setAttendees] = useState<EventRSVP[]>([]);
    const [myRSVP, setMyRSVP] = useState<'CONFIRMED' | 'DECLINED' | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!user) return;
        try {
            const [attendeesList, rsvpStatus] = await Promise.all([
                eventService.getEventAttendees(event.id),
                eventService.getUserRSVP(event.id, user.id)
            ]);

            setAttendees(attendeesList);
            if (rsvpStatus) {
                setMyRSVP(rsvpStatus.status);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível carregar os detalhes.');
        } finally {
            setLoading(false);
        }
    };

    const handleRSVP = async (status: 'CONFIRMED' | 'DECLINED') => {
        if (!user) return;

        // If clicking the same status, maybe remove RSVP? 
        // For now, let's allow switching or re-confirming.
        // If already confirmed and clicks declined, switch.
        // If already confirmed and clicks confirmed, do nothing? or maybe show alert?

        if (myRSVP === status) {
            return;
        }

        setProcessing(true);
        try {
            await eventService.setRSVP(event.id, user.id, status);
            setMyRSVP(status);

            // Refresh attendees list if confirming
            if (status === 'CONFIRMED') {
                const refreshedAttendees = await eventService.getEventAttendees(event.id);
                setAttendees(refreshedAttendees);
                Alert.alert('Presença Confirmada!', 'Te esperamos lá! 🎉');
            } else {
                // Remove from local list if declining
                setAttendees(prev => prev.filter(a => a.user_id !== user.id));
            }

        } catch (error: any) {
            Alert.alert('Erro', 'Falha ao atualizar presença: ' + error.message);
        } finally {
            setProcessing(false);
        }
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
                            loading={processing && !isDeclined}
                            disabled={processing}
                            style={styles.rsvpButton}
                        />
                        <AppButton
                            title={isDeclined ? "❌ Não vou" : "Não vou"}
                            variant={isDeclined ? "secondary" : "outline"} // Secondary as a "muted" state or similar? Or just outline.
                            // Let's use outline for unselected, secondary (filled gray) for declined? 
                            // Actually, let's keep it simple.
                            onPress={() => handleRSVP('DECLINED')}
                            loading={processing && isDeclined} // Only show loading on the specific button?
                            disabled={processing}
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

                    {loading ? (
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

const styles = StyleSheet.create({
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
        color: colors.primaryLight,
        fontWeight: typography.weights.medium,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
        backgroundColor: colors.backgroundHover,
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
