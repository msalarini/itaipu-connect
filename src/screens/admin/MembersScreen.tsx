import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, TextInput, ActivityIndicator, ActionSheetIOS, Platform } from 'react-native';
import { ScreenContainer, AppInput } from '../../components';
import { spacing, typography, borderRadius } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { Member, memberService } from '../../services/memberService';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export const MembersScreen: React.FC = () => {
    const { profile: myProfile } = useAuth();
    const navigation = useNavigation();
    const { colors } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const [members, setMembers] = useState<Member[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const isPastor = myProfile?.global_role === 'PASTOR';

    useEffect(() => {
        loadMembers();
    }, []);

    useEffect(() => {
        if (!searchQuery) {
            setFilteredMembers(members);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = members.filter(m =>
                m.name.toLowerCase().includes(query) ||
                m.email.toLowerCase().includes(query)
            );
            setFilteredMembers(filtered);
        }
    }, [searchQuery, members]);

    const loadMembers = async () => {
        try {
            const data = await memberService.listAllMembers();
            setMembers(data);
            setFilteredMembers(data);
        } catch (error: any) {
            Alert.alert('Erro', 'Não foi possível carregar a lista de membros.');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = (member: Member) => {
        if (!isPastor) return;
        if (member.id === myProfile?.id) {
            Alert.alert('Aviso', 'Você não pode alterar seu próprio cargo aqui.');
            return;
        }

        const options = ['Cancelar', 'Tornar Membro', 'Tornar Líder', 'Tornar Pastor', 'Excluir Membro'];
        const values: ('MEMBER' | 'LEADER' | 'PASTOR' | 'DELETE')[] = ['MEMBER', 'MEMBER', 'LEADER', 'PASTOR', 'DELETE'];

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex: 0,
                    destructiveButtonIndex: 4,
                    title: `Gerenciar ${member.name}`,
                    message: `Cargo atual: ${member.global_role}`
                },
                (buttonIndex) => {
                    if (buttonIndex > 0) {
                        const selected = values[buttonIndex];
                        if (selected === 'DELETE') {
                            confirmDelete(member);
                        } else {
                            updateRole(member, selected as 'MEMBER' | 'LEADER' | 'PASTOR');
                        }
                    }
                }
            );
        } else {
            Alert.alert(
                'Gerenciar Membro',
                `Selecione uma ação para ${member.name}`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Membro', onPress: () => updateRole(member, 'MEMBER') },
                    { text: 'Líder', onPress: () => updateRole(member, 'LEADER') },
                    { text: 'Pastor', onPress: () => updateRole(member, 'PASTOR') },
                    { text: 'Excluir', onPress: () => confirmDelete(member), style: 'destructive' }
                ]
            );
        }
    };

    const confirmDelete = (member: Member) => {
        Alert.alert(
            'Confirmar Exclusão',
            `Tem certeza que deseja remover ${member.name} do aplicativo? Esta ação não pode ser desfeita.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await memberService.deleteMember(member.id);
                            setMembers(prev => prev.filter(m => m.id !== member.id));
                            Alert.alert('Sucesso', 'Membro removido com sucesso.');
                        } catch (error: any) {
                            Alert.alert('Erro', 'Falha ao remover membro: ' + error.message);
                        }
                    }
                }
            ]
        );
    };

    const updateRole = async (member: Member, newRole: 'MEMBER' | 'LEADER' | 'PASTOR') => {
        try {
            await memberService.updateMemberRole(member.id, newRole);
            setMembers(prev => prev.map(m => m.id === member.id ? { ...m, global_role: newRole } : m));
            Alert.alert('Sucesso', 'Cargo atualizado com sucesso.');
        } catch (error: any) {
            Alert.alert('Erro', 'Falha ao atualizar cargo: ' + error.message);
        }
    };

    const getRoleParams = (role: string) => {
        switch (role) {
            case 'PASTOR': return { color: colors.primary, label: 'Pastor' };
            case 'LEADER': return { color: colors.secondary, label: 'Líder' };
            default: return { color: colors.textSecondary, label: 'Membro' };
        }
    };

    const renderItem = ({ item }: { item: Member }) => {
        const { color, label } = getRoleParams(item.global_role);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => handleRoleChange(item)}
                disabled={!isPastor}
            >
                <View style={[styles.avatar, { backgroundColor: color }]}>
                    <Text style={styles.avatarText}>{item.name.substring(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                </View>
                <View style={[styles.roleBadge, { borderColor: color }]}>
                    <Text style={[styles.roleText, { color }]}>{label}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <ScreenContainer>
            <View style={styles.header}>
                <Text style={styles.title}>Membros</Text>
                <Text style={styles.subtitle}>{members.length} cadastrados</Text>
            </View>

            <View style={styles.searchContainer}>
                <AppInput
                    placeholder="Buscar nome ou email..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <ActivityIndicator color={colors.primary} size="large" />
            ) : (
                <FlatList
                    data={filteredMembers}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Nenhum membro encontrado.</Text>
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
        fontSize: typography.sizes['3xl'],
        fontWeight: typography.weights.bold,
        color: colors.text,
    },
    subtitle: {
        fontSize: typography.sizes.sm,
        color: colors.textSecondary,
    },
    searchContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
    },
    list: {
        padding: spacing.lg,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundCard,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        color: colors.white,
        fontWeight: typography.weights.bold,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: typography.sizes.md,
        fontWeight: typography.weights.medium,
        color: colors.text,
    },
    email: {
        fontSize: typography.sizes.sm,
        color: colors.textMuted,
    },
    roleBadge: {
        borderWidth: 1,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
    },
    roleText: {
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.bold,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textMuted,
        marginTop: spacing.xl,
    }
});
