import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

interface AttachmentPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelectFile: (file: { uri: string; type: string; name: string }) => void;
}

export const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
    visible,
    onClose,
    onSelectFile,
}) => {
    const [requesting, setRequesting] = useState(false);

    const handleTakePhoto = async () => {
        try {
            setRequesting(true);

            // Requisitar permissão
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão negada', 'Precisamos de acesso à câmera para tirar fotos.');
                setRequesting(false);
                return;
            }

            // Abrir câmera
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: true,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                onSelectFile({
                    uri: asset.uri,
                    type: asset.mimeType || 'image/jpeg',
                    name: `photo-${Date.now()}.jpg`,
                });
                onClose();
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível tirar a foto.');
        } finally {
            setRequesting(false);
        }
    };

    const handlePickImage = async () => {
        try {
            setRequesting(true);

            // Requisitar permissão
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão negada', 'Precisamos de acesso à galeria para selecionar fotos.');
                setRequesting(false);
                return;
            }

            // Abrir galeria
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: true,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                onSelectFile({
                    uri: asset.uri,
                    type: asset.mimeType || 'image/jpeg',
                    name: asset.fileName || `image-${Date.now()}.jpg`,
                });
                onClose();
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
        } finally {
            setRequesting(false);
        }
    };

    const handlePickDocument = async () => {
        try {
            setRequesting(true);

            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (result.type === 'success') {
                onSelectFile({
                    uri: result.uri,
                    type: result.mimeType || 'application/pdf',
                    name: result.name,
                });
                onClose();
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível selecionar o documento.');
        } finally {
            setRequesting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.container}>
                    <Text style={styles.title}>Adicionar Anexo</Text>

                    <TouchableOpacity
                        style={styles.option}
                        onPress={handleTakePhoto}
                        disabled={requesting}
                    >
                        <Text style={styles.optionIcon}>📷</Text>
                        <Text style={styles.optionText}>Tirar Foto</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.option}
                        onPress={handlePickImage}
                        disabled={requesting}
                    >
                        <Text style={styles.optionIcon}>🖼️</Text>
                        <Text style={styles.optionText}>Galeria</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.option}
                        onPress={handlePickDocument}
                        disabled={requesting}
                    >
                        <Text style={styles.optionIcon}>📄</Text>
                        <Text style={styles.optionText}>Documento (PDF)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.option, styles.cancelOption]}
                        onPress={onClose}
                    >
                        <Text style={styles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    container: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        width: '100%',
        maxWidth: 400,
    },
    title: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold,
        color: colors.text,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.background,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.sm,
    },
    optionIcon: {
        fontSize: 24,
        marginRight: spacing.md,
    },
    optionText: {
        fontSize: typography.sizes.md,
        color: colors.text,
        fontWeight: typography.weights.medium,
    },
    cancelOption: {
        marginTop: spacing.md,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
    },
    cancelText: {
        fontSize: typography.sizes.md,
        color: colors.textMuted,
        fontWeight: typography.weights.medium,
        textAlign: 'center',
        flex: 1,
    },
});
