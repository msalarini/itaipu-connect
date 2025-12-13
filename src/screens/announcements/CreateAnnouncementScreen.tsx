import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer, AppInput, AppButton } from '../../components';
import { spacing, typography } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { sendBroadcastNotification } from '../../services/notificationService';

export const CreateAnnouncementScreen: React.FC = () => {
    const navigation = useNavigation();
    const { profile } = useAuth();
    const { colors } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [sendPush, setSendPush] = useState(false);
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
                if (sendPush) {
                    await sendBroadcastNotification(title, content);
                }
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

                    <View style={styles.switchContainer}>
                        <Text style={styles.switchLabel}>Enviar notificação push (para todos)</Text>
                        <Switch
                            value={sendPush}
                            onValueChange={setSendPush}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={colors.white}
                        />
                    </View>

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

const getStyles = (colors: any) => StyleSheet.create({
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
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
    },
    switchLabel: {
        color: colors.text,
        fontSize: typography.sizes.md,
    },
});
