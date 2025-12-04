import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Linking } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme';

interface MessageAttachmentProps {
    url: string;
    type: 'image' | 'document';
    filename: string;
}

export const MessageAttachment: React.FC<MessageAttachmentProps> = ({
    url,
    type,
    filename,
}) => {
    const [fullscreenVisible, setFullscreenVisible] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    const handlePress = () => {
        if (type === 'image') {
            setFullscreenVisible(true);
        } else {
            // Abrir documento
            Linking.openURL(url).catch((err) => {
                console.error('Failed to open URL:', err);
            });
        }
    };

    if (type === 'image') {
        return (
            <>
                <TouchableOpacity onPress={handlePress} style={styles.imageContainer}>
                    {imageLoading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator color={colors.primary} />
                        </View>
                    )}
                    <Image
                        source={{ uri: url }}
                        style={styles.image}
                        resizeMode="cover"
                        onLoadStart={() => setImageLoading(true)}
                        onLoadEnd={() => setImageLoading(false)}
                    />
                </TouchableOpacity>

                <Modal
                    visible={fullscreenVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setFullscreenVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.fullscreenOverlay}
                        activeOpacity={1}
                        onPress={() => setFullscreenVisible(false)}
                    >
                        <Image source={{ uri: url }} style={styles.fullscreenImage} resizeMode="contain" />
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setFullscreenVisible(false)}
                        >
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
            </>
        );
    }

    // Document
    return (
        <TouchableOpacity onPress={handlePress} style={styles.documentContainer}>
            <Text style={styles.documentIcon}>📄</Text>
            <View style={styles.documentInfo}>
                <Text style={styles.documentName} numberOfLines={1}>
                    {filename}
                </Text>
                <Text style={styles.documentAction}>Tocar para abrir</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    imageContainer: {
        marginTop: spacing.xs,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        position: 'relative',
    },
    image: {
        width: 200,
        height: 200,
        backgroundColor: colors.background,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    documentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        marginTop: spacing.xs,
        borderWidth: 1,
        borderColor: colors.border,
    },
    documentIcon: {
        fontSize: 32,
        marginRight: spacing.sm,
    },
    documentInfo: {
        flex: 1,
    },
    documentName: {
        fontSize: typography.sizes.sm,
        color: colors.text,
        fontWeight: typography.weights.medium,
    },
    documentAction: {
        fontSize: typography.sizes.xs,
        color: colors.primary,
        marginTop: 2,
    },
    fullscreenOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenImage: {
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        backgroundColor: colors.backgroundCard,
        width: 40,
        height: 40,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeIcon: {
        color: colors.text,
        fontSize: 20,
        fontWeight: typography.weights.bold,
    },
});
