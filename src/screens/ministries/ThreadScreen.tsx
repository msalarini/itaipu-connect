import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { spacing, typography, borderRadius } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AttachmentPicker, AttachmentPreview, MessageAttachment as MessageAttachmentView } from '../../components';
import { uploadAttachment, validateFile, AttachmentFile } from '../../services/storageService';
import { useThread, useSendMessage } from '../../hooks/queries/useChat';

import { Message, MessageAttachment } from '../../types';

type ThreadRouteProp = RouteProp<AppStackParamList, 'Thread'>;

export const ThreadScreen: React.FC = () => {
    const route = useRoute<ThreadRouteProp>();
    const { rootMessageId, ministryId } = route.params;
    const { user } = useAuth();
    const { colors } = useTheme();

    const { data: threadData, isLoading: loading } = useThread(rootMessageId);
    const sendMessageMutation = useSendMessage();

    const rootMessage = threadData?.root;
    const replies = threadData?.replies || [];

    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<AttachmentFile | null>(null);
    const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
    const styles = React.useMemo(() => getStyles(colors), [colors]);

    const flatListRef = useRef<FlatList>(null);

    // Auto-scroll on new messages
    useEffect(() => {
        if (replies.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [replies.length]);

    const handleSelectFile = async (file: AttachmentFile) => {
        try {
            await validateFile(file);
            setSelectedFile(file);
        } catch (error: any) {
            Alert.alert('Erro', error.message);
        }
    };

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !selectedFile) || !user) return;

        try {
            const messageData = await sendMessageMutation.mutateAsync({
                ministryId,
                authorId: user.id,
                content: newMessage.trim(),
                parentMessageId: rootMessageId,
            });

            if (selectedFile) {
                const uploadResult = await uploadAttachment(selectedFile, messageData.id, ministryId);

                const { error: attachmentError } = await supabase
                    .from('message_attachments')
                    .insert({
                        message_id: messageData.id,
                        file_url: uploadResult.url,
                        file_name: uploadResult.filename,
                        file_type: uploadResult.type,
                    });

                if (attachmentError) {
                    console.error('Error saving attachment reference:', attachmentError);
                }
            }

            setNewMessage('');
            setSelectedFile(null);
        } catch (error: any) {
            console.error('Error sending reply:', error);
            Alert.alert('Erro', error.message || 'Não foi possível enviar a resposta');
        }
    };

    const renderMessageItem = ({ item, isRoot = false }: { item: Message; isRoot?: boolean }) => {
        const isMyMessage = item.author_id === user?.id;
        const attachment = item.attachments && item.attachments.length > 0 ? item.attachments[0] : null;

        return (
            <View style={[
                styles.messageContainer,
                isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
                isRoot && styles.rootMessageContainer
            ]}>
                {!isMyMessage && (
                    <Text style={styles.authorName}>{item.author?.name || 'Desconhecido'}</Text>
                )}
                <View style={[
                    styles.messageBubble,
                    isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
                    isRoot && styles.rootMessageBubble
                ]}>
                    {item.content && item.content !== '(anexo)' && (
                        <Text style={[
                            styles.messageText,
                            isMyMessage ? styles.myMessageText : styles.otherMessageText
                        ]}>
                            {item.content}
                        </Text>
                    )}

                    {attachment && (
                        <MessageAttachmentView
                            url={attachment.file_url}
                            type={attachment.file_type as 'image' | 'document'}
                            filename={attachment.file_name}
                        />
                    )}

                    <Text style={[
                        styles.messageTime,
                        isMyMessage ? styles.myMessageTime : styles.otherMessageTime
                    ]}>
                        {format(new Date(item.created_at), 'HH:mm', { locale: ptBR })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={replies}
                    ListHeaderComponent={rootMessage ? renderMessageItem({ item: rootMessage, isRoot: true }) : null}
                    renderItem={renderMessageItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                />
            )}

            {selectedFile && (
                <View style={styles.previewContainer}>
                    <AttachmentPreview
                        file={selectedFile}
                        onRemove={() => setSelectedFile(null)}
                    />
                </View>
            )}

            <View style={styles.inputContainer}>
                <TouchableOpacity
                    style={styles.attachButton}
                    onPress={() => setShowAttachmentPicker(true)}
                >
                    <Text style={styles.attachIcon}>📎</Text>
                </TouchableOpacity>

                <TextInput
                    style={styles.input}
                    placeholder="Responder na thread..."
                    placeholderTextColor={colors.textMuted}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                />

                <TouchableOpacity
                    style={[styles.sendButton, (!newMessage.trim() && !selectedFile) && styles.sendButtonDisabled]}
                    onPress={handleSendMessage}
                    disabled={(!newMessage.trim() && !selectedFile) || sendMessageMutation.isPending}
                >
                    {sendMessageMutation.isPending ? (
                        <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                        <Text style={styles.sendButtonText}>Enviar</Text>
                    )}
                </TouchableOpacity>
            </View>

            <AttachmentPicker
                visible={showAttachmentPicker}
                onClose={() => setShowAttachmentPicker(false)}
                onSelectFile={handleSelectFile}
            />
        </KeyboardAvoidingView>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    messageContainer: {
        marginBottom: spacing.md,
        maxWidth: '80%',
    },
    rootMessageContainer: {
        maxWidth: '100%',
        marginBottom: spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: spacing.md,
    },
    myMessageContainer: {
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
    },
    otherMessageContainer: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
    },
    authorName: {
        fontSize: typography.sizes.xs,
        color: colors.textSecondary,
        marginBottom: 2,
        marginLeft: spacing.xs,
    },
    messageBubble: {
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        minWidth: 100,
    },
    rootMessageBubble: {
        backgroundColor: colors.backgroundCard,
        width: '100%',
        borderRadius: borderRadius.md,
        borderWidth: 0,
    },
    myMessageBubble: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 0,
    },
    otherMessageBubble: {
        backgroundColor: colors.backgroundCard,
        borderBottomLeftRadius: 0,
        borderWidth: 1,
        borderColor: colors.border,
    },
    messageText: {
        fontSize: typography.sizes.md,
        marginBottom: spacing.xs,
    },
    myMessageText: {
        color: colors.white,
    },
    otherMessageText: {
        color: colors.text,
    },
    messageTime: {
        fontSize: 10,
        alignSelf: 'flex-end',
        marginTop: spacing.xs,
    },
    myMessageTime: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    otherMessageTime: {
        color: colors.textMuted,
    },
    previewContainer: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        backgroundColor: colors.backgroundCard,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        alignItems: 'center',
    },
    attachButton: {
        padding: spacing.sm,
        marginRight: spacing.xs,
    },
    attachIcon: {
        fontSize: 24,
        color: colors.text
    },
    input: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        color: colors.text,
        maxHeight: 100,
        marginRight: spacing.md,
    },
    sendButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        minWidth: 60,
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: colors.muted,
    },
    sendButtonText: {
        color: colors.white,
        fontWeight: typography.weights.bold,
    },
});
