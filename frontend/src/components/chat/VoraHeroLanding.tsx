'use client';

/**
 * VoraHeroLanding
 *
 * Intent: A traveller opening the app for the first time, excited but undecided.
 *   Their single task: type one message (or tap a chip) to start their journey.
 *
 * Feel: Warm, editorial, open-sky — like a travel magazine cover with an AI chat box.
 *
 * Palette (from a Peruvian late-afternoon beach):
 *   - Violet-indigo gradient overlay (#2B195A → #3B2C6E at 55-72%) → headline always legible
 *   - Warm white (#FAFAF8) for headline and chips → editorial warmth
 *   - Frosted glass (#FFFFFF/88 + 20px blur) for the input card → floats above the photo
 *   - Brand purple (#6B3FA0) for the CTA → consistent with the existing design system
 *
 * Depth strategy: ONE layered approach — soft gradient overlay + card shadow.
 *
 * Signature: The gradient darkens from top-left so the headline is always readable,
 *   while the lower half bleeds the destination photo through, creating the sensation
 *   of looking out toward the destination.
 */

import { useState, useCallback } from 'react';
import { Mic, Paperclip, Send, ChevronDown } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';
import {
    PromptInput,
    PromptInputTextarea,
    PromptInputFooter,
    PromptInputButton,
} from '@/components/ai-elements/prompt-input';

// ── Suggestion chips ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
    'Crea un nuevo viaje',
    'Inspírame a dónde ir',
    'Organiza una ruta por carretera',
    'Planifica una escapada de último minuto',
    'Haz un quiz de destino',
];

// ── SuggestionChip ────────────────────────────────────────────────────────────

function SuggestionChip({
    label,
    onClick,
}: {
    label: string;
    onClick: (label: string) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onClick(label)}
            className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap',
                'bg-white/20 backdrop-blur-md border border-white/30 text-white',
                'hover:bg-white/30 transition-all duration-200',
                'hover:scale-[1.03] active:scale-[0.97] shadow-sm',
            )}
        >
            {label}
        </button>
    );
}

// ── VoraHeroLanding ───────────────────────────────────────────────────────────

interface VoraHeroLandingProps {
    onSendMessage: (message: string) => void;
    isLoading?: boolean;
}

export function VoraHeroLanding({ onSendMessage, isLoading }: VoraHeroLandingProps) {
    const { user } = useAuth();
    const [draftText, setDraftText] = useState('');

    const userName =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split('@')[0] ||
        '';

    const handleSubmit = useCallback(
        (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || isLoading) return;
            setDraftText('');
            onSendMessage(trimmed);
        },
        [isLoading, onSendMessage],
    );

    return (
        <div
            className="relative flex flex-col items-center justify-center w-full overflow-hidden"
            style={{ minHeight: 'calc(100vh - 4rem)' }}
        >
            {/* Background photo ──────────────────────────────────────────────── */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=85&auto=format&fit=crop')`,
                }}
                aria-hidden="true"
            />

            {/* Gradient overlay ─────────────────────────────────────────────── */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'linear-gradient(135deg, rgba(43,25,90,0.75) 0%, rgba(59,44,110,0.55) 45%, rgba(20,10,50,0.30) 100%)',
                }}
                aria-hidden="true"
            />

            {/* Content ─────────────────────────────────────────────────────── */}
            <div className="relative z-10 w-full max-w-3xl mx-auto px-6 flex flex-col items-start gap-6">

                {/* Headline */}
                <div className="space-y-2">
                    <h1
                        className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight"
                        style={{ color: '#FAFAF8', textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
                    >
                        {userName ? (
                            <>Hola {userName},<br />¿a dónde vamos hoy?</>
                        ) : (
                            <>¿A dónde vamos hoy?</>
                        )}
                    </h1>
                    <p
                        className="text-base sm:text-lg"
                        style={{ color: 'rgba(250,250,248,0.82)', textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}
                    >
                        Dime tu estilo y presupuesto, y te diseñaré un viaje.
                    </p>
                </div>

                {/* Frosted-glass input card ─────────────────────────────────── */}
                <div
                    className="w-full rounded-2xl overflow-hidden"
                    style={{
                        background: 'rgba(255,255,255,0.88)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 40px rgba(43,25,90,0.22), 0 2px 8px rgba(0,0,0,0.12)',
                    }}
                >
                    <PromptInput
                        onSubmit={({ text }) => handleSubmit(text)}
                        className="border-0 shadow-none bg-transparent rounded-none"
                    >
                        {/* Textarea */}
                        <PromptInputTextarea
                            placeholder="Ayúdame a planear unas vacaciones económicas a Cusco…"
                            value={draftText}
                            onChange={(e) => setDraftText(e.target.value)}
                            className={cn(
                                'bg-transparent border-0 shadow-none',
                                'text-gray-800 placeholder:text-gray-400 text-base',
                                'px-5 pt-4 pb-2 min-h-[64px] max-h-[200px]',
                                'focus:ring-0 focus:outline-none resize-none',
                            )}
                            style={{ caretColor: '#6B3FA0' }}
                        />

                        {/* Footer action row */}
                        <PromptInputFooter className="px-4 py-3 border-t border-gray-100 bg-transparent">
                            {/* Left: Attach */}
                            <PromptInputButton
                                tooltip="Adjuntar archivo"
                                variant="ghost"
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 px-3 h-9"
                            >
                                <Paperclip className="w-4 h-4" />
                                <span className="text-sm font-medium">Adjuntar</span>
                            </PromptInputButton>

                            {/* Right: Mic + Submit */}
                            <div className="flex items-center gap-2">
                                <PromptInputButton
                                    tooltip="Entrada de voz"
                                    variant="ghost"
                                    className="w-9 h-9 text-gray-500 hover:text-gray-700"
                                    aria-label="Voz"
                                >
                                    <Mic className="w-4 h-4" />
                                </PromptInputButton>

                                <PromptInputButton
                                    tooltip="Planifica mi viaje"
                                    variant="default"
                                    type="submit"
                                    disabled={!draftText.trim() || isLoading}
                                    className={cn(
                                        'flex items-center gap-2 px-4 h-9 rounded-xl text-sm font-semibold',
                                        'bg-[#6B3FA0] text-white hover:bg-[#5a3388] active:bg-[#4e2d78]',
                                        'disabled:opacity-40 disabled:cursor-not-allowed',
                                        'shadow-md hover:shadow-lg transition-all duration-150',
                                    )}
                                >
                                    <Send className="w-4 h-4" />
                                    Planifica mi viaje
                                </PromptInputButton>
                            </div>
                        </PromptInputFooter>
                    </PromptInput>
                </div>

                {/* Suggestion chips ─────────────────────────────────────────── */}
                <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                        <SuggestionChip key={s} label={s} onClick={handleSubmit} />
                    ))}
                </div>

                {/* "Mira cómo puedo ayudarte" ───────────────────────────────── */}
                <button
                    type="button"
                    className="flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors self-center mt-2"
                >
                    Mira cómo puedo ayudarte
                    <ChevronDown className="w-4 h-4 animate-bounce" />
                </button>
            </div>
        </div>
    );
}
