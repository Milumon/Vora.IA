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
        iconBg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800',
        iconColor: 'text-amber-500 dark:text-amber-400',
    },
    {
        icon: Plane,
        title: 'Vuelos y hoteles integrados',
        description:
            'Vora busca opciones reales de vuelos y hoteles y los integra directamente en tu itinerario con precios y horarios.',
        accent: 'orange',
        iconBg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800',
        iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
        icon: RefreshCw,
        title: 'Rutas siempre actualizadas',
        description:
            'Horarios de transporte, precios y disponibilidad se consultan en tiempo real para que tu plan sea siempre viable.',
        accent: 'emerald',
        iconBg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
        icon: User,
        title: '100% personalizado para ti',
        description:
            'Vora aprende de tus preferencias — estilo de viaje, presupuesto, intereses — y adapta cada sugerencia a tu perfil.',
        accent: 'rose',
        iconBg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800',
        iconColor: 'text-rose-500 dark:text-rose-400',
    },
];

export function BenefitsSection() {
    return (
        <section
            id="benefits"
            className="w-full bg-white dark:bg-gray-900 py-24 px-6"
            aria-label="Beneficios de Vora"
        >
            <div className="max-w-6xl mx-auto space-y-14">

                {/* Header */}
                <div className="text-center space-y-3 max-w-xl mx-auto">
                    <Badge
                        variant="outline"
                        className="text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 font-medium"
                    >
                        ¿Por qué Vora?
                    </Badge>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Planifica como un{' '}
                        <span className="text-orange-600 dark:text-orange-400">experto</span>,<br />
                        sin serlo.
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                        Vora combina la velocidad de la IA con el conocimiento de un agente
                        de viajes experimentado.
                    </p>
                </div>

                {/* Benefit cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {BENEFITS.map(({ icon: Icon, title, description, iconBg, iconColor }) => (
                        <Card
                            key={title}
                            className="group border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-orange-100 dark:hover:border-orange-900 transition-all duration-300 bg-white dark:bg-gray-800"
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
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                        {title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
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
                        <div key={label} className="text-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{value}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-snug">{label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
