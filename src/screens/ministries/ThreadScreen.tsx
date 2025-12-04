import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ThreadRouteProp = RouteProp<AppStackParamList, 'Thread'>;

interface Message {
    id: string;
    content: string;
    created_at: string;
    author_id: string;
    author: {
        name: string;
    };
}

export const ThreadScreen: React.FC = () => {
    const route = useRoute<ThreadRouteProp>();
    const { rootMessageId, ministryId } = route.params;
    const { user } = useAuth();

    const [rootMessage, setRootMessage] = useState<Message | null>(null);
    const [replies, setReplies] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        fetchThread();

        // Subscribe to new replies
        const channel = supabase
            .channel(`thread:${rootMessageId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `parent_message_id=eq.${rootMessageId}`,
                },
                (payload) => {
                    fetchSingleReply(payload.new.id);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [rootMessageId]);

    const fetchThread = async () => {
        try {
            // Fetch root message
            const { data: rootData, error: rootError } = await supabase
                .from('messages')
                .select(`
          id,
          content,
          created_at,
          author_id,
          author:profiles(name)
        `)
                .eq('id', rootMessageId)
                .single();

            if (rootError) throw rootError;
            setRootMessage(rootData as any);

            // Fetch replies
            const { data: repliesData, error: repliesError } = await supabase
                .from('messages')
                .select(`
          id,
          content,
          created_at,
          author_id,
          author:profiles(name)
        `)
                .eq('parent_message_id', rootMessageId)
                .order('created_at', { ascending: true });

            if (repliesError) throw repliesError;
            setReplies(repliesData as any);

        } catch (error) {
            console.error('Error fetching thread:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSingleReply = async (messageId: string) => {
        const { data, error } = await supabase
            .from('messages')
            .select(`
        id,
        content,
        created_at,
        author_id,
        author:profiles(name)
      `)
            .eq('id', messageId)
            .single();

        if (!error && data) {
            setReplies((prev) => [...prev, data as any]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user) return;

        setSending(true);
        try {
            const { error } = await supabase.from('messages').insert({
                ministry_id: ministryId,
                author_id: user.id,
                content: newMessage.trim(),
                parent_message_id: rootMessageId,
            });

            if (error) {
                console.error('Error sending reply:', error);
            } else {
                setNewMessage('');
            }
        } catch (error) {
            console.error('Unexpected error sending reply:', error);
        } finally {
            setSending(false);
        }
    };

    const renderMessageItem = ({ item, isRoot = false }: { item: Message; isRoot?: boolean }) => {
        const isMyMessage = item.author_id === user?.id;

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
                    <Text style={[
                        styles.messageText,
                        isMyMessage ? styles.myMessageText : styles.otherMessageText
                    ]}>
                        {item.content}
                    </Text>
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

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Responder na thread..."
                    placeholderTextColor={colors.textMuted}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                    onPress={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                >
                    <Text style={styles.sendButtonText}>Enviar</Text>
                </TouchableOpacity>
            </View>
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
    },
    myMessageTime: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    otherMessageTime: {
        color: colors.textMuted,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: spacing.md,
        backgroundColor: colors.backgroundCard,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        alignItems: 'center',
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
    },
    sendButtonDisabled: {
        backgroundColor: colors.muted,
    },
    sendButtonText: {
        color: colors.white,
        fontWeight: typography.weights.bold,
    },
});
