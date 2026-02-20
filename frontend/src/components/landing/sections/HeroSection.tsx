'use client';

/**
 * HeroSection
 *
 * Intent: A first-time traveller opening the app — excited, undecided.
 * Task: type one message or tap a chip to start planning.
 *
 * Feel: Minimal, airy, confident. No photo dependency — pure brand geometry.
 *
 * Background: CSS radial-gradient mesh in warm orange tones — always renders,
 * creates depth without any external image request.
 *
 * Palette:
 *   Orange brand theme with dark mode support
 *   Semantic tokens for responsive dark/light switching
 */

import { useState, useCallback, useId, useEffect } from 'react';
import { Mic, Paperclip, Send, ArrowDown, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import {
    PromptInput,
    PromptInputTextarea,
    PromptInputFooter,
    PromptInputButton,
} from '@/components/ai-elements/prompt-input';
import { Badge } from '@/components/ui/badge';

/** Key used across the app to persist the pre-login pending message */
export const VORA_PENDING_MESSAGE_KEY = 'vora_pending_message';


const SUGGESTIONS = [
    'Crea un itinerario para Cusco',
    'Inspírame a dónde ir en Perú',
    'Organiza una ruta por carretera',
    'Escapada de último minuto',
];

function SuggestionChip({ label, onClick }: { label: string; onClick: (l: string) => void }) {
    return (
        <button
            type="button"
            onClick={() => onClick(label)}
            className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
                'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
                'text-gray-700 dark:text-gray-300',
                'hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-400 dark:hover:border-orange-500',
                'hover:scale-[1.03] active:scale-[0.97]',
            )}
        >
            {label}
        </button>
    );
}

interface HeroSectionProps {
    onSendMessage: (message: string) => void;
    isLoading?: boolean;
}

