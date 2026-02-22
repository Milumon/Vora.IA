'use client';

/**
 * ChatPanel — the in-conversation view.
 *
 * Shown after the first hero message is sent, while Vora is still
 * gathering info (before the itinerary is ready).
 * Uses AI element components: Conversation, Message, ChainOfThought, Plan/Queue.
 */

import { useCallback } from 'react';
import Image from 'next/image';
import { User, Plane, Building, MapPin as MapPinIcon, CheckCircle2, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/providers/AuthProvider';
import { type DateRange } from 'react-day-picker';
import { type ProgressStep } from './widgets/ProgressIndicator';
import { useChatStore } from '@/store/chatStore';

/* ── AI Element components ────────────────────────────────────── */
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';

/* ── Chat-specific components ─────────────────────────────────── */
import { ItineraryMessage } from './ItineraryMessage';
import { AdditionalInfoWidget } from './widgets/AdditionalInfoWidget';
import { MessageInput } from './MessageInput';

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    metadata?: {
        needsClarification?: boolean;
        clarificationQuestions?: string[];
        progressSteps?: ProgressStep[];
        missingDates?: boolean;
        missingBudget?: boolean;
    };
}

interface ChatPanelProps {
    messages: ChatMessage[];
    isLoading: boolean;
    onSendMessage: (text: string, meta?: { dateRange?: DateRange; budgetTotal?: number; currency?: string }) => void;
}

/** Map step IDs to lucide icons for ChainOfThought */
function getStepIcon(stepId: string) {
  if (stepId === 'transport') return Plane;
  if (stepId === 'accommodation') return Building;
  if (stepId.startsWith('day-')) return MapPinIcon;
  return CheckCircle2;
}

export function ChatPanel({ messages, isLoading, onSendMessage }: ChatPanelProps) {
    const { user } = useAuth();
    const generatedItinerary = useChatStore((s) => s.generatedItinerary);

    const userName =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split('@')[0] ||
      '';
    const userAvatar =
      user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

    const handleSend = useCallback(
      (text: string) => onSendMessage(text),
      [onSendMessage],
    );

    const handleWidgetSubmit = useCallback(
      (data: { dateRange?: DateRange; budgetTotal?: number; currency?: string }) => {
        onSendMessage('Información adicional proporcionada', data);
      },
      [onSendMessage],
    );

    return (
        <div className="flex flex-col w-full h-full bg-white dark:bg-black overflow-hidden">
            <div className="flex flex-col flex-1 mx-auto w-full overflow-hidden md:max-w-[66.666vw]">

                {/* Header bar */}
                <div className="flex items-start gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-900">
                    {isLoading && (
                        <span className="ml-auto flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs">
                            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                            Pensando…
                        </span>
                    )}
                </div>

                {/* ── Conversation area (auto-scroll) ─────────────── */}
                <Conversation className="flex-1">
                  <ConversationContent className="gap-6 px-6 py-4">
                    {messages.map((msg, idx) => {
                      const isUser = msg.role === 'user';
                      const isSystem = msg.role === 'system';

                      const showWidgets =
                        !isUser &&
                        (msg.metadata?.missingDates || msg.metadata?.missingBudget);
                      const showProgress =
                        !isUser &&
                        msg.metadata?.progressSteps &&
                        msg.metadata.progressSteps.length > 0;

                      /* System messages */
                      if (isSystem) {
                        return (
                          <div key={idx} className="flex justify-center">
                            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                              {msg.content}
                            </span>
                          </div>
                        );
                      }

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
                                {new Date(msg.timestamp).toLocaleTimeString(
                                  'es-PE',
                                  { hour: '2-digit', minute: '2-digit' },
                                )}
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

                    {/* Inline itinerary (while still in chat phase) */}
                    {generatedItinerary && (
                      <div className="flex gap-3">
                        <div className="h-8 w-8 shrink-0" />
                        <div className="flex-1 max-w-[90%]">
                          <ItineraryMessage itinerary={generatedItinerary} />
                        </div>
                      </div>
                    )}
                  </ConversationContent>

                  <ConversationScrollButton />
                </Conversation>

                {/* Input area */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                    <MessageInput
                        onSendMessage={handleSend}
                        disabled={isLoading}
                        placeholder="Sigue contándome sobre tu viaje…"
                    />
                </div>
            </div>
        </div>
    );
}
