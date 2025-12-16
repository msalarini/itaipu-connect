import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../../components';
import { spacing, typography, borderRadius } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../services/supabaseClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { useAnnouncements } from '../../hooks/queries/useAnnouncements';
import { Announcement } from '../../types';

export const AnnouncementsScreen: React.FC = () => {
    const { profile } = useAuth();
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
    const { data: announcements = [], isLoading: loading } = useAnnouncements();
    const { colors } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const canCreate = profile?.global_role === 'PASTOR' || profile?.global_role === 'LEADER';

    const renderItem = ({ item }: { item: Announcement }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.is_global ? (
                    <View style={styles.globalBadge}>
                        <Text style={styles.globalBadgeText}>GERAL</Text>
                    </View>
                ) : (
                    item.ministry && (
                        <View style={styles.ministryBadge}>
                            <Text style={styles.ministryBadgeText}>{item.ministry.name.toUpperCase()}</Text>
                        </View>
                    )
                )}
            </View>

            <Text style={styles.cardContent}>{item.content}</Text>

            <View style={styles.cardFooter}>
                <Text style={styles.cardAuthor}>Por: {item.author?.name || 'Admin'}</Text>
                <Text style={styles.cardDate}>
                    {format(new Date(item.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                </Text>
            </View>
        </View>
    );

    return (
        <ScreenContainer>
            <View style={styles.header}>
                <Text style={styles.title}>Mural de Avisos</Text>
                {canCreate && (
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => navigation.navigate('CreateAnnouncement' as any)}
                    >
                        <Text style={styles.createButtonText}>+ Novo</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
            ) : (
                <FlatList
                    data={announcements}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Nenhum aviso publicado.</Text>
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
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    cardTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.bold,
        color: colors.text,
        flex: 1,
        marginRight: spacing.sm,
    },
    globalBadge: {
        backgroundColor: colors.secondary,
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    globalBadgeText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: typography.weights.bold,
    },
    ministryBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    ministryBadgeText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: typography.weights.bold,
    },
    cardContent: {
        fontSize: typography.sizes.md,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        lineHeight: 22,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: spacing.sm,
    },
    cardAuthor: {
        fontSize: typography.sizes.xs,
        color: colors.textMuted,
        fontStyle: 'italic',
    },
    cardDate: {
        fontSize: typography.sizes.xs,
        color: colors.textMuted,
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
