import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker'; // Install: expo install @react-native-picker/picker
import { format } from 'date-fns';
import { ScreenContainer, AppInput, AppButton } from '../../components';
import { spacing, typography, borderRadius } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useMinistries } from '../../hooks/queries/useMinistries';
import { useCreateEvent } from '../../hooks/queries/useEvents';

export const CreateEventScreen: React.FC = () => {
    const navigation = useNavigation();
    const { profile } = useAuth();
    const { colors } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');

    // Date State
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Ministry State
    const canSelectMinistry = profile?.global_role === 'LEADER' || profile?.global_role === 'PASTOR' || profile?.role === 'admin';
    const { data: ministries = [], isLoading: loadingMinistries } = useMinistries();
    const createEventMutation = useCreateEvent();

    const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null);

    // Default to leader ministry if applicable
    useEffect(() => {
        if (canSelectMinistry && profile?.leader_ministry_id && !selectedMinistryId) {
            setSelectedMinistryId(profile.leader_ministry_id);
        }
    }, [canSelectMinistry, profile?.leader_ministry_id]);

    const handleCreate = async () => {
        if (!title || !location) {
            Alert.alert('Erro', 'Preencha os campos obrigatórios (Título e Local).');
            return;
        }

        try {
            await createEventMutation.mutateAsync({
                title,
                description,
                location,
                event_date: date.toISOString(),
                created_by: profile?.id!,
                ministry_id: selectedMinistryId === 'global' ? null : selectedMinistryId
            });

            Alert.alert('Sucesso', 'Evento criado com sucesso!');
            navigation.goBack();
        } catch (error: any) {
            console.error(error);
            Alert.alert('Erro', 'Ocorreu um erro inesperado: ' + (error.message || 'Erro desconhecido'));
        }
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            const currentDate = selectedDate;
            const currentTime = date; // keep time
            currentDate.setHours(currentTime.getHours());
            currentDate.setMinutes(currentTime.getMinutes());
            setDate(currentDate);

            if (Platform.OS === 'android') {
                // On Android, flow is usually Date -> Time
                // setShowTimePicker(true); // Optional: autotrigger time picker
            }
        }
    };

    const onChangeTime = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }
        if (selectedDate) {
            setDate(selectedDate); // Time picker returns full date obj with updated time
        }
    };

    const showDateMode = () => {
        setShowDatePicker(true);
    };

    const showTimeMode = () => {
        setShowTimePicker(true);
    };

    return (
        <ScreenContainer scrollable>
            <View style={styles.container}>
                <Text style={styles.title}>Novo Evento</Text>

                <View style={styles.form}>
                    <AppInput
                        label="Título *"
                        placeholder="Ex: Culto de Jovens"
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
                        placeholder="Ex: Templo Principal"
                        value={location}
                        onChangeText={setLocation}
                    />

                    {/* Date & Time Selection */}
                    <View style={styles.dateTimeContainer}>
                        <Text style={styles.label}>Data e Hora *</Text>
                        <View style={styles.dateTimeRow}>
                            <TouchableOpacity onPress={showDateMode} style={styles.dateButton}>
                                <Text style={styles.dateButtonText}>
                                    📅 {format(date, 'dd/MM/yyyy')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={showTimeMode} style={styles.dateButton}>
                                <Text style={styles.dateButtonText}>
                                    ⏰ {format(date, 'HH:mm')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={date}
                                mode="date"
                                is24Hour={true}
                                display="default"
                                onChange={onChangeDate}
                            />
                        )}

                        {showTimePicker && (
                            <DateTimePicker
                                testID="timePicker"
                                value={date}
                                mode="time"
                                is24Hour={true}
                                display="default"
                                onChange={onChangeTime}
                            />
                        )}
                    </View>

                    {/* Ministry Selection */}
                    {canSelectMinistry && (
                        <View style={styles.pickerContainer}>
                            <Text style={styles.label}>Ministério (Opcional)</Text>
                            {loadingMinistries ? (
                                <ActivityIndicator color={colors.primary} />
                            ) : (
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={selectedMinistryId}
                                        onValueChange={(itemValue) => setSelectedMinistryId(itemValue)}
                                        style={styles.picker}
                                        dropdownIconColor={colors.text}
                                    >
                                        <Picker.Item label="Evento Global (Igreja)" value="global" color={colors.text} />
                                        {ministries.map((m) => (
                                            <Picker.Item key={m.id} label={m.name} value={m.id} color={colors.text} />
                                        ))}
                                    </Picker>
                                </View>
                            )}
                            <Text style={styles.helperText}>
                                Se selecionado, aparecerá apenas na aba do ministério (e na geral se filtrado). "Global" aparece para todos.
                            </Text>
                        </View>
                    )}

                    <AppButton
                        title="Criar Evento"
                        variant="primary"
                        onPress={handleCreate}
                        loading={createEventMutation.isPending}
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
    label: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.medium,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    dateTimeContainer: {
        marginBottom: spacing.md,
    },
    dateTimeRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    dateButton: {
        flex: 1,
        backgroundColor: colors.backgroundCard,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
    },
    dateButtonText: {
        color: colors.text,
        fontSize: typography.sizes.md,
    },
    pickerContainer: {
        marginBottom: spacing.md,
    },
    pickerWrapper: {
        backgroundColor: colors.backgroundCard,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        overflow: 'hidden', // Important for rounded corners on Android
    },
    picker: {
        color: colors.text,
        // height: 50, // Optional constraint
    },
    helperText: {
        fontSize: typography.sizes.xs,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
    button: {
        marginTop: spacing.md,
    },
});
