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

import { useRef, useEffect, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { DateRangePicker } from './widgets/DateRangePicker';
import { BudgetSlider, CURRENCY_CONFIG } from './widgets/BudgetSlider';
import { useCurrencyStore } from '@/store/currencyStore';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { type DateRange } from 'react-day-picker';
import Image from 'next/image';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
}

interface ChatPanelProps {
    messages: Message[];
    isLoading: boolean;
    onSendMessage: (text: string, meta?: { dateRange?: DateRange; budgetRange?: [number, number]; currency?: string }) => void;
}

export function ChatPanel({ messages, isLoading, onSendMessage }: ChatPanelProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const { currency } = useCurrencyStore();
    const config = CURRENCY_CONFIG[currency];

    // Widget state
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [budgetRange, setBudgetRange] = useState<[number, number]>(config.default);

    // Reset budget range when currency changes
    useEffect(() => {
        setBudgetRange(CURRENCY_CONFIG[currency].default);
    }, [currency]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = (text: string) => {
        onSendMessage(text, {
            dateRange,
            budgetRange,
            currency,
        });
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
                        <MessageBubble key={idx} message={msg} />
                    ))}
                    {isLoading && <TypingIndicator />}
                    <div ref={bottomRef} />
                </div>

                {/* Filters panel (collapsible) */}
                <div className="border-t border-gray-100 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={() => setFiltersOpen(!filtersOpen)}
                        className="flex items-center gap-2 w-full px-6 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Filtros de alojamiento
                        {filtersOpen ? (
                            <ChevronUp className="h-3.5 w-3.5 ml-auto" />
                        ) : (
                            <ChevronDown className="h-3.5 w-3.5 ml-auto" />
                        )}
                    </button>

                    {filtersOpen && (
                        <div className="px-6 pb-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                            <DateRangePicker
                                dateRange={dateRange}
                                onDateRangeChange={setDateRange}
                            />
                            <BudgetSlider
                                value={budgetRange}
                                onValueChange={setBudgetRange}
                            />
                        </div>
                    )}
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
