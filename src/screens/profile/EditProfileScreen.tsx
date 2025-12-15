import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer, AppInput, AppButton } from '../../components';
import { spacing, typography, borderRadius } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';

export const EditProfileScreen: React.FC = () => {
    const { user, profile, refreshProfile } = useAuth();
    const { colors } = useTheme();
    const styles = React.useMemo(() => getStyles(colors), [colors]);
    const navigation = useNavigation();

    const [name, setName] = useState(profile?.name || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [bio, setBio] = useState(profile?.bio || '');
    // Note: avatar_url usage relies on component re-render with new profile or local state

    // We can use local state for immediate feedback, but persisting uses logic below
    // Actually, we don't display 'avatarUrl' from state in render if we select a new image.
    // The logic below: selectedImage takes precedence.

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                setSelectedImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);

        try {
            let publicUrl = profile?.avatar_url; // Keep existing if not changed

            if (selectedImage) {
                // Upload new image
                const fileExt = selectedImage.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                setUploading(true);
                const response = await fetch(selectedImage);
                const blob = await response.blob();

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, blob);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
                publicUrl = data.publicUrl;
                setUploading(false);
            }

            // Update profile
            const { error } = await supabase
                .from('profiles')
                .update({
                    name,
                    phone,
                    bio,
                    avatar_url: publicUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) throw error;

            if (refreshProfile) {
                await refreshProfile();
            }

            Alert.alert('Sucesso', 'Perfil atualizado!', [{ text: 'OK', onPress: () => navigation.goBack() }]);

        } catch (error: any) {
            Alert.alert('Erro', error.message);
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    return (
        <ScreenContainer scrollable>
            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
                        {selectedImage ? (
                            <Image source={{ uri: selectedImage }} style={styles.avatar} />
                        ) : profile?.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{name.substring(0, 2).toUpperCase()}</Text>
                            </View>
                        )}
                        <View style={styles.editIconContainer}>
                            <Text style={styles.editIcon}>📷</Text>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.changePhotoText}>Toque para alterar foto</Text>
                </View>

                <View style={styles.form}>
                    <AppInput
                        label="Nome Completo"
                        value={name}
                        onChangeText={setName}
                        placeholder="Seu nome"
                    />

                    <AppInput
                        label="Telefone (WhatsApp)"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="(00) 00000-0000"
                        keyboardType="phone-pad"
                    />

                    <AppInput
                        label="Bio / Sobre mim"
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Conte um pouco sobre você..."
                        multiline
                        numberOfLines={3}
                        style={{ height: 100, textAlignVertical: 'top' }}
                    />
                </View>

                <AppButton
                    title="Salvar Alterações"
                    onPress={handleSave}
                    loading={loading || uploading}
                    disabled={loading || uploading}
                    style={styles.saveButton}
                />

            </ScrollView>
        </ScreenContainer>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    content: {
        padding: spacing.lg,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: borderRadius.full,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: borderRadius.full,
        borderWidth: 2,
        borderColor: colors.primary,
        backgroundColor: colors.backgroundHover || '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: typography.sizes['4xl'],
        color: colors.textSecondary,
        fontWeight: typography.weights.bold,
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: 36,
        height: 36,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    editIcon: {
        fontSize: 16,
    },
    changePhotoText: {
        marginTop: spacing.sm,
        color: colors.primary,
        fontSize: typography.sizes.sm,
    },
    form: {
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    saveButton: {
        marginTop: spacing.md,
    },
});
