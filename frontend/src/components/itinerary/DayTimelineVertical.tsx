'use client';

import { useRef, useCallback } from 'react';
import { Calendar, ChevronRight, ArrowRight, Plane, Bus, Car, Building2 } from 'lucide-react';
import type { Itinerary, DayPlan, PlaceInfo, MobilitySegment, AccommodationOption } from '@/store/chatStore';
import Image from 'next/image';
import { getPlaceThumbnail } from '@/lib/utils/google-places';
import { MobilityCard } from './MobilityCard';
import { AccommodationCard } from './AccommodationCard';

/* ─── Types ─────────────────────────────────────────────────────── */

interface DayTimelineVerticalProps {
    itinerary: Itinerary;
    onDaySelect: (day: number) => void;
    onPlaceClick: (place: PlaceInfo) => void;
}

/* ─── Helpers ───────────────────────────────────────────────────── */

/** Collect all places from every time slot of a day. */
function getAllPlaces(day: DayPlan): PlaceInfo[] {
    return [...day.morning, ...day.afternoon, ...day.evening];
}

/** Build a compact route string: "Place A → Place B → Place C → …" */
function buildRouteChain(places: PlaceInfo[], maxVisible = 3): string {
    const names = places.map((p) => p.name);
    if (names.length <= maxVisible) return names.join(' → ');
    return names.slice(0, maxVisible).join(' → ') + ' → …';
}

/** Format a date string for display. Falls back to "Día N". */
function formatDayDate(day: DayPlan): string {
    if (!day.date) return `Día ${day.day_number}`;
    try {
        const d = new Date(day.date);
        return d.toLocaleDateString('es-PE', { month: 'short', day: 'numeric' });
    } catch {
        return `Día ${day.day_number}`;
    }
}

/** Get the right icon for a mobility mode */
function getMobilityIcon(mode: string) {
    switch (mode) {
        case 'flight': return Plane;
        case 'drive': return Car;
        default: return Bus;
    }
}

/** Get the right color for a mobility mode */
function getMobilityColor(mode: string) {
    switch (mode) {
        case 'flight': return 'border-sky-400 text-sky-500';
        case 'drive': return 'border-emerald-400 text-emerald-500';
        default: return 'border-orange-400 text-orange-400';
    }
}

/** Get mobility label */
function getMobilityLabel(mode: string) {
    switch (mode) {
        case 'flight': return 'Vuelo';
        case 'drive': return 'Auto';
        default: return 'Bus';
    }
}

/* ─── Sub‑components ────────────────────────────────────────────── */

