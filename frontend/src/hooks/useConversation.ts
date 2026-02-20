import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationsApi, type Conversation, type ConversationWithItinerary } from '@/lib/api/conversations';
import { useAuth } from '@/components/providers/AuthProvider';

// Query keys
export const conversationKeys = {
  all: ['conversations'] as const,
  active: () => [...conversationKeys.all, 'active'] as const,
  detail: (id: string) => [...conversationKeys.all, id] as const,
};

/**
 * Hook to fetch the active conversation
 * Automatically loads on mount and caches for 7 days
 */
export function useActiveConversation() {
  const { user } = useAuth();

  return useQuery({
    queryKey: conversationKeys.active(),
    queryFn: conversationsApi.getActive,
    enabled: !!user, // Only fetch if user is logged in
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

/**
 * Hook to create a new conversation
 * Automatically deactivates the previous active conversation
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: conversationsApi.create,
    onSuccess: (newConversation) => {
      // Update the active conversation cache
      queryClient.setQueryData(conversationKeys.active(), newConversation);
    },
  });
}

/**
 * Hook to save a message to a conversation
 * Uses optimistic updates for instant UI feedback
 */
export function useSaveMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      conversationId, 
      message 
    }: { 
      conversationId: string; 
      message: { role: 'user' | 'assistant'; content: string; metadata?: any } 
    }) => {
      return conversationsApi.addMessage(conversationId, message);
    },
    onMutate: async ({ conversationId, message }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: conversationKeys.active() });

      // Snapshot previous value
      const previousConversation = queryClient.getQueryData<ConversationWithItinerary>(
        conversationKeys.active()
      );

      // Optimistically update
      if (previousConversation) {
        queryClient.setQueryData<ConversationWithItinerary>(
          conversationKeys.active(),
          {
            ...previousConversation,
            messages: [
              ...previousConversation.messages,
              {
                ...message,
                timestamp: new Date().toISOString(),
              },
            ],
            last_message_at: new Date().toISOString(),
          }
        );
      }

      return { previousConversation };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousConversation) {
        queryClient.setQueryData(
          conversationKeys.active(),
          context.previousConversation
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: conversationKeys.active() });
    },
  });
}

/**
 * Hook to deactivate a conversation (start new conversation)
 */
export function useDeactivateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: conversationsApi.deactivate,
    onSuccess: () => {
      // Clear the active conversation cache
      queryClient.setQueryData(conversationKeys.active(), null);
    },
  });
}
