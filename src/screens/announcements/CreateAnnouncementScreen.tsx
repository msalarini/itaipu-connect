import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer, AppInput, AppButton } from '../../components';
import { colors, spacing, typography } from '../../theme';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';

export const CreateAnnouncementScreen: React.FC = () => {
    const navigation = useNavigation();
    const { profile } = useAuth();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!title || !content) {
            Alert.alert('Erro', 'Preencha todos os campos.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('announcements').insert({
                title,
                content,
                author_id: profile?.id,
                is_global: true, // Default to global for MVP. Later add ministry selector.
                ministry_id: null,
            });

            if (error) {
                Alert.alert('Erro ao criar aviso', error.message);
            } else {
                Alert.alert('Sucesso', 'Aviso publicado com sucesso!');
                navigation.goBack();
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Ocorreu um erro inesperado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenContainer scrollable>
            <View style={styles.container}>
                <Text style={styles.title}>Novo Aviso</Text>

                <View style={styles.form}>
                    <AppInput
                        label="Título *"
                        placeholder="Título do aviso"
                        value={title}
                        onChangeText={setTitle}
                    />

                    <AppInput
                        label="Conteúdo *"
                        placeholder="Escreva o aviso aqui..."
                        value={content}
                        onChangeText={setContent}
                        multiline
                        numberOfLines={6}
                    />

                    <AppButton
                        title="Publicar Aviso"
                        variant="primary"
                        onPress={handleCreate}
                        loading={loading}
                        style={styles.button}
                    />

                    <AppButton
                        title="Cancelar"
                        variant="outline"
                        onPress={() => navigation.goBack()}
                    />
                </View>
            </View>
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    container: {
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
    button: {
        marginTop: spacing.md,
    },
});
