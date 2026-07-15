import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  read_at?: string | null;
  expires_at?: string | null;
  status?: string | null;
  reactions?: MessageReaction[];
  sender?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  expiration_seconds: number | null;
  participants: ConversationParticipant[];
  last_message?: Message;
  unread_count: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string | null;
  is_muted: boolean;
  profile?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    school_name: string | null;
    grade_or_year: string | null;
  };
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch conversations where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      if (!participantData || participantData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = participantData.map(p => p.conversation_id);

      // Fetch full conversation data
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Fetch participants for each conversation
      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          // Get participants
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('*')
            .eq('conversation_id', conv.id);

          // Get participant profiles
          const participantProfiles = await Promise.all(
            (participants || []).map(async (p) => {
              const { data: profile } = await supabase
                .from('public_profiles')
                .select('id, display_name, avatar_url, school_name, grade_or_year')
                .eq('id', p.user_id)
                .maybeSingle();
              return { ...p, profile };
            })
          );

          // Get last message
          const { data: lastMessages } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .eq('is_deleted', false)
            .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1);

          // Calculate unread count
          const myParticipation = participantProfiles.find(p => p.user_id === user.id);
          let unreadCount = 0;
          
          if (myParticipation?.last_read_at) {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .neq('sender_id', user.id)
              .gt('created_at', myParticipation.last_read_at);
            unreadCount = count || 0;
          } else {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .neq('sender_id', user.id);
            unreadCount = count || 0;
          }

          return {
            ...conv,
            participants: participantProfiles,
            last_message: lastMessages?.[0],
            unread_count: unreadCount,
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const channel: RealtimeChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;

    // Uses SECURITY DEFINER RPC so read_at / expires_at get computed atomically
    await supabase.rpc('mark_conversation_read', {
      _conversation_id: conversationId,
    });

    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, unread_count: 0 } : c)
    );
  }, [user]);

  const toggleMute = useCallback(async (conversationId: string) => {
    if (!user) return;

    const conv = conversations.find(c => c.id === conversationId);
    const participation = conv?.participants.find(p => p.user_id === user.id);
    
    if (!participation) return;

    await supabase
      .from('conversation_participants')
      .update({ is_muted: !participation.is_muted })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    fetchConversations();
  }, [user, conversations, fetchConversations]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    // Remove user from participants (soft delete)
    await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    setConversations(prev => prev.filter(c => c.id !== conversationId));
  }, [user]);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
    markAsRead,
    toggleMute,
    deleteConversation,
  };
}

export function useMessages(conversationId: string | undefined) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Fetch sender profiles and reactions
      const messagesWithDetails = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from('public_profiles')
            .select('id, display_name, avatar_url')
            .eq('id', msg.sender_id)
            .maybeSingle();

          const { data: reactions } = await supabase
            .from('message_reactions')
            .select('*')
            .eq('message_id', msg.id);

          return {
            ...msg,
            sender: profile,
            reactions: reactions || [],
          };
        })
      );

      setMessages(messagesWithDetails);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel: RealtimeChannel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Fetch sender profile
          const { data: profile } = await supabase
            .from('public_profiles')
            .select('id, display_name, avatar_url')
            .eq('id', newMessage.sender_id)
            .maybeSingle();

          setMessages(prev => [...prev, { ...newMessage, sender: profile, reactions: [] }]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages(prev =>
            prev.map(m => (m.id === updated.id ? { ...m, ...updated } : m))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const oldRow = payload.old as { id?: string };
          if (!oldRow?.id) return;
          setMessages(prev => prev.filter(m => m.id !== oldRow.id));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, fetchMessages]);

  // Client-side expiration ticker: hides messages once expires_at passes,
  // even if the server hasn't hard-deleted them yet. Also opportunistically
  // asks the server to purge every 60s so the disappearance is real for
  // everyone in the conversation.
  useEffect(() => {
    if (!conversationId) return;
    let purgeCounter = 0;
    const tick = () => {
      const now = Date.now();
      setMessages(prev => {
        const next = prev.filter(m => !m.expires_at || new Date(m.expires_at).getTime() > now);
        return next.length === prev.length ? prev : next;
      });
      purgeCounter += 1;
      if (purgeCounter % 12 === 0) {
        // Every ~60s, hard-purge on the server so peers also lose the row.
        supabase.rpc('purge_expired_messages').then(() => {});
      }
    };
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId || !user || !content.trim()) return null;

    const { data, error: sendError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (sendError) throw sendError;
    return data;
  }, [conversationId, user]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user) return;

    await supabase
      .from('messages')
      .update({ is_deleted: true })
      .eq('id', messageId)
      .eq('sender_id', user.id);

    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, [user]);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;

    // Check if reaction exists
    const { data: existing } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .maybeSingle();

    if (existing) {
      // Remove reaction
      await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existing.id);
    } else {
      // Add reaction
      await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji,
        });
    }
  }, [user]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    deleteMessage,
    addReaction,
    refetch: fetchMessages,
  };
}

