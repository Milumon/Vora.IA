'use client';

/**
 * ChatPanel — the in-conversation view.
 *
 * Shown after the first hero message is sent, while Vora is still
 * gathering info (before the itinerary is ready).
 * It preserves the beach-hero background so the transition from
 * VoraHeroLanding feels continuous, while a frosted-glass panel
 * slides up carrying the conversation.
 */

import { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { type DateRange } from 'react-day-picker';
import { type ProgressStep } from './widgets/ProgressIndicator';

interface Message {
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
    messages: Message[];
    isLoading: boolean;
    onSendMessage: (text: string, meta?: { dateRange?: DateRange; budgetTotal?: number; currency?: string }) => void;
}

export function ChatPanel({ messages, isLoading, onSendMessage }: ChatPanelProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = (text: string) => {
        onSendMessage(text);
    };

    const handleWidgetSubmit = (data: { dateRange?: DateRange; budgetTotal?: number; currency?: string }) => {
        // Enviar un mensaje automático con la información del widget
        onSendMessage('Información adicional proporcionada', data);
    };

    return (
        /* Outer: full-height white page */
        <div className="flex flex-col w-full h-full bg-white dark:bg-black overflow-hidden">

            {/* Width constraint: 100% on mobile, 2/3 on desktop, centered */}
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

                {/* Messages scroll area */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
                    {messages.map((msg, idx) => (
                        <MessageBubble 
                            key={idx} 
                            message={msg}
                            onWidgetSubmit={handleWidgetSubmit}
                        />
                    ))}
                    {isLoading && <TypingIndicator />}
                    <div ref={bottomRef} />
                </div>

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
