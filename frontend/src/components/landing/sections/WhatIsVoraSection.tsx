'use client';

/**
 * WhatIsVoraSection
 * "¿Qué es Vora?"
 *
 * Two-column: left = headline + description + trust badges
 *             right = mock itinerary chat card (product tangibility)
 */

import { MapPin, Star, Clock, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const TRUST_BADGES = [
    { label: 'Vuelos comparados', icon: '✈️' },
    { label: 'Hoteles incluidos', icon: '🏨' },
    { label: 'Rutas optimizadas', icon: '🗺️' },
    { label: 'Sin comisiones', icon: '🎯' },
];

function MockItineraryCard() {
    return (
        <Card className="border border-orange-100 dark:border-orange-900/30 shadow-xl shadow-orange-100/30 dark:shadow-orange-900/20 bg-white dark:bg-gray-800 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 dark:from-orange-700 dark:to-orange-600 px-5 py-4">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-white text-sm font-semibold">Vora</p>
                        <p className="text-orange-100 text-xs">Tu copiloto de viaje</p>
                    </div>
                </div>
            </div>

            <CardContent className="p-4 space-y-3">
                {/* User bubble */}
                <div className="flex justify-end">
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%]">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            Quiero 4 días en Cusco, presupuesto medio, con historia y naturaleza.
                        </p>
                    </div>
                </div>

                {/* Vora response */}
                <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-600/10 dark:bg-orange-500/20 border border-orange-200 dark:border-orange-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl rounded-tl-sm px-3 py-2 flex-1">
                        <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mb-2">¡Perfecto! Tu itinerario para Cusco:</p>
                        <div className="space-y-1.5">
                            {[
                                { day: 'Día 1', place: 'Plaza de Armas & Centro Histórico', icon: MapPin },
                                { day: 'Día 2', place: 'Valle Sagrado de los Incas', icon: MapPin },
                                { day: 'Día 3', place: 'Machu Picchu (visita completa)', icon: Star },
                                { day: 'Día 4', place: 'Mercado San Pedro & Salineras', icon: Clock },
                            ].map(({ day, place, icon: Icon }) => (
                                <div key={day} className="flex items-start gap-2">
                                    <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                                        {day}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Icon className="w-3 h-3 text-gray-400 dark:text-gray-500 shrink-0" />
                                        <p className="text-xs text-gray-600 dark:text-gray-300">{place}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center pt-1">
                    + vuelos desde Lima · hoteles 3★ seleccionados · presupuesto estimado S/ 1,200
                </p>
            </CardContent>
        </Card>
    );
}

export function WhatIsVoraSection() {
    return (
        <section
            id="what-is-vora"
            className="w-full bg-white dark:bg-gray-900 py-24 px-6"
            aria-label="Qué es Vora"
        >
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                {/* Left — copy */}
                <div className="space-y-6">
                    <Badge
                        variant="outline"
                        className="text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 font-medium"
                    >
                        ¿Qué es Vora?
                    </Badge>

                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
                        Tu copiloto de viaje<br />
                        <span className="text-orange-600 dark:text-orange-400">impulsado por inteligencia artificial.</span>
                    </h2>

                    <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg">
                        Vora es un agente de IA conversacional que planifica viajes completos
                        en segundos. Cuéntale a dónde quieres ir, cuántos días tienes y cuál
                        es tu estilo — Vora hace el resto.
                    </p>

                    <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg">
                        Busca vuelos, compara hoteles, diseña rutas día a día y te entrega
                        un itinerario personalizado listo para ejecutar.
                    </p>

                    {/* Trust badges */}
                    <div className="flex flex-wrap gap-2 pt-2">
                        {TRUST_BADGES.map(({ label, icon }) => (
                            <span
                                key={label}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                            >
                                <span>{icon}</span>
                                {label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Right — product mockup */}
                <div className="relative">
                    {/* Decorative blur blob behind card */}
                    <div
                        className="absolute -inset-6 rounded-3xl opacity-20 dark:opacity-30"
                        aria-hidden="true"
                        style={{
                            background: 'radial-gradient(ellipse at 60% 40%, hsl(25 95% 53%) 0%, transparent 70%)',
                            filter: 'blur(40px)',
                        }}
                    />
                    <div className="relative">
                        <MockItineraryCard />
                    </div>
                </div>
            </div>
        </section>
    );
}
