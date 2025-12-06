import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, AppInput, AppButton } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../context/AuthContext';
import { createInvite } from '../../services/inviteService';
import { supabase } from '../../services/supabaseClient';

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'CreateInvite'>;

interface Ministry {
    id: string;
    name: string;
}

const VALIDITY_OPTIONS = [
    { label: '7 dias', value: 7 },
    { label: '30 dias', value: 30 },
    { label: '90 dias', value: 90 },
];

const ROLE_OPTIONS: { label: string; value: 'MEMBER' | 'LEADER' }[] = [
    { label: 'Membro', value: 'MEMBER' },
    { label: 'Líder', value: 'LEADER' },
];

export const CreateInviteScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuth();

    const [email, setEmail] = useState('');
    const [selectedRole, setSelectedRole] = useState<'MEMBER' | 'LEADER'>('MEMBER');
    const [selectedValidity, setSelectedValidity] = useState(30);
    const [ministries, setMinistries] = useState<Ministry[]>([]);
    const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMinistries, setLoadingMinistries] = useState(true);

    useEffect(() => {
        fetchMinistries();
    }, []);

    const fetchMinistries = async () => {
        try {
            const { data, error } = await supabase
                .from('ministries')
                .select('id, name')
                .order('name', { ascending: true });

            if (error) throw error;
            setMinistries(data || []);
        } catch (error) {
            console.error('Error fetching ministries:', error);
        } finally {
            setLoadingMinistries(false);
        }
    };

    const toggleMinistry = (ministryId: string) => {
        setSelectedMinistries(prev => {
            if (prev.includes(ministryId)) {
                return prev.filter(id => id !== ministryId);
            }
            return [...prev, ministryId];
        });
    };

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleCreate = async () => {
        if (!email.trim()) {
            Alert.alert('Erro', 'Informe o e-mail do convidado.');
            return;
        }

        if (!validateEmail(email)) {
            Alert.alert('Erro', 'Informe um e-mail válido.');
            return;
        }

        if (!user) {
            Alert.alert('Erro', 'Usuário não autenticado.');
            return;
        }

        setLoading(true);
        try {
            const invite = await createInvite({
                email: email.trim(),
                global_role: selectedRole,
                ministries_default: selectedMinistries.length > 0 ? selectedMinistries : undefined,
                validity_days: selectedValidity,
            }, user.id);

            Alert.alert(
                'Convite Criado!',
                `Código: ${invite.code}\n\nEnvie este código para ${email} para que ele possa se cadastrar.`,
                [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]
            );
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível criar o convite.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenContainer scrollable>
            <View style={styles.container}>
                <Text style={styles.title}>Novo Convite</Text>
                <Text style={styles.subtitle}>
                    Crie um código de convite para um novo membro
                </Text>

                <View style={styles.form}>
                    <AppInput
                        label="E-mail do Convidado"
                        placeholder="email@exemplo.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Função (Role)</Text>
                        <View style={styles.optionsRow}>
                            {ROLE_OPTIONS.map(option => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.optionButton,
                                        selectedRole === option.value && styles.optionButtonSelected,
                                    ]}
                                    onPress={() => setSelectedRole(option.value)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        selectedRole === option.value && styles.optionTextSelected,
                                    ]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Validade do Convite</Text>
                        <View style={styles.optionsRow}>
                            {VALIDITY_OPTIONS.map(option => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.optionButton,
                                        selectedValidity === option.value && styles.optionButtonSelected,
                                    ]}
                                    onPress={() => setSelectedValidity(option.value)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        selectedValidity === option.value && styles.optionTextSelected,
                                    ]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ministérios (Opcional)</Text>
                        <Text style={styles.sectionSubtitle}>
                            Selecione os ministérios que o membro participará automaticamente
                        </Text>

                        {loadingMinistries ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : ministries.length === 0 ? (
                            <Text style={styles.noMinistries}>Nenhum ministério cadastrado</Text>
                        ) : (
                            <View style={styles.ministriesGrid}>
                                {ministries.map(ministry => (
                                    <TouchableOpacity
                                        key={ministry.id}
                                        style={[
                                            styles.ministryChip,
                                            selectedMinistries.includes(ministry.id) && styles.ministryChipSelected,
                                        ]}
                                        onPress={() => toggleMinistry(ministry.id)}
                                    >
                                        <Text style={[
                                            styles.ministryChipText,
                                            selectedMinistries.includes(ministry.id) && styles.ministryChipTextSelected,
                                        ]}>
                                            {ministry.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <AppButton
                        title="Criar Convite"
                        variant="primary"
                        fullWidth
                        onPress={handleCreate}
                        loading={loading}
                        style={styles.createButton}
                    />

                    <AppButton
                        title="Cancelar"
                        variant="outline"
                        fullWidth
                        onPress={() => navigation.goBack()}
                    />
                </View>
            </View>
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.lg,
    },
    title: {
        fontSize: typography.sizes['2xl'],
        fontWeight: typography.weights.bold,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: typography.sizes.md,
        color: colors.textSecondary,
        marginBottom: spacing.xl,
    },
    form: {
        gap: spacing.md,
    },
    section: {
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: typography.sizes.md,
        fontWeight: typography.weights.semibold,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    sectionSubtitle: {
        fontSize: typography.sizes.sm,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    optionsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    optionButton: {
        flex: 1,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.backgroundCard,
        alignItems: 'center',
    },
    optionButtonSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary,
    },
    optionText: {
        fontSize: typography.sizes.md,
        color: colors.text,
        fontWeight: typography.weights.medium,
    },
    optionTextSelected: {
        color: colors.white,
    },
    ministriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    ministryChip: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.backgroundCard,
    },
    ministryChipSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary,
    },
    ministryChipText: {
        fontSize: typography.sizes.sm,
        color: colors.text,
    },
    ministryChipTextSelected: {
        color: colors.white,
    },
    noMinistries: {
        fontSize: typography.sizes.sm,
        color: colors.textMuted,
        fontStyle: 'italic',
    },
    createButton: {
        marginTop: spacing.lg,
    },
});
