import { useChatStore } from '@/store/chatStore';
import { chatApi } from '@/lib/api/endpoints';

export function useChat() {
  const { messages, conversationId, isLoading, addMessage, setConversationId, setIsLoading } =
    useChatStore();

  const sendMessage = async (content: string) => {
    setIsLoading(true);

    // Add user message
    const userMessage = {
      role: 'user' as const,
      content,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);

    try {
      const response = await chatApi.sendMessage(content, conversationId || undefined);
      const { message, conversation_id } = response.data;

      // Add assistant message
      const assistantMessage = {
        role: 'assistant' as const,
        content: message,
        timestamp: new Date().toISOString(),
      };
      addMessage(assistantMessage);

      if (conversation_id) {
        setConversationId(conversation_id);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.detail || 'Failed to send message' };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    conversationId,
    isLoading,
    sendMessage,
  };
}
