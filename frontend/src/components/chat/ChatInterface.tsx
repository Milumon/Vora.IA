'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/components/providers/AuthProvider';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ItineraryProgress } from './ItineraryProgress';
import { ItinerarySummaryCard } from './ItinerarySummaryCard';
import { Card } from '@/components/ui/card';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { itinerariesApi } from '@/lib/api/endpoints';

const SUGGESTED_PROMPTS = [
  'Quiero ir a Cusco 5 días con presupuesto medio',
  'Planifica un viaje romántico a Arequipa',
  'Destinos de aventura en Perú para 1 semana',
  'Viaje familiar a playas del norte peruano',
];

export function ChatInterface() {
  const t = useTranslations('chat');
  const locale = useLocale();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { 
    messages, 
    isLoading, 
    currentProgress, 
    generatedItinerary,
    sendMessage, 
    setSelectedPlace 
  } = useChat();
  const [showSuggestions, setShowSuggestions] = useState(messages.length === 0);
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generatedItinerary]);

  useEffect(() => {
    setShowSuggestions(messages.length === 0);
  }, [messages.length]);

  const handleSuggestionClick = (prompt: string) => {
    setShowSuggestions(false);
    sendMessage(prompt);
  };

  const handleSendMessage = (message: string) => {
    sendMessage(message);
  };

  const handlePlaceClick = (place: any) => {
    setSelectedPlace(place);
    // Scroll suave al mapa (si está visible)
    // Esto se manejará en la página principal
  };

  const handleSaveItinerary = async () => {
    if (!generatedItinerary) return;
    if (!user) {
      alert('Debes iniciar sesión para guardar itinerarios.');
      router.push(`/${locale}/auth/login`);
      return;
    }

    try {
      const response = await itinerariesApi.create({
        title: generatedItinerary.title,
        description: generatedItinerary.description,
        destination: (generatedItinerary as any).destination || generatedItinerary.day_plans?.[0]?.morning?.[0]?.address || 'Perú',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + generatedItinerary.day_plans.length * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        days: generatedItinerary.day_plans.length,
        budget: (generatedItinerary as any).budget || 'medium',
        travel_style: Array.isArray((generatedItinerary as any).travel_style) 
          ? (generatedItinerary as any).travel_style?.join(', ') 
          : (generatedItinerary as any).travel_style,
        travelers: (generatedItinerary as any).travelers || 1,
        data: generatedItinerary,
      });

      alert('¡Itinerario guardado exitosamente!');
      router.push(`/${locale}/itineraries/${response.data.id}`);
    } catch (error: any) {
      console.error('Error guardando itinerario:', error);
      const msg = error.response?.data?.detail || error.message || 'Error al guardar';
      alert(`Error al guardar el itinerario: ${msg}`);
    }
  };

  const handleShareItinerary = () => {
    // Implementar funcionalidad de compartir
    if (navigator.share && generatedItinerary) {
      navigator.share({
        title: generatedItinerary.title,
        text: generatedItinerary.description,
        url: window.location.href,
      }).catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace copiado al portapapeles!');
    }
  };

  // Obtener el último mensaje del asistente con metadata
  const lastAssistantMessage = messages
    .slice()
    .reverse()
    .find((m) => m.role === 'assistant');

  const showProgress = currentProgress && currentProgress.length > 0;
  const clarificationQuestions = lastAssistantMessage?.metadata?.clarificationQuestions || [];

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
              {/* Welcome Message */}
              <div className="text-center mb-8 space-y-3">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden bg-primary/10 mb-4 shadow-lg">
                  <Image
                    src="/images/Vora.webp"
                    alt="Vora"
                    width={80}
                    height={80}
                    className="object-cover"
                  />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {userName ? t('welcomeWithName', { name: userName }) : t('welcome')}
                </h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  {t('welcomeDescription')}
                </p>
              </div>

              {/* Suggested Prompts */}
              {showSuggestions && (
                <div className="w-full max-w-2xl space-y-3">
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    {t('suggestedPrompts.title')}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SUGGESTED_PROMPTS.map((prompt, idx) => (
                      <Card
                        key={idx}
                        className="p-4 cursor-pointer hover:shadow-layered hover:border-primary/50 transition-all group"
                        onClick={() => handleSuggestionClick(prompt)}
                      >
                        <p className="text-sm text-foreground group-hover:text-primary transition-colors">
                          {prompt}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((message, idx) => (
                <div key={idx}>
                  <MessageBubble message={message} />
                </div>
              ))}
              
              {isLoading && <TypingIndicator />}
              
              {/* Mostrar resumen del itinerario si está disponible */}
              {generatedItinerary && !isLoading && (
                <div className="mt-6">
                  <ItinerarySummaryCard
                    itinerary={generatedItinerary}
                    onPlaceClick={handlePlaceClick}
                    onSave={handleSaveItinerary}
                    onShare={handleShareItinerary}
                  />
                </div>
              )}
              
              {/* Mostrar progreso SOLO cuando está generando itinerario (sin preguntas pendientes) */}
              {showProgress && !isLoading && !generatedItinerary && !clarificationQuestions.length && (
                <div className="mb-4">
                  <ItineraryProgress steps={currentProgress} />
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto max-w-3xl px-4 py-4">
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
            placeholder={generatedItinerary ? "Escribe para hacer ajustes al itinerario..." : t('inputPlaceholder')}
          />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Presiona Enter para enviar, Shift+Enter para nueva línea
          </p>
        </div>
      </div>
    </div>
  );
}
