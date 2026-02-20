'use client';

/**
 * BenefitsSection
 * "¿Por qué Vora?"
 *
 * 4 benefit cards in a 2×2 responsive grid.
 * Each card has an icon, headline, and one-line description.
 */

import { Zap, Plane, RefreshCw, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const BENEFITS = [
    {
        icon: Zap,
        title: 'Itinerarios en segundos',
        description:
            'Lo que a un agente de viajes lleva horas, Vora lo hace en segundos. Sin esperas, sin formularios, sin idas y vueltas.',
        accent: 'amber',
        iconBg: 'bg-amber-50 border-amber-100',
        iconColor: 'text-amber-500',
    },
    {
        icon: Plane,
        title: 'Vuelos y hoteles integrados',
        description:
            'Vora busca opciones reales de vuelos y hoteles y los integra directamente en tu itinerario con precios y horarios.',
        accent: 'violet',
        iconBg: 'bg-violet-50 border-violet-100',
        iconColor: 'text-[#6B3FA0]',
    },
    {
        icon: RefreshCw,
        title: 'Rutas siempre actualizadas',
        description:
            'Horarios de transporte, precios y disponibilidad se consultan en tiempo real para que tu plan sea siempre viable.',
        accent: 'emerald',
        iconBg: 'bg-emerald-50 border-emerald-100',
        iconColor: 'text-emerald-600',
    },
    {
        icon: User,
        title: '100% personalizado para ti',
        description:
            'Vora aprende de tus preferencias — estilo de viaje, presupuesto, intereses — y adapta cada sugerencia a tu perfil.',
        accent: 'rose',
        iconBg: 'bg-rose-50 border-rose-100',
        iconColor: 'text-rose-500',
    },
];

export function BenefitsSection() {
    return (
        <section
            id="benefits"
            className="w-full bg-white py-24 px-6"
            aria-label="Beneficios de Vora"
        >
            <div className="max-w-6xl mx-auto space-y-14">

                {/* Header */}
                <div className="text-center space-y-3 max-w-xl mx-auto">
                    <Badge
                        variant="outline"
                        className="text-[#6B3FA0] border-violet-200 bg-violet-50 font-medium"
                    >
                        ¿Por qué Vora?
                    </Badge>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                        Planifica como un{' '}
                        <span className="text-[#6B3FA0]">experto</span>,<br />
                        sin serlo.
                    </h2>
                    <p className="text-gray-500 text-base leading-relaxed">
                        Vora combina la velocidad de la IA con el conocimiento de un agente
                        de viajes experimentado.
                    </p>
                </div>

                {/* Benefit cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {BENEFITS.map(({ icon: Icon, title, description, iconBg, iconColor }) => (
                        <Card
                            key={title}
                            className="group border border-gray-100 shadow-sm hover:shadow-md hover:border-violet-100 transition-all duration-300 bg-white"
                        >
                            <CardContent className="p-6 space-y-4">
                                {/* Icon */}
                                <div className={cn(
                                    'w-11 h-11 rounded-xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                                    iconBg,
                                )}>
                                    <Icon className={cn('w-5 h-5', iconColor)} />
                                </div>

                                {/* Copy */}
                                <div className="space-y-1.5">
                                    <h3 className="text-base font-bold text-gray-900">
                                        {title}
                                    </h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        {description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Bottom stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                    {[
                        { value: '+200', label: 'Destinos cubiertos' },
                        { value: '< 30s', label: 'Para generar un itinerario' },
                        { value: '5', label: 'Países de Latinoamérica' },
                        { value: '100%', label: 'Personalizado' },
                    ].map(({ value, label }) => (
                        <div key={label} className="text-center p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <p className="text-2xl font-black text-[#6B3FA0]">{value}</p>
                            <p className="text-xs text-gray-500 mt-1 leading-snug">{label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
