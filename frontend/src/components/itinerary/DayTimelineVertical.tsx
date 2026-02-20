'use client';

import { Calendar, Plane, Bus, Car, Building2 } from 'lucide-react';
import type { Itinerary, DayPlan, PlaceInfo, MobilitySegment, AccommodationOption } from '@/store/chatStore';
import { MobilityCard } from './cards/MobilityCard';
import { AccommodationCard } from './cards/AccommodationCard';
import { DayCard, formatDayDate } from './cards/DayCard';

/* ─── Types ─────────────────────────────────────────────────────── */

interface DayTimelineVerticalProps {
    itinerary: Itinerary;
    onDaySelect: (day: number) => void;
    onPlaceClick?: (place: PlaceInfo) => void;
}

/* ─── Helpers ───────────────────────────────────────────────────── */

function getMobilityIcon(mode: string) {
    if (mode === 'flight') return Plane;
    if (mode === 'drive') return Car;
    return Bus;
}

function getMobilityColor(mode: string) {
    if (mode === 'flight') return 'border-yellow-400 dark:border-yellow-600 text-yellow-500 dark:text-yellow-400';
    if (mode === 'drive') return 'border-emerald-400 dark:border-emerald-600 text-emerald-500 dark:text-emerald-400';
    return 'border-orange-400 dark:border-orange-600 text-orange-400 dark:text-orange-300';
}

function getMobilityLabel(mode: string) {
    if (mode === 'flight') return 'Vuelo';
    if (mode === 'drive') return 'Auto';
    return 'Bus';
}

/* ─── Sub-components ────────────────────────────────────────────── */

function MobilityTimelineNode({
    segment,
    isLast,
}: {
    segment: MobilitySegment;
    isLast: boolean;
}) {
    const mode = segment.recommended_mode || 'bus';
    const Icon = getMobilityIcon(mode);
    const label = getMobilityLabel(mode);

    return (
        <div className="flex gap-12">
            {/* Left: Timeline node + line + text */}
            <div className="flex gap-4 flex-shrink-0">
                {/* Node and line */}
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0 z-0 relative">
                        <Icon className="w-5 h-5 text-white dark:text-black" />
                    </div>
                    {!isLast && (
                        <div className="flex-1 w-[2px] bg-gray-900 dark:bg-white -mt-0" style={{ minHeight: '120px' }} />
                    )}
                </div>

                {/* Text labels */}
                <div className="pt-1">
                    <p className="text-base font-semibold text-gray-900 dark:text-white whitespace-nowrap">Traslado</p>
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 whitespace-nowrap">{label}</p>
                    {segment.departure_date && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 whitespace-nowrap">
                            {(() => {
                                try {
                                    return new Date(segment.departure_date + 'T12:00:00').toLocaleDateString('es-PE', {
                                        month: 'short',
                                        day: 'numeric',
                                    });
                                } catch {
                                    return segment.departure_date;
                                }
                            })()}
                        </p>
                    )}
                </div>
            </div>

            {/* Right: Card content */}
            <div className="flex-1 pb-8 pt-1">
                <MobilityCard segment={segment} />
            </div>
        </div>
    );
}

function AccommodationTimelineNode({
    options,
    checkIn,
    isLast,
}: {
    options: AccommodationOption[];
    checkIn?: string | null;
    isLast: boolean;
}) {
    return (
        <div className="flex gap-10">
            {/* Left: Timeline node + line + text */}
            <div className="flex gap-4 flex-shrink-0">
                {/* Node and line */}
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0 z-0 relative">
                        <Building2 className="w-5 h-5 text-white dark:text-black" />
                    </div>
                    {!isLast && (
                        <div className="flex-1 w-[2px] bg-gray-900 dark:bg-white -mt-0" style={{ minHeight: '120px' }} />
                    )}
                </div>

                {/* Text labels */}
                <div className="pt-1">
                    <p className="text-base font-semibold text-gray-900 dark:text-white whitespace-nowrap">Hospedaje</p>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400 whitespace-nowrap">Hotel</p>
                    {checkIn && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 whitespace-nowrap">
                            {(() => {
                                try {
                                    return new Date(checkIn + 'T12:00:00').toLocaleDateString('es-PE', {
                                        month: 'short',
                                        day: 'numeric',
                                    });
                                } catch {
                                    return checkIn;
                                }
                            })()}
                        </p>
                    )}
                </div>
            </div>

            {/* Right: Card content */}
            <div className="flex-1 pb-8 pt-1">
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
        <div className="px-16 py-8 ">
            {itinerary.day_plans.map((day, index) => {
                const isLast = index === totalDays - 1;
                const mobilitySegment = day.mobility;
                const accommodationOptions = day.accommodation;
                // Calendar date for this specific day node — e.g. "Mar 1"
                const dayDateLabel = formatDayDate(day);

                return (
                    <div key={day.day_number}>
                        {/* ── Mobility node ── */}
                        {mobilitySegment && (
                            <MobilityTimelineNode segment={mobilitySegment} isLast={false} />
                        )}

                        {/* ── Accommodation node ── */}
                        {accommodationOptions && accommodationOptions.length > 0 && (
                            <AccommodationTimelineNode
                                options={accommodationOptions}
                                checkIn={accommodationOptions[0]?.check_in}
                                isLast={false}
                            />
                        )}

                        {/* ── Day node ── */}
                        <div className="flex gap-6">
                            {/* Left: Timeline node + line + text */}
                            <div className="flex gap-4 flex-shrink-0">
                                {/* Node and line */}
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0 z-0 relative">
                                        <Calendar className="w-5 h-5 text-white dark:text-black" />
                                    </div>
                                    {!isLast && (
                                        <div className="flex-1 w-[2px] bg-gray-900 dark:bg-white -mt-0" style={{ minHeight: '120px' }} />
                                    )}
                                </div>

                                {/* Text labels */}
                                <div className="pt-1">
                                    <p className="text-base font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                                        Días {day.day_number}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{dayDateLabel}</p>
                                </div>
                            </div>

                            {/* Right: Card content */}
                            <div className={`flex-1 ${!isLast ? 'pb-8' : 'pb-2'} pt-1`}>
                                <DayCard day={day} onDaySelect={onDaySelect} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
