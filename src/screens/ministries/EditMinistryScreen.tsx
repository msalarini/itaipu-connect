import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, AppInput, AppButton } from '../../components';
import { spacing, typography, borderRadius } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { deleteMinistry } from '../../services/ministryService';
import { useMinistryDetails, useUpdateMinistry } from '../../hooks/queries/useMinistries';

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'EditMinistry'>;
type EditMinistryRouteProp = RouteProp<AppStackParamList, 'EditMinistry'>;

export const EditMinistryScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<EditMinistryRouteProp>();
    const { ministryId } = route.params;
    const { colors } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [deleting, setDeleting] = useState(false);

    // Hooks
    const { data: ministry, isLoading: loadingData } = useMinistryDetails(ministryId);
    const updateMinistryMutation = useUpdateMinistry();

    // Populate data when loaded
    React.useEffect(() => {
        if (ministry) {
            setName(ministry.name);
            setDescription(ministry.description || '');
        }
    }, [ministry]);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Erro', 'O nome do ministério é obrigatório.');
            return;
        }

        try {
            await updateMinistryMutation.mutateAsync({
                id: ministryId,
                data: { name, description }
            });
            Alert.alert('Sucesso', 'Ministério atualizado com sucesso!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível atualizar o ministério.');
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Excluir Ministério',
            'Tem certeza que deseja excluir este ministério? Esta ação não pode ser desfeita e todos os dados relacionados (mensagens, membros) serão perdidos.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await deleteMinistry(ministryId);
                            Alert.alert('Sucesso', 'Ministério excluído com sucesso!', [
                                { text: 'OK', onPress: () => navigation.navigate('MainTabs') }
                            ]);
                        } catch (error: any) {
                            Alert.alert('Erro', error.message || 'Não foi possível excluir o ministério.');
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    if (loadingData) {
        return (
            <ScreenContainer>
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer scrollable>
            <View style={styles.container}>
                <Text style={styles.title}>Editar Ministério</Text>

                <View style={styles.form}>
                    <AppInput
                        label="Nome do Ministério"
                        placeholder="Ex: Louvor, Jovens, Casais..."
                        value={name}
                        onChangeText={setName}
                    />

                    <AppInput
                        label="Descrição (Opcional)"
                        placeholder="Descreva o propósito do ministério..."
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                    />

                    <AppButton
                        title="Salvar Alterações"
                        variant="primary"
                        fullWidth
                        onPress={handleSave}
                        loading={updateMinistryMutation.isPending}
                        style={styles.saveButton}
                    />

                    <AppButton
                        title="Cancelar"
                        variant="outline"
                        fullWidth
                        onPress={() => navigation.goBack()}
                    />

                    <View style={styles.dangerZone}>
                        <Text style={styles.dangerTitle}>Zona de Perigo</Text>
                        <Text style={styles.dangerText}>
                            Excluir o ministério removerá permanentemente todas as mensagens e membros associados.
                        </Text>
                        <AppButton
                            title={deleting ? 'Excluindo...' : 'Excluir Ministério'}
                            variant="outline"
                            fullWidth
                            onPress={handleDelete}
                            loading={deleting}
                            style={styles.deleteButton}
                        />
                    </View>
                </View>
            </View>
        </ScreenContainer>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    loader: {
        flex: 1,
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        padding: spacing.lg,
    },
    title: {
        fontSize: typography.sizes['2xl'],
        fontWeight: typography.weights.bold,
        color: colors.text,
        marginBottom: spacing.xl,
    },
    form: {
        gap: spacing.md,
    },
    saveButton: {
        marginTop: spacing.lg,
    },
    dangerZone: {
        marginTop: spacing['2xl'],
        padding: spacing.lg,
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.error,
    },
    dangerTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.bold,
        color: colors.error,
        marginBottom: spacing.sm,
    },
    dangerText: {
        fontSize: typography.sizes.sm,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    deleteButton: {
        borderColor: colors.error,
        borderWidth: 1,
    },
});
