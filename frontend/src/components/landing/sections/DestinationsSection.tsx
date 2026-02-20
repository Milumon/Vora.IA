'use client';

/**
 * DestinationsSection
 * "Destinos que Vora conoce"
 *
 * Editorial stat row + destination country chips.
 * Background: subtle dot-grid CSS pattern (map-territory feel).
 */

import { Badge } from '@/components/ui/badge';

const DESTINATIONS = [
    { country: 'Perú', emoji: '🇵🇪', highlights: 'Cusco · Machu Picchu · Arequipa · Lima · Lago Titicaca' },
    { country: 'Colombia', emoji: '🇨🇴', highlights: 'Cartagena · Medellín · Bogotá · Eje Cafetero' },
    { country: 'Ecuador', emoji: '🇪🇨', highlights: 'Quito · Galápagos · Cuenca · Baños' },
    { country: 'México', emoji: '🇲🇽', highlights: 'CDMX · Oaxaca · Cancún · Tulum · Mérida' },
    { country: 'Argentina', emoji: '🇦🇷', highlights: 'Buenos Aires · Patagonia · Mendoza · Salta' },
];

const STATS = [
    { value: '5', label: 'países' },
    { value: '+200', label: 'destinos' },
    { value: '+10 k', label: 'itinerarios generados' },
    { value: '< 30 s', label: 'tiempo promedio' },
];

export function DestinationsSection() {
    return (
        <section
            id="destinations"
            className="w-full py-24 px-6 relative overflow-hidden bg-gradient-to-b from-white to-orange-50/30 dark:from-gray-900 dark:to-gray-800/30"
            aria-label="Destinos que Vora conoce"
        >
            {/* Dot-grid map texture */}
            <div
                className="absolute inset-0 opacity-[0.04] dark:opacity-[0.02]"
                aria-hidden="true"
                style={{
                    backgroundImage: 'radial-gradient(circle, hsl(var(--brand-orange)) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                }}
            />

            <div className="relative max-w-6xl mx-auto space-y-16">

                {/* Header */}
                <div className="text-center space-y-3 max-w-xl mx-auto">
                    <Badge
                        variant="outline"
                        className="text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 font-medium"
                    >
                        Destinos
                    </Badge>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Latinoamérica<br />
                        <span className="text-orange-600 dark:text-orange-400">en la palma de tu mano.</span>
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                        Vora conoce cada rincón de los destinos más vibrantes de la región
                        y los actualiza constantemente.
                    </p>
                </div>

                {/* Destination cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {DESTINATIONS.map(({ country, emoji, highlights }) => (
                        <div
                            key={country}
                            className="group p-5 rounded-2xl border border-orange-100 dark:border-orange-900/30 bg-white dark:bg-gray-800 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-md hover:shadow-orange-100/40 dark:hover:shadow-orange-900/20 transition-all duration-300 cursor-default"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl">{emoji}</span>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                    {country}
                                </h3>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                {highlights}
                            </p>
                        </div>
                    ))}

                    {/* "Próximamente" card */}
                    <div className="p-5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60 flex flex-col items-center justify-center text-center gap-2">
                        <span className="text-2xl">🌎</span>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Más destinos próximamente</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Chile · Bolivia · Brasil</p>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {STATS.map(({ value, label }) => (
                        <div
                            key={label}
                            className="text-center py-5 px-4 rounded-2xl bg-orange-600 dark:bg-orange-700 text-white"
                        >
                            <p className="text-3xl font-black tracking-tight text-orange-100">{value}</p>
                            <p className="text-xs text-orange-200/80 mt-1 font-medium uppercase tracking-wide">{label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
