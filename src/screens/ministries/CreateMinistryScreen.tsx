import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, AppInput, AppButton } from '../../components';

import { spacing, typography } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../context/AuthContext';
import { useCreateMinistry } from '../../hooks/queries/useMinistries';

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'CreateMinistry'>;

export const CreateMinistryScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuth();
    const { colors } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const createMinistryMutation = useCreateMinistry();

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Erro', 'O nome do ministério é obrigatório.');
            return;
        }

        if (!user) {
            Alert.alert('Erro', 'Usuário não autenticado.');
            return;
        }

        try {
            await createMinistryMutation.mutateAsync({
                data: { name, description },
                userId: user.id
            });
            Alert.alert('Sucesso', 'Ministério criado com sucesso!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível criar o ministério.');
        }
    };

    return (
        <ScreenContainer scrollable>
            <View style={styles.container}>
                <Text style={styles.title}>Novo Ministério</Text>
                <Text style={styles.subtitle}>
                    Crie um novo ministério para a igreja
                </Text>

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
                        title="Criar Ministério"
                        variant="primary"
                        fullWidth
                        onPress={handleCreate}
                        loading={createMinistryMutation.isPending}
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

const getStyles = (colors: any) => StyleSheet.create({
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
    createButton: {
        marginTop: spacing.lg,
    },
});
