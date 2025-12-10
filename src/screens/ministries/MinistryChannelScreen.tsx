import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AttachmentPicker, AttachmentPreview, MessageAttachment } from '../../components';
import { uploadAttachment, validateFile, AttachmentFile } from '../../services/storageService';

type MinistryChannelRouteProp = RouteProp<AppStackParamList, 'MinistryChannel'>;
type MinistryChannelNavigationProp = NativeStackNavigationProp<AppStackParamList, 'MinistryChannel'>;

interface MessageAttachmentData {
    id: string;
    file_url: string;
    file_type: string;
    file_name: string;
}

interface MessageReaction {
    id?: string;
    emoji: string;
    user_id: string;
}

interface Message {
    id: string;
    content: string;
    created_at: string;
    author_id: string;
    author: {
        name: string;
    };
    attachments?: MessageAttachmentData[];
    reactions?: MessageReaction[];
}

export const MinistryChannelScreen: React.FC = () => {
    const route = useRoute<MinistryChannelRouteProp>();
    const navigation = useNavigation<MinistryChannelNavigationProp>();
    const { ministryId } = route.params;
    const { user } = useAuth();

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [selectedFile, setSelectedFile] = useState<AttachmentFile | null>(null);
    const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        fetchMessages();

        // Subscribe to new messages
        const channel = supabase
            .channel(`ministry_messages:${ministryId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `ministry_id=eq.${ministryId}`,
                },
                (payload) => {
                    fetchSingleMessage(payload.new.id);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [ministryId]);

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
          id,
          content,
          created_at,
          author_id,
          author:profiles(name),
          attachments:message_attachments(id, file_url, file_type, file_name),
          reactions:message_reactions(emoji, user_id)
        `)
                .eq('ministry_id', ministryId)
                .is('parent_message_id', null)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error);
            } else {
                setMessages(data as any);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSingleMessage = async (messageId: string, isUpdate = false) => {
        const { data, error } = await supabase
            .from('messages')
            .select(`
        id,
        content,
        created_at,
        author_id,
        author:profiles(name),
        attachments:message_attachments(id, file_url, file_type, file_name),
        reactions:message_reactions(emoji, user_id)
      `)
            .eq('id', messageId)
            .single();

        if (!error && data) {
            setMessages((prev) => {
                const exists = prev.find(m => m.id === messageId);
                if (exists) {
                    return prev.map(m => m.id === messageId ? data as any : m);
                }
                return [...prev, data as any];
            });
            if (!isUpdate) {
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            }
        }
    };

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

        setSending(true);
        try {
            // 1. Criar mensagem primeiro
            const { data: messageData, error: messageError } = await supabase
                .from('messages')
                .insert({
                    ministry_id: ministryId,
                    author_id: user.id,
                    content: newMessage.trim() || '(anexo)',
                })
                .select()
                .single();

            if (messageError || !messageData) {
                throw new Error('Erro ao criar mensagem');
            }

            // 2. Se há anexo, fazer upload
            if (selectedFile) {
                const uploadResult = await uploadAttachment(selectedFile, messageData.id, ministryId);

                // 3. Salvar referência na tabela message_attachments
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

            // Limpar estados
            setNewMessage('');
            setSelectedFile(null);
        } catch (error: any) {
            console.error('Error sending message:', error);
            Alert.alert('Erro', error.message || 'Não foi possível enviar a mensagem');
        } finally {
            setSending(false);
        }
    };

    // --- Reaction Logic ---
    const [reactingToMessageId, setReactingToMessageId] = useState<string | null>(null);
    const AVAILABLE_REACTIONS = ['👍', '❤️', '😂', '😮', '🙏', '🎉'];

    const handleToggleReaction = async (messageId: string, emoji: string) => {
        if (!user) return;
        setReactingToMessageId(null); // Close modal if open

        try {
            // Check if user already reacted with this emoji
            const message = messages.find(m => m.id === messageId);
            const existingReaction = message?.reactions?.find(r => r.emoji === emoji && r.user_id === user.id);

            if (existingReaction) {
                // Remove reaction
                await supabase
                    .from('message_reactions')
                    .delete()
                    .eq('message_id', messageId)
                    .eq('user_id', user.id)
                    .eq('emoji', emoji);
            } else {
                // Add reaction
                await supabase
                    .from('message_reactions')
                    .insert({
                        message_id: messageId,
                        user_id: user.id,
                        emoji
                    });
            }

            // Refresh this message specifically to get latest state
            fetchSingleMessage(messageId, true);

        } catch (error) {
            console.error('Error toggling reaction:', error);
        }
    };

    const renderMessageItem = ({ item }: { item: Message }) => {
        const isMyMessage = item.author_id === user?.id;
        const attachment = item.attachments && item.attachments.length > 0 ? item.attachments[0] : null;

        // Group reactions
        const reactionCounts = item.reactions?.reduce((acc, curr) => {
            acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const userReactions = item.reactions?.filter(r => r.user_id === user?.id).map(r => r.emoji) || [];

        return (
            <View style={[
                styles.messageContainer,
                isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
            ]}>
                {!isMyMessage && (
                    <Text style={styles.authorName}>{item.author?.name || 'Desconhecido'}</Text>
                )}
                <TouchableOpacity
                    onLongPress={() => setReactingToMessageId(item.id)}
                    delayLongPress={300}
                    activeOpacity={0.9}
                    style={[
                        styles.messageBubble,
                        isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
                    ]}
                >
                    {item.content && item.content !== '(anexo)' && (
                        <Text style={[
                            styles.messageText,
                            isMyMessage ? styles.myMessageText : styles.otherMessageText
                        ]}>
                            {item.content}
                        </Text>
                    )}

                    {attachment && (
                        <MessageAttachment
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

                    {/* Reactions Display */}
                    {reactionCounts && Object.keys(reactionCounts).length > 0 && (
                        <View style={styles.reactionsContainer}>
                            {Object.entries(reactionCounts).map(([emoji, count]) => {
                                const iReacted = userReactions.includes(emoji);
                                return (
                                    <TouchableOpacity
                                        key={emoji}
                                        style={[styles.reactionBadge, iReacted && styles.reactionBadgeActive]}
                                        onPress={() => handleToggleReaction(item.id, emoji)}
                                    >
                                        <Text style={styles.reactionText}>{emoji} {count}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.navigate('Thread', { rootMessageId: item.id, ministryId })}
                    style={styles.threadButton}
                >
                    <Text style={styles.threadButtonText}>Responder</Text>
                </TouchableOpacity>
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
                    data={messages}
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
                    placeholder="Digite sua mensagem..."
                    placeholderTextColor={colors.textMuted}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                />

                <TouchableOpacity
                    style={[styles.sendButton, (!newMessage.trim() && !selectedFile) && styles.sendButtonDisabled]}
                    onPress={handleSendMessage}
                    disabled={(!newMessage.trim() && !selectedFile) || sending}
                >
                    {sending ? (
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

            {/* Reaction Picker Modal (Simple Overlay) */}
            {reactingToMessageId && (
                <TouchableOpacity
                    style={styles.reactionOverlay}
                    activeOpacity={1}
                    onPress={() => setReactingToMessageId(null)}
                >
                    <View style={styles.reactionPicker}>
                        {AVAILABLE_REACTIONS.map(emoji => (
                            <TouchableOpacity
                                key={emoji}
                                style={styles.reactionOption}
                                onPress={() => handleToggleReaction(reactingToMessageId, emoji)}
                            >
                                <Text style={styles.reactionOptionText}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            )}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
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
    threadButton: {
        marginTop: 2,
        paddingHorizontal: spacing.xs,
    },
    threadButtonText: {
        fontSize: typography.sizes.xs,
        color: colors.primary,
        fontWeight: typography.weights.medium,
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
    // Reactions Styles
    reactionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
        gap: 4,
    },
    reactionBadge: {
        backgroundColor: colors.backgroundCard,
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: colors.border,
    },
    reactionBadgeActive: {
        backgroundColor: colors.primary + '20', // 20% opacity primary
        borderColor: colors.primary,
    },
    reactionText: {
        fontSize: 10,
        color: colors.text,
    },
    reactionOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    reactionPicker: {
        backgroundColor: colors.backgroundCard,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        flexDirection: 'row',
        gap: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    reactionOption: {
        padding: spacing.xs,
    },
    reactionOptionText: {
        fontSize: 24,
    },
});
