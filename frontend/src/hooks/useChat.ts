import { useEffect } from 'react';
import { useChatStore } from '@/store/chatStore';
import { chatApi } from '@/lib/api/endpoints';
import { useActiveConversation, useSaveMessage, useCreateConversation } from './useConversation';

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

  const sendMessage = async (content: string) => {
    setIsLoading(true);

    // Add user message optimistically
    const userMessage = {
      role: 'user' as const,
      content,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);

    // If no conversation exists, create one first
    if (!conversationId) {
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
        conversationId,
        message: userMessage,
      });
    }

    try {
      const response = await chatApi.sendMessage(content, conversationId || undefined);
      const { message, thread_id, needs_clarification, clarification_questions, itinerary } = response.data;

      // Determinar pasos de progreso basados en la respuesta
      // SOLO mostrar progreso cuando NO hay preguntas de clarificación (está generando itinerario)
      let progressSteps = undefined;
      if (!needs_clarification && !itinerary) {
        // El agente está procesando/generando el itinerario
        progressSteps = [
          { id: 'destination', label: 'Optimizando tu ruta, de principio a fin', completed: false, active: true },
          { id: 'budget', label: 'Escaneando más de 2000 aerolíneas para encontrar el mejor valor', completed: false, active: false },
          { id: 'activities', label: 'Leyendo reseñas 18+ para ti', completed: false, active: false },
          { id: 'hotels', label: 'Buscando hoteles con ofertas solo para Layla', completed: false, active: false },
          { id: 'final', label: 'Adaptando el plan a ti', completed: false, active: false },
        ];
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
        },
      };
      addMessage(assistantMessage);

      // Save assistant message to conversation
      const currentConvId = thread_id || conversationId;
      if (currentConvId) {
        if (thread_id && thread_id !== conversationId) {
          setConversationId(thread_id);
        }
        
        saveMessage({
          conversationId: currentConvId,
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