export function HeroSection({ onSendMessage, isLoading }: HeroSectionProps) {
    const { user } = useAuth();
    const router = useRouter();
    const locale = useLocale();
    const [draftText, setDraftText] = useState('');
    const heroId = useId();

    // ── Restore pending message after login ─────────────────────────────
    // When user typed a message before being authenticated, it was saved
    // to localStorage. On mount we restore it so they see it pre-filled.
    useEffect(() => {
        if (user) {
            const saved = localStorage.getItem(VORA_PENDING_MESSAGE_KEY);
            if (saved) {
                setDraftText(saved);
                // Don't clear it yet — let the user confirm by pressing the button
            }
        }
    }, [user]);

    const userName =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split('@')[0] ||
        '';

    const handleSubmit = useCallback(
        (text: string) => {
            const trimmed = text.trim();
            console.log('🎯 HeroSection handleSubmit called with:', trimmed);
            console.log('   - isLoading:', isLoading);
            console.log('   - user:', user ? 'authenticated' : 'not authenticated');
            
            if (!trimmed || isLoading) {
                console.log('❌ Validation failed - empty or loading');
                return;
            }

            // If not authenticated → save message, redirect to login, come back here
            if (!user) {
                console.log('🔐 User not authenticated, saving and redirecting to login');
                localStorage.setItem(VORA_PENDING_MESSAGE_KEY, trimmed);
                // returnTo = root landing (not /chat) so after login the user
                // sees the message pre-filled in the input and confirms it
                router.push(
                    `/${locale}/auth/login?returnTo=${encodeURIComponent(`/${locale}`)}`,
                );
                return;
            }

            // Authenticated → save message to localStorage and navigate to chat
            // ChatPage will detect and send it automatically
            console.log('✅ User authenticated, saving to localStorage');
            localStorage.setItem(VORA_PENDING_MESSAGE_KEY, trimmed);
            console.log('💾 Saved to localStorage:', localStorage.getItem(VORA_PENDING_MESSAGE_KEY));
            setDraftText('');
            console.log('🚀 Navigating to chat page...');
            router.push(`/${locale}/chat`);
        },
        [isLoading, user, router, locale],
    );

    return (
        <section
            id={heroId}
            className="relative flex flex-col items-center justify-center w-full overflow-hidden"
            style={{ minHeight: 'calc(100vh - 4rem)' }}
            aria-label="Inicio"
        >
            {/* ── Minimalist mesh background ───────────────────────────── */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-orange-20 via-amber-10 to-orange-10 dark:from-black-900 dark:via-black dark:to-gray-900"
                aria-hidden="true"
            />

            {/* ── Subtle grid texture ──────────────────────────────────── */}
            <div
                className="absolute inset-0 opacity-[0.7] dark:opacity-[0.4]"
                aria-hidden="true"
                style={{
                    backgroundImage: `linear-gradient(hsl(var(--foreground) / 0.1) 1px, transparent 1px),
                                      linear-gradient(90deg, hsl(var(--foreground) / 0.1) 1px, transparent 1px)`,
                    backgroundSize: '48px 48px',
                }}
            />

            {/* ── Content ──────────────────────────────────────────────── */}
            <div className="relative z-10 w-full max-w-3xl mx-auto px-6 flex flex-col items-start gap-6 py-24">

                {/* Eyebrow badge */}
                <Badge
                    variant="outline"
                    className="border-orange-400/40 text-orange-700 dark:text-orange-300 bg-orange-500/10 backdrop-blur-sm px-3 py-1 gap-1.5 text-xs font-medium"
                >
                    <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                    Planifica tú viaje con Vora
                </Badge>

                {/* Headline */}
                <div className="space-y-3">
                    <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.1] tracking-tight text-gray-900 dark:text-white">
                        {userName ? (
                            <>Hola {userName},<br />
                                <span className="text-orange-600 dark:text-orange-400">¿a dónde vamos hoy?</span></>
                        ) : (
                            <>Tu próxima aventura<br />
                                <span className="text-orange-600 dark:text-orange-400">empieza aquí.</span></>
                        )}
                    </h1>
                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
                        Dime a dónde quieres ir, cuántos días tienes y tu presupuesto.
                        Vora diseña tu itinerario completo — vuelos, hoteles y experiencias.
                    </p>
                </div>

                {/* Frosted-glass input card */}
                <div className="w-full rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-layered">
                    <PromptInput
                        onSubmit={({ text }) => handleSubmit(text)}
                        className="border-0 shadow-none bg-transparent rounded-none"
                    >
                        <PromptInputTextarea
                            placeholder="Ej: Quiero 5 días en Cusco, presupuesto medio, amante de la historia…"
                            value={draftText}
                            onChange={(e) => setDraftText(e.target.value)}
                            className={cn(
                                'bg-transparent border-0 shadow-none',
                                'text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-base',
                                'px-5 pt-4 pb-2 min-h-[120px] max-h-[200px]',
                                'focus:ring-0 focus:outline-none resize-none',
                            )}
                        />
                        <PromptInputFooter className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-transparent">
                            <PromptInputButton
                                tooltip="Adjuntar archivo"
                                variant="ghost"
                                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-3 h-9"
                            >
                                <Paperclip className="w-4 h-4" />
                                <span className="text-sm font-medium hidden sm:inline">Adjuntar</span>
                            </PromptInputButton>
                            <div className="flex items-center gap-2">
                                <PromptInputButton
                                    tooltip="Entrada de voz"
                                    variant="ghost"
                                    className="w-9 h-9 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
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
                                        'bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800',
                                        'dark:bg-orange-500 dark:hover:bg-orange-600 dark:active:bg-orange-700',
                                        'disabled:opacity-40 disabled:cursor-not-allowed',
                                        'shadow-md hover:shadow-lg transition-all duration-150',
                                    )}
                                >
                                    <Send className="w-4 h-4" />
                                    <span className="hidden sm:inline">Planifica mi viaje</span>
                                    <span className="sm:hidden">Enviar</span>
                                </PromptInputButton>
                            </div>
                        </PromptInputFooter>
                    </PromptInput>
                </div>

                {/* Suggestion chips */}
                <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                        <SuggestionChip key={s} label={s} onClick={handleSubmit} />
                    ))}
                </div>

                {/* Scroll cue */}
                <button
                    type="button"
                    onClick={() => {
                        document.getElementById('what-is-vora')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors self-center mt-4"
                    aria-label="Ver más sobre Vora"
                >
                    Descubre cómo funciona
                    <ArrowDown className="w-4 h-4 animate-bounce" />
                </button>
            </div>
        </section>
    );
}
