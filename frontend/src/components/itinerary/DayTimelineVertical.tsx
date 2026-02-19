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
    if (mode === 'flight') return 'border-sky-400 text-sky-500';
    if (mode === 'drive') return 'border-emerald-400 text-emerald-500';
    return 'border-orange-400 text-orange-400';
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
    const colorClasses = getMobilityColor(mode);
    const label = getMobilityLabel(mode);

    return (
        <div className="flex gap-6">
            <div className="flex flex-col items-center w-[120px] flex-shrink-0">
                <div className={`w-10 h-10 rounded-full bg-white border-[3px] flex items-center justify-center flex-shrink-0 z-10 ${colorClasses}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="mt-2 text-center">
                    <p className="text-sm font-semibold text-[#2D2840] leading-tight">Traslado</p>
                    <p className={`text-xs font-semibold ${colorClasses.split(' ')[1]}`}>{label}</p>
                    {segment.departure_date && (
                        <p className="text-xs text-gray-400 mt-0.5">
                            {/* e.g. "Mar 1" from the departure date */}
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
                {!isLast && <div className="flex-1 w-0.5 bg-gray-200 mt-3" />}
            </div>

            <div className="flex-1 pb-8">
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
        <div className="flex gap-6">
            <div className="flex flex-col items-center w-[120px] flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-white border-[3px] border-purple-400 flex items-center justify-center flex-shrink-0 z-10">
                    <Building2 className="w-4 h-4 text-purple-500" />
                </div>
                <div className="mt-2 text-center">
                    <p className="text-sm font-semibold text-[#2D2840] leading-tight">Hospedaje</p>
                    <p className="text-xs font-semibold text-purple-500">Hotel</p>
                    {checkIn && (
                        <p className="text-xs text-gray-400 mt-0.5">
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
                {!isLast && <div className="flex-1 w-0.5 bg-gray-200 mt-3" />}
            </div>

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
                            {/* Left column: node + connector */}
                            <div className="flex flex-col items-center w-[120px] flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-white border-[3px] border-[#6B3FA0] flex items-center justify-center flex-shrink-0 z-10">
                                    <Calendar className="w-4 h-4 text-[#6B3FA0]" />
                                </div>

                                <div className="mt-2 text-center">
                                    <p className="text-sm font-semibold text-[#2D2840] leading-tight">Itinerario</p>
                                    {/* Show calendar date range like "Mar 1 – 3" when we have dates, else "Días 1 – 5" */}
                                    <p className="text-xs font-semibold text-[#2D2840]">
                                        Día {day.day_number}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">{dayDateLabel}</p>
                                </div>

                                {!isLast && <div className="flex-1 w-0.5 bg-gray-200 mt-3" />}
                            </div>

                            {/* Right column: DayCard */}
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
