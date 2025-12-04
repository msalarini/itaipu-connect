import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type MinistryChannelRouteProp = RouteProp<AppStackParamList, 'MinistryChannel'>;
type MinistryChannelNavigationProp = NativeStackNavigationProp<AppStackParamList, 'MinistryChannel'>;

interface Message {
    id: string;
    content: string;
    created_at: string;
    author_id: string;
    author: {
        name: string;
    };
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
                    // Fetch the full message with author to append
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
          author:profiles(name)
        `)
                .eq('ministry_id', ministryId)
                .is('parent_message_id', null) // Only root messages
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error);
            } else {
                setMessages(data as any); // Type casting for simplicity with join
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSingleMessage = async (messageId: string) => {
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
            setMessages((prev) => [...prev, data as any]);
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
            });

            if (error) {
                console.error('Error sending message:', error);
            } else {
                setNewMessage('');
            }
        } catch (error) {
            console.error('Unexpected error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const renderMessageItem = ({ item }: { item: Message }) => {
        const isMyMessage = item.author_id === user?.id;

        return (
            <View style={[
                styles.messageContainer,
                isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
            ]}>
                {!isMyMessage && (
                    <Text style={styles.authorName}>{item.author?.name || 'Desconhecido'}</Text>
                )}
                <View style={[
                    styles.messageBubble,
                    isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
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

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Digite sua mensagem..."
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