export async function createConversation(participantIds: string[]): Promise<string | null> {
  // Direct (1:1) conversation creation goes through a SECURITY DEFINER RPC
  // so users cannot add themselves to arbitrary conversations.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const other = participantIds.find((id) => id !== user.id);
  if (!other) return null;
  const { data, error } = await supabase.rpc('create_direct_conversation', {
    other_user_id: other,
  });
  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }
  return (data as string) ?? null;
}

export async function findExistingConversation(userId1: string, userId2: string): Promise<string | null> {
  // Find a conversation where both users are participants
  const { data: user1Conversations } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId1);

  if (!user1Conversations || user1Conversations.length === 0) return null;

  const conversationIds = user1Conversations.map(c => c.conversation_id);

  const { data: sharedConversation } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId2)
    .in('conversation_id', conversationIds)
    .limit(1)
    .maybeSingle();

  return sharedConversation?.conversation_id || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Expiration policy helpers
// ─────────────────────────────────────────────────────────────────────────────

export const EXPIRATION_PRESETS: { label: string; seconds: number | null }[] = [
  { label: 'Never Delete', seconds: null },
  { label: '30 Minutes', seconds: 30 * 60 },
  { label: '1 Hour', seconds: 60 * 60 },
  { label: '24 Hours', seconds: 24 * 60 * 60 },
  { label: '7 Days', seconds: 7 * 24 * 60 * 60 },
  { label: '30 Days', seconds: 30 * 24 * 60 * 60 },
];

export function formatExpirationLabel(seconds: number | null | undefined): string {
  if (!seconds) return 'Messages never disappear';
  if (seconds < 3600) {
    const m = Math.round(seconds / 60);
    return `Messages disappear after ${m} minute${m === 1 ? '' : 's'}`;
  }
  if (seconds < 86400) {
    const h = Math.round(seconds / 3600);
    return `Messages disappear after ${h} hour${h === 1 ? '' : 's'}`;
  }
  const d = Math.round(seconds / 86400);
  return `Messages disappear after ${d} day${d === 1 ? '' : 's'}`;
}

export function useConversationExpiration(conversationId: string | undefined) {
  const [expirationSeconds, setExpirationSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!conversationId) {
      setExpirationSeconds(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('conversations')
      .select('expiration_seconds')
      .eq('id', conversationId)
      .maybeSingle();
    setExpirationSeconds((data?.expiration_seconds as number | null) ?? null);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`conv-exp-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as { expiration_seconds: number | null };
          setExpirationSeconds(row.expiration_seconds ?? null);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const updateExpiration = useCallback(
    async (seconds: number | null, applyToExisting = false) => {
      if (!conversationId) return;
      const { error } = await supabase.rpc('set_conversation_expiration', {
        _conversation_id: conversationId,
        _expiration_seconds: seconds,
        _apply_to_existing: applyToExisting,
      });
      if (error) throw error;
      setExpirationSeconds(seconds);
    },
    [conversationId],
  );

  return { expirationSeconds, loading, updateExpiration, refetch };
}
