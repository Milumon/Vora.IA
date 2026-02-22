import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
    metadata?: Record<string, any>;
}

export interface Conversation {
    id: string;
    user_id: string;
    title?: string;
    is_active: boolean;
    messages: Message[];
    last_message_at: string;
    created_at: string;
    updated_at: string;
}

export interface ConversationWithItinerary extends Conversation {
    latest_itinerary?: any;
}

// ── Supabase Conversations API ────────────────────────────────────────────────

const supabase = createClientComponentClient();

export const conversationsApi = {
    /** Get the currently active conversation for the logged-in user */
    getActive: async (): Promise<ConversationWithItinerary | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    /** Create a new conversation, deactivating any previous active one */
    create: async (): Promise<Conversation> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Deactivate any currently active conversations
        await supabase
            .from('conversations')
            .update({ is_active: false })
            .eq('user_id', user.id)
            .eq('is_active', true);

        // Create new active conversation
        const { data, error } = await supabase
            .from('conversations')
            .insert({
                user_id: user.id,
                is_active: true,
                messages: [],
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /** Add a message to an existing conversation */
    addMessage: async (
        conversationId: string,
        message: { role: 'user' | 'assistant'; content: string; metadata?: any },
    ): Promise<Conversation> => {
        // First, get the current messages
        const { data: current, error: fetchError } = await supabase
            .from('conversations')
            .select('messages')
            .eq('id', conversationId)
            .single();

        if (fetchError) throw fetchError;

        const updatedMessages = [
            ...(current?.messages || []),
            { ...message, timestamp: new Date().toISOString() },
        ];

        const { data, error } = await supabase
            .from('conversations')
            .update({
                messages: updatedMessages,
                last_message_at: new Date().toISOString(),
            })
            .eq('id', conversationId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /** Deactivate a conversation */
    deactivate: async (conversationId: string): Promise<void> => {
        const { error } = await supabase
            .from('conversations')
            .update({ is_active: false })
            .eq('id', conversationId);

        if (error) throw error;
    },
};
