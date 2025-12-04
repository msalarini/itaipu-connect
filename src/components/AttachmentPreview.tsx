import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme';

interface AttachmentPreviewProps {
    file: {
        uri: string;
        type: string;
        name: string;
    } | null;
    onRemove: () => void;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
    file,
    onRemove,
}) => {
    if (!file) return null;

    const isImage = file.type.startsWith('image/');

    return (
        <View style={styles.container}>
            {isImage ? (
                <Image source={{ uri: file.uri }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
                <View style={styles.documentPreview}>
                    <Text style={styles.documentIcon}>📄</Text>
                    <Text style={styles.fileName} numberOfLines={1}>
                        {file.name}
                    </Text>
                </View>
            )}

            <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
                <Text style={styles.removeIcon}>✕</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        marginBottom: spacing.md,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
    },
    imagePreview: {
        width: '100%',
        height: 150,
        backgroundColor: colors.background,
    },
    documentPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    documentIcon: {
        fontSize: 32,
        marginRight: spacing.md,
    },
    fileName: {
        flex: 1,
        fontSize: typography.sizes.sm,
        color: colors.text,
    },
    removeButton: {
        position: 'absolute',
        top: spacing.xs,
        right: spacing.xs,
        backgroundColor: colors.error,
        width: 28,
        height: 28,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeIcon: {
        color: colors.white,
        fontSize: 16,
        fontWeight: typography.weights.bold,
    },
});
