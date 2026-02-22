'use client';

import { useState, useCallback } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/components/providers/AuthProvider';
import Image from 'next/image';
import { Sparkles, Send, User, Plane, Building, MapPin as MapPinIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/* ── AI Element components ────────────────────────────────────── */
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { Suggestion } from '@/components/ai-elements/suggestion';
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';

/* ── Chat-specific components ─────────────────────────────────── */
import { ItineraryMessage } from './ItineraryMessage';
import { AdditionalInfoWidget } from './widgets/AdditionalInfoWidget';
import { type DateRange } from 'react-day-picker';

/* ─── Constants ───────────────────────────────────────────────── */

const SUGGESTED_PROMPTS = [
  'Quiero ir a Cusco 5 días con presupuesto medio',
  'Planifica un viaje romántico a Arequipa',
  'Destinos de aventura en Perú para 1 semana',
  'Viaje familiar a playas del norte peruano',
];

/** Map step IDs to lucide icons for ChainOfThought */
function getStepIcon(stepId: string) {
  if (stepId === 'transport') return Plane;
  if (stepId === 'accommodation') return Building;
  if (stepId.startsWith('day-')) return MapPinIcon;
  return CheckCircle2;
}

/* ─── Component ───────────────────────────────────────────────── */

export function ChatSidebar() {
  const { user } = useAuth();
  const {
    messages,
    isLoading,
    sendMessage,
    generatedItinerary,
  } = useChat();

  const [input, setInput] = useState('');

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    '';
  const userAvatar =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  /* ── Handlers ──────────────────────────────────────────────── */

  const handleSuggestionClick = useCallback(
    (prompt: string) => sendMessage(prompt),
    [sendMessage],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        sendMessage(input);
        setInput('');
      }
    },
    [input, isLoading, sendMessage],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit],
  );

  const handleWidgetSubmit = useCallback(
    (data: { dateRange?: DateRange; budgetTotal?: number; currency?: string }) => {
      sendMessage('Información adicional proporcionada', data);
    },
    [sendMessage],
  );

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800">

      {/* ── Conversation area (auto-scroll) ───────────────────── */}
      <Conversation className="flex-1">
        <ConversationContent className="gap-6 px-6 py-6">
          {messages.length === 0 ? (
            /* ── Empty state ────────────────────────────────── */
            <ConversationEmptyState className="max-w-2xl mx-auto">
              {/* Welcome */}
              <div className="text-center mb-8 space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 mb-4">
                  <Sparkles className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userName ? `Hola, ${userName}` : 'Bienvenido a Vora'}
                </h2>
                <p className="text-base text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                  Cuéntame sobre tu próximo viaje y crearé un itinerario personalizado para ti
                </p>
              </div>

              {/* Suggested prompts */}
              <div className="w-full space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Prueba con estas ideas:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <Suggestion
                      key={prompt}
                      suggestion={prompt}
                      onClick={handleSuggestionClick}
                      className="whitespace-normal text-left h-auto py-2.5 px-4 rounded-xl"
                    />
                  ))}
                </div>
              </div>
            </ConversationEmptyState>
          ) : (
            <>
              {/* ── Messages ───────────────────────────────────── */}
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';

                const showWidgets =
                  !isUser &&
                  (msg.metadata?.missingDates || msg.metadata?.missingBudget);
                const showProgress =
                  !isUser &&
                  msg.metadata?.progressSteps &&
                  msg.metadata.progressSteps.length > 0;

                return (
                  <div
                    key={idx}
                    className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden bg-white dark:bg-black flex items-center justify-center">
                      {isUser ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={userAvatar} alt={userName} />
                          <AvatarFallback className="bg-orange-600 dark:bg-orange-500 text-white text-sm">
                            {userName
                              ? userName.charAt(0).toUpperCase()
                              : user?.email?.charAt(0).toUpperCase() ?? (
                                  <User className="h-4 w-4" />
                                )}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <Image
                          src="/images/Vora.webp"
                          alt="Vora"
                          width={32}
                          height={32}
                          className="h-8 w-8 object-cover"
                        />
                      )}
                    </div>

                    {/* Message bubble */}
                    <Message
                      from={msg.role as 'user' | 'assistant'}
                      className="max-w-[85%]"
                    >
                      <MessageContent
                        className={
                          isUser
                            ? 'group-[.is-user]:!bg-orange-600 group-[.is-user]:dark:!bg-orange-500 group-[.is-user]:!text-white group-[.is-user]:!rounded-2xl'
                            : ''
                        }
                      >
                        {isUser ? (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        ) : (
                          <MessageResponse className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
                            {msg.content}
                          </MessageResponse>
                        )}
                      </MessageContent>

                      {/* Widgets (dates / budget) — appear FIRST */}
                      {showWidgets && (
                        <div className="w-full mt-2">
                          <AdditionalInfoWidget
                            onSubmit={handleWidgetSubmit}
                            showDatePicker={msg.metadata?.missingDates}
                            showBudgetSlider={msg.metadata?.missingBudget}
                          />
                        </div>
                      )}

                      {/* Progress (ChainOfThought) — appear SECOND */}
                      {showProgress && (
                        <ChainOfThought defaultOpen className="mt-2">
                          <ChainOfThoughtHeader>
                            Generando tu itinerario…
                          </ChainOfThoughtHeader>
                          <ChainOfThoughtContent>
                            {msg.metadata!.progressSteps!.map((step) => (
                              <ChainOfThoughtStep
                                key={step.id}
                                label={step.label}
                                icon={getStepIcon(step.id)}
                                status={
                                  step.completed
                                    ? 'complete'
                                    : step.active
                                      ? 'active'
                                      : 'pending'
                                }
                              />
                            ))}
                          </ChainOfThoughtContent>
                        </ChainOfThought>
                      )}

                      {/* Timestamp */}
                      {msg.timestamp && (
                        <span className="text-xs text-muted-foreground mt-1 px-1">
                          {new Date(msg.timestamp).toLocaleTimeString('es-PE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </Message>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden bg-white dark:bg-black flex items-center justify-center">
                    <Image
                      src="/images/Vora.webp"
                      alt="Vora"
                      width={32}
                      height={32}
                      className="h-8 w-8 object-cover"
                    />
                  </div>
                  <Message from="assistant">
                    <MessageContent>
                      <div className="flex gap-1 py-2">
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                      </div>
                    </MessageContent>
                  </Message>
                </div>
              )}

              {/* Inline itinerary summary (after all messages) */}
              {generatedItinerary && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 shrink-0" />
                  <div className="flex-1 max-w-[90%]">
                    <ItineraryMessage itinerary={generatedItinerary} />
                  </div>
                </div>
              )}
            </>
          )}
        </ConversationContent>

        <ConversationScrollButton />
      </Conversation>

      {/* ── Input area ────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-end gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl px-4 py-3 focus-within:border-gray-400 dark:focus-within:border-gray-600 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta cualquier cosa..."
              disabled={isLoading}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none max-h-40 overflow-y-auto"
              style={{ minHeight: '24px', maxHeight: '128px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 p-2 bg-orange-600 dark:bg-orange-500 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Enviar mensaje"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
