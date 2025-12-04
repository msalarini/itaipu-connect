import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { AppStackParamList } from '../../navigation/AppNavigator';

interface Ministry {
    id: string;
    name: string;
    description: string;
}

export const HomeScreen: React.FC = () => {
    const { user, profile } = useAuth();
    const [ministries, setMinistries] = useState<Ministry[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

    useEffect(() => {
        fetchMyMinistries();
    }, []);

    const fetchMyMinistries = async () => {
        try {
            if (!user) return;

            const { data, error } = await supabase
                .from('ministry_members')
                .select(`
          ministry:ministries (
            id,
            name,
            description
          )
        `)
                .eq('user_id', user.id);

            if (error) {
                console.error('Error fetching ministries:', error);
            } else if (data) {
                const formattedMinistries = data.map((item: any) => item.ministry).filter(Boolean);
                setMinistries(formattedMinistries);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderMinistryItem = ({ item }: { item: Ministry }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                navigation.navigate('MinistryChannel', { ministryId: item.id, ministryName: item.name });
            }}
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
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenContainer>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Olá, {profile?.name || 'Membro'}</Text>
                    <Text style={styles.subtitle}>Seus Ministérios</Text>
                </View>
                <TouchableOpacity
                    style={styles.announcementButton}
                    onPress={() => navigation.navigate('Announcements')}
                >
                    <Text style={styles.announcementButtonText}>🔔 Avisos</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
            ) : (
                <FlatList
                    data={ministries}
                    renderItem={renderMinistryItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Você ainda não participa de nenhum ministério.</Text>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: typography.sizes['2xl'],
        fontWeight: typography.weights.bold,
        color: colors.text,
    },
    subtitle: {
        fontSize: typography.sizes.md,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    announcementButton: {
        backgroundColor: colors.backgroundCard,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border,
    },
    announcementButtonText: {
        color: colors.text,
        fontWeight: typography.weights.medium,
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
