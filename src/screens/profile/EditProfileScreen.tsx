import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer, AppInput, AppButton } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';

export const EditProfileScreen: React.FC = () => {
    const { user, profile, signOut } = useAuth(); // Need a way to refresh profile context!
    // Ideally AuthContext should expose a reloadProfile function.
    // For now we will update local state and hope user reloads or we manually update context if we can.
    // Actually, checking AuthContext... it listens to auth state changes.
    // But profile data is fetched once on auth state change.
    // We might need to trigger a re-fetch.

    const navigation = useNavigation();

    const [name, setName] = useState(profile?.name || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null); // We need to add avatar_url to UserProfile interface first!
    // Wait, UserProfile doesn't have avatar_url yet in the interface we defined earlier.
    // We need to add it to the interface and the SELECT query in AuthContext.

    // Let's assume we'll fix AuthContext in the next step.

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
            let publicUrl = avatarUrl; // Keep existing if not changed

            if (selectedImage) {
                // Upload new image
                const fileExt = selectedImage.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                // Use storageService or direct supabase?
                // storageService is for attachments (bucket 'message-attachments').
                // Let's use supabase direct for now or adapt storageService.
                // Adapting storageService is better code reuse, but it might verify file types strictly for attachments.
                // Let's do direct upload here for simplicity, similar to storageService logic.

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

            Alert.alert('Sucesso', 'Perfil atualizado!', [{ text: 'OK', onPress: () => navigation.goBack() }]);

            // TODO: Trigger profile refresh in AuthContext

        } catch (error: any) {
            Alert.alert('Erro', error.message);
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    return (
        <ScreenContainer>
            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
                        {selectedImage ? (
                            <Image source={{ uri: selectedImage }} style={styles.avatar} />
                        ) : avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
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

const styles = StyleSheet.create({
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
        backgroundColor: colors.backgroundHover,
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
