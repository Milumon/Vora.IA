import { useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { chatApi } from '@/lib/api/endpoints';
import { useActiveConversation, useSaveMessage, useCreateConversation } from './useConversation';
import { type DateRange } from 'react-day-picker';
import { format } from 'date-fns';

export function useChat() {
  const {
    messages,
    conversationId,
    isLoading,
    currentProgress,
    generatedItinerary,
    showMapView,
    selectedPlace,
    addMessage,
    setMessages,
    setConversationId,
    setIsLoading,
    setCurrentProgress,
    setGeneratedItinerary,
    setSelectedPlace,
  } = useChatStore();

  // Fetch active conversation on mount
  const { data: activeConversation } = useActiveConversation();
  const { mutate: saveMessage } = useSaveMessage();
  const { mutate: createConversation } = useCreateConversation();

  // Hydrate Zustand from React Query when conversation loads
  useEffect(() => {
    if (activeConversation && !conversationId) {
      setMessages(activeConversation.messages);
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
      // Build filters from metadata
      const filters = meta ? {
        currency: meta.currency,
        budget_total: meta.budgetTotal,
        check_in: meta.dateRange?.from ? format(meta.dateRange.from, 'yyyy-MM-dd') : undefined,
        check_out: meta.dateRange?.to ? format(meta.dateRange.to, 'yyyy-MM-dd') : undefined,
      } : undefined;

      // Send to the chat API with the current thread_id
      const response = await chatApi.sendMessage(content, currentConvId || undefined, filters);
      const { message, thread_id, needs_clarification, clarification_questions, itinerary, missing_dates, missing_budget } = response.data;

      // Always update conversationId from the backend response
      if (thread_id && thread_id !== currentConvId) {
        setConversationId(thread_id);
      }

      // Determinar pasos de progreso basados en la respuesta
      // SOLO mostrar progreso cuando NO hay preguntas de clarificación (está generando itinerario)
      let progressSteps = undefined;
      if (!needs_clarification && !itinerary) {
        // Calcular número de días si hay fechas disponibles
        let numberOfDays = 3; // default
        if (filters?.check_in && filters?.check_out) {
          const checkIn = new Date(filters.check_in);
          const checkOut = new Date(filters.check_out);
          numberOfDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        }

        // Generar pasos de progreso dinámicos
        progressSteps = [
          { id: 'transport', label: 'Búsqueda de transporte', completed: false, active: true },
          { id: 'accommodation', label: 'Búsqueda de alojamiento', completed: false, active: false },
        ];

        // Agregar búsqueda de lugares para cada día
        for (let i = 1; i <= numberOfDays; i++) {
          progressSteps.push({
            id: `day-${i}`,
            label: `Búsqueda de lugares para el día ${i}`,
            completed: false,
            active: false,
          });
        }

        // Agregar paso final
        progressSteps.push({
          id: 'final',
          label: 'Generando itinerario personalizado',
          completed: false,
          active: false,
        });
      }

      // Add assistant message with metadata
      const assistantMessage = {
        role: 'assistant' as const,
        content: message,
        timestamp: new Date().toISOString(),
        metadata: {
          needsClarification: needs_clarification,
          clarificationQuestions: clarification_questions,
          progressSteps,
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

      if (progressSteps) {
        setCurrentProgress(progressSteps);
      }

      // Detectar si se generó un itinerario
      if (itinerary) {
        setGeneratedItinerary(itinerary);
      }

      return { success: true };
    } catch (error: any) {
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
    generatedItinerary,
    showMapView,
    selectedPlace,
    sendMessage,
    setSelectedPlace,
  };
}
