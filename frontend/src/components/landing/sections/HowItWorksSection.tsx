'use client';

/**
 * HowItWorksSection
 * "¿Cómo funciona?"
 *
 * 3-step horizontal route-timeline aesthetic.
 * Signature: dashed connecting line between step cards (like a flight path on a map).
 */

import { MessageSquare, Cpu, Compass } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const STEPS = [
    {
        number: '01',
        icon: MessageSquare,
        title: 'Cuéntame tu viaje',
        description:
            'Escribe a dónde quieres ir, cuántos días tienes, tu presupuesto y estilo de viaje. Puedes ser tan detallado o tan libre como quieras.',
        color: 'text-violet-600',
        bg: 'bg-violet-50',
        border: 'border-violet-100',
    },
    {
        number: '02',
        icon: Cpu,
        title: 'Vora planifica todo',
        description:
            'En segundos, Vora busca vuelos, compara hoteles y construye un itinerario día a día adaptado exactamente a lo que pediste.',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-100',
    },
    {
        number: '03',
        icon: Compass,
        title: 'Sal a explorar',
        description:
            'Recibe tu plan completo con rutas, tiempos y presupuesto estimado. Solo queda hacer la maleta.',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-100',
    },
];

export function HowItWorksSection() {
    return (
        <section
            id="how-it-works"
            className="w-full py-24 px-6"
            style={{
                background: 'linear-gradient(180deg, #F8F6FF 0%, #FFFFFF 100%)',
            }}
            aria-label="Cómo funciona Vora"
        >
            <div className="max-w-6xl mx-auto space-y-16">

                {/* Header */}
                <div className="text-center space-y-3 max-w-xl mx-auto">
                    <Badge
                        variant="outline"
                        className="text-[#6B3FA0] border-violet-200 bg-violet-50 font-medium"
                    >
                        ¿Cómo funciona?
                    </Badge>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                        Tu aventura en{' '}
                        <span className="text-[#6B3FA0]">3 pasos</span>
                    </h2>
                    <p className="text-gray-500 text-base leading-relaxed">
                        Sin formularios interminables. Sin esperas. Solo una conversación.
                    </p>
                </div>

                {/* Steps with route line */}
                <div className="relative">
                    {/* Desktop dashed route line (signature element) */}
                    <div
                        className="hidden lg:block absolute top-12 left-[calc(16.66%+1.5rem)] right-[calc(16.66%+1.5rem)] h-px border-t-2 border-dashed border-violet-200/70"
                        aria-hidden="true"
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
                        {STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            return (
                                <div key={step.number} className="relative flex flex-col items-center lg:items-start text-center lg:text-left">
                                    {/* Mobile connector line */}
                                    {idx < STEPS.length - 1 && (
                                        <div
                                            className="lg:hidden absolute left-1/2 -translate-x-1/2 top-[5.5rem] bottom-0 w-px border-l-2 border-dashed border-violet-200/70"
                                            aria-hidden="true"
                                            style={{ height: '2rem' }}
                                        />
                                    )}

                                    {/* Step icon circle */}
                                    <div className={cn(
                                        'relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-md mb-5',
                                        step.bg, step.border,
                                    )}>
                                        <Icon className={cn('w-5 h-5', step.color)} />
                                        <span className={cn(
                                            'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-black text-white flex items-center justify-center',
                                            step.color.replace('text-', 'bg-').replace('-600', '-500'),
                                        )}>
                                            {idx + 1}
                                        </span>
                                    </div>

                                    <Card className={cn(
                                        'w-full border shadow-sm hover:shadow-md transition-shadow duration-300',
                                        step.border,
                                    )}>
                                        <CardContent className="p-5 space-y-2">
                                            <p className={cn('text-xs font-black tracking-widest uppercase', step.color)}>
                                                Paso {step.number}
                                            </p>
                                            <h3 className="text-lg font-bold text-gray-900 leading-tight">
                                                {step.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                {step.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