/** Horizontal scrollable image carousel for a single day card. */
function DayImageCarousel({ places }: { places: PlaceInfo[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollRight = useCallback(() => {
        scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
    }, []);

    if (places.length === 0) return null;

    return (
        <div className="relative group/carousel">
            <div
                ref={scrollRef}
                className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
            >
                {places.map((place, idx) => (
                    <div
                        key={`${place.place_id}-${idx}`}
                        className="relative flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden bg-gray-100"
                    >
                        <Image
                            src={getPlaceThumbnail(place.photos)}
                            alt={place.name}
                            fill
                            className="object-cover"
                            sizes="112px"
                        />
                    </div>
                ))}
            </div>

            {/* Scroll-right chevron */}
            {places.length > 4 && (
                <button
                    onClick={scrollRight}
                    aria-label="Ver más imágenes"
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full
                     bg-white/90 shadow-md flex items-center justify-center
                     opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                </button>
            )}
        </div>
    );
}

/** Metadata tags row beneath the carousel. */
function DayTags({
    dayNumber,
    experienceCount,
    dateLabel,
}: {
    dayNumber: number;
    experienceCount: number;
    dateLabel: string;
}) {
    return (
        <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#F3EEFF] text-[#6B3FA0] font-semibold text-xs">
                Día {dayNumber}
            </span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-600 font-medium">
                {experienceCount} {experienceCount === 1 ? 'Experiencia' : 'Experiencias'}
            </span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500">{dateLabel}</span>
        </div>
    );
}

/** A single day card in the vertical timeline. */
function DayCard({
    day,
    onDaySelect,
}: {
    day: DayPlan;
    onDaySelect: (day: number) => void;
}) {
    const places = getAllPlaces(day);
    const experienceCount = places.length;
    const dateLabel = formatDayDate(day);
    const routeChain = buildRouteChain(places);
    const summary =
        day.day_summary || day.notes || `Explora lo mejor del Día ${day.day_number}`;

    return (
        <button
            onClick={() => onDaySelect(day.day_number)}
            className="w-full text-left bg-white rounded-2xl shadow-sm border border-gray-100
                 hover:shadow-md transition-shadow p-5 space-y-4 group cursor-pointer"
        >
            {/* Image carousel */}
            <DayImageCarousel places={places} />

            {/* Tags */}
            <DayTags
                dayNumber={day.day_number}
                experienceCount={experienceCount}
                dateLabel={dateLabel}
            />

            {/* Route chain */}
            {routeChain && (
                <p className="text-xs text-gray-400 truncate">{routeChain}</p>
            )}

            {/* Day summary + arrow */}
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-bold text-[#2D2840] leading-snug line-clamp-2">
                    {summary}
                </h3>
                <ArrowRight className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-[#6B3FA0] transition-colors" />
            </div>
        </button>
    );
}

/** Mobility timeline node — renders a MobilityCard for the appropriate transport mode. */
function MobilityTimelineNode({
    segment,
    isLast,
}: {
    segment: MobilitySegment;
    isLast: boolean;
}) {
    const mode = segment.recommended_mode || 'bus';
    const Icon = getMobilityIcon(mode);
    const colorClasses = getMobilityColor(mode);
    const label = getMobilityLabel(mode);

    return (
        <div className="flex gap-6">
            {/* ── Left column: mode node ── */}
            <div className="flex flex-col items-center w-[120px] flex-shrink-0">
                {/* Node circle */}
                <div className={`w-10 h-10 rounded-full bg-white border-[3px] flex items-center justify-center flex-shrink-0 z-10 ${colorClasses}`}>
                    <Icon className="w-4 h-4" />
                </div>

                {/* Node label */}
                <div className="mt-2 text-center">
                    <p className="text-sm font-semibold text-[#2D2840] leading-tight">
                        Traslado
                    </p>
                    <p className={`text-xs font-semibold ${colorClasses.split(' ')[1]}`}>
                        {label}
                    </p>
                </div>

                {/* Vertical connector */}
                {!isLast && (
                    <div className="flex-1 w-0.5 bg-gray-200 mt-3" />
                )}
            </div>

            {/* ── Right column: MobilityCard ── */}
            <div className="flex-1 pb-8">
                <MobilityCard segment={segment} />
            </div>
        </div>
    );
}

/** Accommodation timeline node — renders AccommodationCard with hotel info. */
function AccommodationTimelineNode({
    options,
    isLast,
}: {
    options: AccommodationOption[];
    isLast: boolean;
}) {
    return (
        <div className="flex gap-6">
            {/* ── Left column: accommodation node ── */}
            <div className="flex flex-col items-center w-[120px] flex-shrink-0">
                {/* Node circle */}
                <div className="w-10 h-10 rounded-full bg-white border-[3px] border-purple-400 flex items-center justify-center flex-shrink-0 z-10">
                    <Building2 className="w-4 h-4 text-purple-500" />
                </div>

                {/* Node label */}
                <div className="mt-2 text-center">
                    <p className="text-sm font-semibold text-[#2D2840] leading-tight">
                        Hospedaje
                    </p>
                    <p className="text-xs font-semibold text-purple-500">
                        Hotel
                    </p>
                </div>

                {/* Vertical connector */}
                {!isLast && (
                    <div className="flex-1 w-0.5 bg-gray-200 mt-3" />
                )}
            </div>

            {/* ── Right column: AccommodationCard ── */}
            <div className="flex-1 pb-8">
                <AccommodationCard options={options} />
            </div>
        </div>
    );
}

/* ─── Main component ────────────────────────────────────────────── */

export function DayTimelineVertical({
    itinerary,
    onDaySelect,
}: DayTimelineVerticalProps) {
    const totalDays = itinerary.day_plans.length;

    return (
        <div className="px-6 py-8">
            {itinerary.day_plans.map((day, index) => {
                const isLast = index === totalDays - 1;
                const mobilitySegment = day.mobility;
                const accommodationOptions = day.accommodation;

                return (
                    <div key={day.day_number}>
                        {/* ── Mobility node (transport segments) ── */}
                        {mobilitySegment && (
                            <MobilityTimelineNode
                                segment={mobilitySegment}
                                isLast={false}
                            />
                        )}

                        {/* ── Accommodation node (hotel options) ── */}
                        {accommodationOptions && accommodationOptions.length > 0 && (
                            <AccommodationTimelineNode
                                options={accommodationOptions}
                                isLast={false}
                            />
                        )}

                        {/* ── Day node ── */}
                        <div className="flex gap-6">
                            {/* Left column: timeline node + line */}
                            <div className="flex flex-col items-center w-[120px] flex-shrink-0">
                                {/* Node circle */}
                                <div className="w-10 h-10 rounded-full bg-white border-[3px] border-[#6B3FA0] flex items-center justify-center flex-shrink-0 z-10">
                                    <Calendar className="w-4 h-4 text-[#6B3FA0]" />
                                </div>

                                {/* Node label */}
                                <div className="mt-2 text-center">
                                    <p className="text-sm font-semibold text-[#2D2840] leading-tight">
                                        Itinerario
                                    </p>
                                    <p className="text-xs font-semibold text-[#2D2840]">
                                        Días {day.day_number}-{totalDays}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {formatDayDate(day)}
                                    </p>
                                </div>

                                {/* Vertical connector line */}
                                {!isLast && (
                                    <div className="flex-1 w-0.5 bg-gray-200 mt-3" />
                                )}
                            </div>

                            {/* Right column: day card */}
                            <div className={`flex-1 ${!isLast ? 'pb-8' : 'pb-2'}`}>
                                <DayCard day={day} onDaySelect={onDaySelect} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
