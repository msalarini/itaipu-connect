import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { spacing, typography, borderRadius } from '../theme';
import { Ministry } from '../types';

interface MinistryCardProps {
    ministry: Ministry;
    onPress: (ministry: Ministry) => void;
    colors: any;
}

export const MinistryCard: React.FC<MinistryCardProps> = ({ ministry, onPress, colors }) => {
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress(ministry)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{ministry.name.substring(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{ministry.name}</Text>
                    <Text style={styles.cardDescription} numberOfLines={2}>
                        {ministry.description || 'Sem descrição'}
                    </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
            </View>
        </TouchableOpacity>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
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
});
