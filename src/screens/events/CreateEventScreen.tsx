import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer, AppInput, AppButton } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';

export const CreateEventScreen: React.FC = () => {
    const navigation = useNavigation();
    const { profile } = useAuth();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [date, setDate] = useState(''); // Simple text input for MVP (YYYY-MM-DD HH:mm)
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!title || !location || !date) {
            Alert.alert('Erro', 'Preencha os campos obrigatórios.');
            return;
        }

        // Basic date validation
        const eventDate = new Date(date);
        if (isNaN(eventDate.getTime())) {
            Alert.alert('Erro', 'Formato de data inválido. Use AAAA-MM-DD HH:mm');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('events').insert({
                title,
                description,
                location,
                event_date: eventDate.toISOString(),
                created_by: profile?.id,
                // For MVP, creating global events by default if PASTOR, or we could add a ministry selector
                // Let's assume global for PASTOR, and we'd need logic for LEADER to select their ministry
                // For now, simple global insert or NULL ministry_id
            });

            if (error) {
                Alert.alert('Erro ao criar evento', error.message);
            } else {
                Alert.alert('Sucesso', 'Evento criado com sucesso!');
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
                <Text style={styles.title}>Novo Evento</Text>

                <View style={styles.form}>
                    <AppInput
                        label="Título *"
                        placeholder="Culto de Jovens"
                        value={title}
                        onChangeText={setTitle}
                    />

                    <AppInput
                        label="Descrição"
                        placeholder="Detalhes do evento..."
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                    />

                    <AppInput
                        label="Local *"
                        placeholder="Templo Principal"
                        value={location}
                        onChangeText={setLocation}
                    />

                    <AppInput
                        label="Data e Hora * (AAAA-MM-DD HH:mm)"
                        placeholder="2025-12-25 19:00"
                        value={date}
                        onChangeText={setDate}
                    />

                    <AppButton
                        title="Criar Evento"
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
