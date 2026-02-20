'use client';

/**
 * CtaSection
 * "¿Listo para partir?"
 *
 * Full-width deep violet section with a large headline and a single CTA
 * that scrolls back to the hero input.
 */

import { ArrowUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CtaSectionProps {
    onStartPlanning: () => void;
}

export function CtaSection({ onStartPlanning }: CtaSectionProps) {
    const handleCta = () => {
        // Scroll hero to top first, then focus input
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => onStartPlanning(), 600);
    };

    return (
        <section
            id="cta"
            className="w-full py-28 px-6 relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-orange-600 dark:from-orange-800 dark:via-orange-700 dark:to-orange-800"
            aria-label="Empieza a planificar con Vora"
        >
            {/* Subtle grid */}
            <div
                className="absolute inset-0 opacity-[0.05]"
                aria-hidden="true"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                    backgroundSize: '48px 48px',
                }}
            />

            <div className="relative max-w-3xl mx-auto text-center space-y-8">
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-orange-100 text-sm font-medium backdrop-blur-sm">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Empieza gratis, sin tarjeta de crédito
                </div>

                {/* Headline */}
                <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
                    ¿Listo para tu<br />
                    <span className="text-orange-100">próxima aventura?</span>
                </h2>

                <p className="text-orange-100/80 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                    Miles de viajeros ya confían en Vora para planificar sus experiencias
                    en Latinoamérica. Tu itinerario perfecto está a un mensaje de distancia.
                </p>

                {/* CTA button */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Button
                        size="lg"
                        onClick={handleCta}
                        className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-8 h-12 rounded-2xl shadow-xl shadow-black/20 hover:shadow-2xl transition-all duration-200 gap-2"
                    >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Empieza a planificar
                    </Button>
                    <Button
                        size="lg"
                        variant="ghost"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="text-orange-100 hover:text-white hover:bg-white/10 font-medium px-6 h-12 rounded-2xl gap-2 transition-all duration-200"
                    >
                        <ArrowUp className="w-4 h-4" />
                        Volver arriba
                    </Button>
                </div>

                {/* Social proof micro-copy */}
                <p className="text-orange-200/60 text-xs pt-2">
                    Sin registro requerido · Resultados en segundos · 100% gratis para empezar
                </p>
            </div>
        </section>
    );
}
