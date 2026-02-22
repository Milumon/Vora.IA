import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useCurrencyStore } from '@/store/currencyStore';
import { chatApi } from '@/lib/api/endpoints';
import { useActiveConversation, useSaveMessage, useCreateConversation } from './useConversation';
import { type DateRange } from 'react-day-picker';
import { format } from 'date-fns';

/** Interval (ms) between each percentage tick */
const TICK_INTERVAL = 400;
/** Max percentage while waiting for backend (real 100% is set on response) */
const MAX_WAIT_PERCENT = 92;

export function useChat() {
  const {
    messages,
    conversationId,
    isLoading,
    currentProgress,
    progressPercent,
    generatedItinerary,
    showMapView,
    selectedPlace,
    addMessage,
    setMessages,
    setConversationId,
    setIsLoading,
    setCurrentProgress,
    setProgressPercent,
    setGeneratedItinerary,
    setSelectedPlace,
  } = useChatStore();

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const percentRef = useRef(0);

  /** Start an animated 0→~92% ticker */
  const startPercentTicker = useCallback(() => {
    percentRef.current = 0;
    setProgressPercent(0);
    tickRef.current = setInterval(() => {
      // Ease-out: increments get smaller as we approach MAX_WAIT_PERCENT
      const remaining = MAX_WAIT_PERCENT - percentRef.current;
      const increment = Math.max(0.5, remaining * 0.06);
      percentRef.current = Math.min(MAX_WAIT_PERCENT, percentRef.current + increment);
      setProgressPercent(Math.round(percentRef.current));
    }, TICK_INTERVAL);
  }, [setProgressPercent]);

  /** Stop ticker and jump to 100%, then clear after a brief delay */
  const stopPercentTicker = useCallback((completed: boolean) => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (completed) {
      setProgressPercent(100);
      // Keep 100% visible briefly, then clear
      setTimeout(() => setProgressPercent(null), 1200);
    } else {
      setProgressPercent(null);
    }
  }, [setProgressPercent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const { currency } = useCurrencyStore();

  // Fetch active conversation on mount
  const { data: activeConversation } = useActiveConversation();
  const { mutate: saveMessage } = useSaveMessage();
  const { mutate: createConversation } = useCreateConversation();

  // Hydrate Zustand from React Query when conversation loads
  useEffect(() => {
    if (activeConversation && !conversationId) {
      setMessages(
        activeConversation.messages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp || new Date().toISOString(),
        }))
      );
      setConversationId(activeConversation.id);

      // If there's a latest itinerary, restore it
      if (activeConversation.latest_itinerary) {
        setGeneratedItinerary(activeConversation.latest_itinerary);
      }
    }
  }, [activeConversation, conversationId, setMessages, setConversationId, setGeneratedItinerary]);

  const sendMessage = async (
    content: string,
    meta?: { dateRange?: DateRange; budgetTotal?: number; currency?: string },
  ) => {
    setIsLoading(true);

    // Capture the current conversationId at call time to avoid stale state
    const currentConvId = useChatStore.getState().conversationId;

    // Add user message optimistically
    const userMessage = {
      role: 'user' as const,
      content,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);

    // If no conversation exists, create one first
    if (!currentConvId) {
      createConversation(undefined, {
        onSuccess: (newConv) => {
          setConversationId(newConv.id);
          // Save user message to new conversation
          saveMessage({
            conversationId: newConv.id,
            message: userMessage,
          });
        },
      });
    } else {
      // Save user message to existing conversation
      saveMessage({
        conversationId: currentConvId,
        message: userMessage,
      });
    }

    try {
      // Build filters — currency siempre se pasa desde el store global;
      // check_in/check_out/budget_total solo cuando vienen de los widgets.
      const filters = {
        currency: meta?.currency ?? currency,
        budget_total: meta?.budgetTotal,
        check_in: meta?.dateRange?.from ? format(meta.dateRange.from, 'yyyy-MM-dd') : undefined,
        check_out: meta?.dateRange?.to ? format(meta.dateRange.to, 'yyyy-MM-dd') : undefined,
      };

      // Start animated percentage indicator
      startPercentTicker();

      // Send to the chat API with the current thread_id
      const response = await chatApi.sendMessage(content, currentConvId || undefined, filters);
      const { message, thread_id, needs_clarification, clarification_questions, itinerary, missing_dates, missing_budget } = response.data;

      // Always update conversationId from the backend response
      if (thread_id && thread_id !== currentConvId) {
        setConversationId(thread_id);
      }

      // Stop the percentage ticker — jump to 100% if itinerary is ready
      stopPercentTicker(!!itinerary);

      // Add assistant message with metadata
      const assistantMessage = {
        role: 'assistant' as const,
        content: message,
        timestamp: new Date().toISOString(),
        metadata: {
          needsClarification: needs_clarification,
          clarificationQuestions: clarification_questions,
          missingDates: missing_dates,
          missingBudget: missing_budget,
        },
      };
      addMessage(assistantMessage);

      // Save assistant message to conversation
      const resolvedConvId = thread_id || currentConvId;
      if (resolvedConvId) {
        saveMessage({
          conversationId: resolvedConvId,
          message: assistantMessage,
        });
      }

      // Detectar si se generó un itinerario
      if (itinerary) {
        setGeneratedItinerary(itinerary);
      }

      return { success: true };
    } catch (error: any) {
      // Stop progress on error
      stopPercentTicker(false);

      // Add error message
      const errorMessage = {
        role: 'assistant' as const,
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
        timestamp: new Date().toISOString(),
      };
      addMessage(errorMessage);

      return { success: false, error: error.response?.data?.detail || 'Failed to send message' };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    threadId: conversationId,
    isLoading,
    currentProgress,
    progressPercent,
    generatedItinerary,
    showMapView,
    selectedPlace,
    sendMessage,
    setSelectedPlace,
  };
}
