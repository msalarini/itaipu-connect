import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../services/supabaseClient';
import { Message } from '../../types';

export const THREAD_QUERY_KEY = (rootMessageId: string) => ['thread', rootMessageId];

async function fetchThread(rootMessageId: string) {
    const { data: rootData, error: rootError } = await supabase
        .from('messages')
        .select(`
            id,
            content,
            created_at,
            author_id,
            author:profiles(name),
            attachments:message_attachments(id, file_url, file_type, file_name)
        `)
        .eq('id', rootMessageId)
        .single();

    if (rootError) throw rootError;

    const { data: repliesData, error: repliesError } = await supabase
        .from('messages')
        .select(`
            id,
            content,
            created_at,
            author_id,
            author:profiles(name),
            attachments:message_attachments(id, file_url, file_type, file_name)
        `)
        .eq('parent_message_id', rootMessageId)
        .order('created_at', { ascending: true });

    if (repliesError) throw repliesError;

    return {
        root: rootData as any as Message,
        replies: (repliesData || []) as any as Message[],
    };
}

export function useThread(rootMessageId: string) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: THREAD_QUERY_KEY(rootMessageId),
        queryFn: () => fetchThread(rootMessageId),
        enabled: !!rootMessageId,
    });

    useEffect(() => {
        if (!rootMessageId) return;

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
                async (payload) => {
                    // Optimized: Fetch only the new message
                    const { data, error } = await supabase
                        .from('messages')
                        .select(`
                            id,
                            content,
                            created_at,
                            author_id,
                            author:profiles(name),
                            attachments:message_attachments(id, file_url, file_type, file_name)
                        `)
                        .eq('id', payload.new.id)
                        .single();

                    if (!error && data) {
                        queryClient.setQueryData(THREAD_QUERY_KEY(rootMessageId), (oldData: any) => {
                            if (!oldData) return oldData;
                            // Check uniqueness locally just in case
                            if (oldData.replies.some((r: Message) => r.id === data.id)) return oldData;
                            return {
                                ...oldData,
                                replies: [...oldData.replies, data],
                            };
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [rootMessageId, queryClient]);

    return query;
}

export function useSendMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            ministryId,
            authorId,
            content,
            parentMessageId
        }: {
            ministryId: string,
            authorId: string,
            content: string,
            parentMessageId?: string
        }) => {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    ministry_id: ministryId,
                    author_id: authorId,
                    content: content || '(anexo)',
                    parent_message_id: parentMessageId,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (newMessage, variables) => {
            // If it's a thread reply, invalidating might be enough, 
            // but we already have realtime listener handling updates.
            // Optimistic updates could be added here for even faster feel.
        },
    });
}

export const MINISTRY_MESSAGES_QUERY_KEY = (ministryId: string) => ['ministry_messages', ministryId];

async function fetchMinistryMessages(ministryId: string) {
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

    if (error) throw error;

    return data as any as Message[];
}

export function useMinistryMessages(ministryId: string) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: MINISTRY_MESSAGES_QUERY_KEY(ministryId),
        queryFn: () => fetchMinistryMessages(ministryId),
        enabled: !!ministryId,
    });

    useEffect(() => {
        if (!ministryId) return;

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
                async (payload) => {
                    // Only care about root messages for this view.
                    // Note: Supabase filter might not catch "is parent_message_id null" easily in realtime filter string,
                    // so we filter in the callback or query.
                    if (payload.new.parent_message_id) return;

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
                        .eq('id', payload.new.id)
                        .single();

                    if (!error && data) {
                        queryClient.setQueryData(MINISTRY_MESSAGES_QUERY_KEY(ministryId), (oldData: Message[] | undefined) => {
                            if (!oldData) return [data as any as Message];
                            if (oldData.some(m => m.id === data.id)) return oldData;
                            return [...oldData, data as any as Message];
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [ministryId, queryClient]);

    return query;
}
