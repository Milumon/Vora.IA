'use client';

import { useState, useCallback } from 'react';
import { Plane, Bus, Car, Clock, MapPin, ChevronDown, ChevronUp, ArrowRight, Navigation, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import type { MobilitySegment, MobilityOption } from '@/store/chatStore';

/* ─── Types ─────────────────────────────────────────────────── */

type MobilityMode = 'flight' | 'bus' | 'drive';

interface MobilityCardProps {
    segment: MobilitySegment;
}

/* ─── Constants ──────────────────────────────────────────────── */

const MODE_CONFIG: Record<MobilityMode, {
    label: string;
    icon: typeof Plane;
    color: string;
    bgColor: string;
    borderColor: string;
    gradientFrom: string;
    gradientTo: string;
}> = {
    flight: {
        label: 'Vuelo',
        icon: Plane,
        color: 'text-sky-600',
        bgColor: 'bg-sky-50',
        borderColor: 'border-sky-200',
        gradientFrom: 'from-sky-50',
        gradientTo: 'to-blue-50',
    },
    bus: {
        label: 'Bus',
        icon: Bus,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        gradientFrom: 'from-orange-50',
        gradientTo: 'to-amber-50',
    },
    drive: {
        label: 'Auto',
        icon: Car,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        gradientFrom: 'from-emerald-50',
        gradientTo: 'to-green-50',
    },
};

/* ─── Helpers ────────────────────────────────────────────────── */

function formatPrice(price: number, currency: string): string {
    if (price <= 0) return 'Consultar';
    const symbols: Record<string, string> = {
        PEN: 'S/',
        USD: '$',
        EUR: '€',
    };
    const sym = symbols[currency] || currency;
    return `${sym} ${price.toFixed(0)}`;
}

function getAvailableModes(segment: MobilitySegment): MobilityMode[] {
    const modes: MobilityMode[] = [];
    if (segment.best_flight) modes.push('flight');
    if (segment.best_transit) modes.push('bus');
    if (segment.best_drive) modes.push('drive');
    return modes.length > 0 ? modes : ['bus'];
}

function getOptionForMode(segment: MobilitySegment, mode: MobilityMode): MobilityOption | null {
    switch (mode) {
        case 'flight':
            return segment.best_flight;
        case 'bus':
            return segment.best_transit;
        case 'drive':
            return segment.best_drive;
        default:
            return null;
    }
}

function getDurationForMode(segment: MobilitySegment, mode: MobilityMode): string {
    switch (mode) {
        case 'flight':
            return segment.best_flight?.duration_text || '--';
        case 'bus':
            return segment.transit_duration_text || segment.best_transit?.duration_text || '--';
        case 'drive':
            return segment.drive_duration_text || segment.best_drive?.duration_text || '--';
        default:
            return '--';
    }
}

function getDistanceForMode(segment: MobilitySegment, mode: MobilityMode): string | null {
    switch (mode) {
        case 'drive':
            return segment.drive_distance_km ? `${segment.drive_distance_km} km` : null;
        case 'bus':
            return segment.transit_distance_km ? `${segment.transit_distance_km} km` : null;
        default:
            return null;
    }
}

/** Google provides public airline logos by IATA code */
function getAirlineLogo(opt: Record<string, unknown>): string | null {
    const logo = opt.airline_logo as string | undefined;
    if (logo) return logo;
    const carrier = opt.carrier_code as string | undefined;
    if (carrier) return `https://www.gstatic.com/flights/airline_logos/70px/${carrier}.png`;
    return null;
}

/* ─── Sub-components ─────────────────────────────────────────── */

/** Mode selector tabs */
function ModeTabs({
    modes,
    activeMode,
    onSelect,
}: {
    modes: MobilityMode[];
    activeMode: MobilityMode;
    onSelect: (mode: MobilityMode) => void;
}) {
    if (modes.length <= 1) return null;
    return (
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            {modes.map((mode) => {
                const config = MODE_CONFIG[mode];
                const Icon = config.icon;
                const isActive = mode === activeMode;
                return (
                    <button
                        key={mode}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(mode);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                            ${isActive
                                ? `bg-white shadow-sm ${config.color}`
                                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                            }`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {config.label}
                    </button>
                );
            })}
        </div>
    );
}

/** Route visualization bar */
function RouteBar({
    segment,
    mode,
    option,
}: {
    segment: MobilitySegment;
    mode: MobilityMode;
    option: MobilityOption | null;
}) {
    const config = MODE_CONFIG[mode];
    const Icon = config.icon;

    return (
        <div className="flex items-center gap-3">
            {/* Origin */}
            <div className="text-center min-w-[52px]">
                {option?.departure_time ? (
                    <p className="text-lg font-bold text-[#1a1a2e] leading-none">
                        {option.departure_time.slice(11, 16) || option.departure_time}
                    </p>
                ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300 mx-auto" />
                )}
                <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[52px]">
                    {segment.origin}
                </p>
            </div>

            {/* Duration bar */}
            <div className="flex-1 flex flex-col items-center gap-0.5">
                <div className="relative w-full flex items-center">
                    <div className="flex-1 h-[2px] bg-gray-200 rounded" />
                    <div className="mx-1.5">
                        <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 h-[2px] bg-gray-200 rounded" />
                </div>
                <p className="text-[10px] text-gray-400">
                    {getDurationForMode(segment, mode)}
                </p>
            </div>

            {/* Destination */}
            <div className="text-center min-w-[52px]">
                {option?.arrival_time ? (
                    <p className="text-lg font-bold text-[#1a1a2e] leading-none">
                        {option.arrival_time.slice(11, 16) || option.arrival_time}
                    </p>
                ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300 mx-auto" />
                )}
                <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[52px]">
                    {segment.destination}
                </p>
            </div>
        </div>
    );
}

/** Flight alternative row with airline logo and booking link */
function FlightOptionRow({ opt }: { opt: Record<string, unknown> }) {
    const airlineName = String(opt.airline || opt.provider || '');
    const price = Number(opt.price || 0);
    const currency = String(opt.currency || 'USD');
    const duration = String(opt.duration_text || '--');
    const bookingUrl = String(opt.booking_url || '');
    const logo = getAirlineLogo(opt);
    const stops = Number(opt.stops || 0);

    return (
        <div className="flex items-center gap-2.5 py-2 px-1 rounded-lg hover:bg-gray-50 transition-colors">
            {/* Airline logo */}
            {logo ? (
                <div className="w-7 h-7 rounded-md overflow-hidden bg-white border border-gray-100 flex-shrink-0 flex items-center justify-center">
                    <Image
                        src={logo}
                        alt={airlineName}
                        width={24}
                        height={24}
                        className="object-contain"
                        unoptimized
                    />
                </div>
            ) : (
                <div className="w-7 h-7 rounded-md bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <Plane className="w-3.5 h-3.5 text-sky-500" />
                </div>
            )}

            {/* Airline name + stops */}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">
                    {airlineName}
                </p>
                <p className="text-[10px] text-gray-400">
                    {duration} · {stops === 0 ? 'Directo' : `${stops} escala(s)`}
                </p>
            </div>

            {/* Price */}
            <p className="text-sm font-bold text-gray-900 shrink-0">
                {formatPrice(price, currency)}
            </p>

            {/* Booking CTA */}
            {bookingUrl ? (
                <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                               bg-sky-500 hover:bg-sky-600 active:bg-sky-700
                               text-white text-[10px] font-semibold transition-colors shrink-0"
                >
                    Reservar
                    <ExternalLink className="w-3 h-3" />
                </a>
            ) : null}
        </div>
    );
}

/** Flight alternatives list — now with logos + per-airline booking links */
function FlightAlternatives({ options }: { options: Record<string, unknown>[] }) {
    const [expanded, setExpanded] = useState(false);
    const visibleOptions = expanded ? options : options.slice(0, 3);

    if (options.length === 0) return null;

    return (
        <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {options.length} opcion{options.length !== 1 ? 'es' : ''} de vuelo
            </p>

            <div className="space-y-0.5">
                {visibleOptions.map((opt, i) => (
                    <FlightOptionRow key={i} opt={opt} />
                ))}
            </div>

            {options.length > 3 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(!expanded);
                    }}
                    className="flex items-center gap-1 mt-2 text-[10px] font-semibold text-sky-500 hover:text-sky-700 transition-colors"
                >
                    {expanded ? 'Ver menos' : `Ver ${options.length - 3} más`}
                    {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
            )}
        </div>
    );
}

/* ─── Main Component ─────────────────────────────────────────── */

export function MobilityCard({ segment }: MobilityCardProps) {
    const availableModes = getAvailableModes(segment);
    const [activeMode, setActiveMode] = useState<MobilityMode>(
        segment.recommended_mode || availableModes[0]
    );

    const handleModeSelect = useCallback((mode: MobilityMode) => {
        setActiveMode(mode);
    }, []);

    const config = MODE_CONFIG[activeMode];
    const option = getOptionForMode(segment, activeMode);
    const distance = getDistanceForMode(segment, activeMode);

    return (
        <div className={`w-full bg-white rounded-2xl shadow-sm border ${config.borderColor} overflow-hidden`}>
            {/* Header strip */}
            <div className={`bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} px-5 py-3`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Airline logo or mode icon */}
                        {activeMode === 'flight' && option?.airline_logo ? (
                            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden">
                                <Image
                                    src={option.airline_logo}
                                    alt={option.provider}
                                    width={24}
                                    height={24}
                                    className="object-contain"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
                                <Navigation className={`w-4 h-4 ${config.color}`} />
                            </div>
                        )}
                        <div>
                            <p className={`text-xs font-semibold ${config.color} uppercase tracking-wide`}>
                                Traslado
                            </p>
                            <p className={`text-[11px] ${config.color} opacity-75 leading-none`}>
                                {segment.origin} → {segment.destination}
                            </p>
                        </div>
                    </div>

                    {/* Price badge */}
                    {option && option.price > 0 ? (
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 leading-none mb-0.5">Desde</p>
                            <p className={`text-xl font-black ${config.color} leading-none`}>
                                {formatPrice(option.price, option.currency)}
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
                {/* Mode tabs */}
                <ModeTabs
                    modes={availableModes}
                    activeMode={activeMode}
                    onSelect={handleModeSelect}
                />

                {/* Provider + service type */}
                {option ? (
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-[#2D2840] truncate">
                            {option.provider}
                        </p>
                        {option.service_type ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide shrink-0 ${config.bgColor} ${config.color}`}>
                                {option.service_type}
                            </span>
                        ) : null}
                    </div>
                ) : null}

                {/* Route visualization */}
                <RouteBar segment={segment} mode={activeMode} option={option} />

                {/* Meta row: duration + distance */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {getDurationForMode(segment, activeMode)}
                    </span>
                    {distance ? (
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {distance}
                        </span>
                    ) : null}
                </div>

                {/* Flight options with logos + per-airline booking */}
                {activeMode === 'flight' && segment.flight_options.length > 0 ? (
                    <FlightAlternatives options={segment.flight_options} />
                ) : null}

                {/* CTA for best flight */}
                {activeMode === 'flight' && option?.booking_url ? (
                    <a
                        href={option.booking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                                   bg-sky-500 hover:bg-sky-600 active:bg-sky-700
                                   text-white text-sm font-semibold transition-colors"
                    >
                        Reservar mejor opción — {option.provider}
                        <ArrowRight className="w-4 h-4" />
                    </a>
                ) : null}
            </div>
        </div>
    );
}
