'use client';

import { useRef, useEffect, useMemo } from 'react';
import { Clock, Calendar, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DayPlan, PlaceInfo, AccommodationOption } from '@/store/chatStore';
import { DayPlaceCard } from './cards/DayPlaceCard';
import { DayReturnCard } from './cards/DayReturnCard';
import { formatDayDate } from './cards/DayCard';

/* ─── Time helpers ──────────────────────────────────────────────────────────── */

/**
 * Parse a duration string like "1h 30min", "2 horas", "45 minutos", "1.5h"
 * and return the total minutes.
 */
function parseDurationMinutes(d?: string): number {
    if (!d) return 60;
    const lower = d.toLowerCase();

    // e.g. "1.5h"
    const decimal = lower.match(/(\d+(?:\.\d+))\s*h/);
    if (decimal) return Math.round(parseFloat(decimal[1]) * 60);

    let total = 0;
    const hours = lower.match(/(\d+)\s*(?:h(?:ora(?:s)?)?)/);
    const mins = lower.match(/(\d+)\s*(?:m(?:in(?:utos?)?)?)/);
    if (hours) total += parseInt(hours[1]) * 60;
    if (mins) total += parseInt(mins[1]);
    return total || 60;
}

/** Add minutes to a "HH:MM" string → "HH:MM" */
function addMinutes(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutes;
    const nh = Math.floor(total / 60) % 24;
    const nm = total % 60;
    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

/* ─── Schedule event type ───────────────────────────────────────────────────── */

type PlaceEvent = { type: 'place' | 'lunch'; place: PlaceInfo; time: string };
type ReturnEvent = { type: 'return'; accommodation: AccommodationOption; time: string };
type ScheduleEvent = PlaceEvent | ReturnEvent;

/* ─── Build schedule ────────────────────────────────────────────────────────── */

function buildSchedule(day: DayPlan): ScheduleEvent[] {
    const events: ScheduleEvent[] = [];
    let cursor = '09:00';

    // Morning
    for (const place of day.morning ?? []) {
        events.push({ type: 'place', place, time: cursor });
        cursor = addMinutes(cursor, parseDurationMinutes(place.visit_duration) + 20); // +20 travel
    }

    // Lunch block — always include at ~13:00 (unless cursor is already past 14:00)
    const lunchStart = cursor < '13:00' ? '13:00' : cursor;

    const lunchPlace: PlaceInfo = (day as any).lunch ?? {
        place_id: `lunch-day-${day.day_number}`,
        name: 'Restaurante recomendado',
        address: day.morning?.[0]?.address ?? '',
        types: ['restaurant', 'food'],
        photos: [],
        location: day.morning?.[0]?.location ?? day.afternoon?.[0]?.location ?? { lat: 0, lng: 0 },
        why_visit: 'Pausa para el almuerzo en la zona. El agente recomienda probar la gastronomía local.',
        visit_duration: '1h 30min',
    };

    events.push({ type: 'lunch', place: lunchPlace, time: lunchStart });
    cursor = addMinutes(lunchStart, 90 + 15); // 90min lunch + 15min travel

    // Afternoon
    for (const place of day.afternoon ?? []) {
        events.push({ type: 'place', place, time: cursor });
        cursor = addMinutes(cursor, parseDurationMinutes(place.visit_duration) + 20);
    }

    // Evening
    for (const place of day.evening ?? []) {
        events.push({ type: 'place', place, time: cursor });
        cursor = addMinutes(cursor, parseDurationMinutes(place.visit_duration) + 20);
    }

    // Return to accommodation — ensure at least 20:00
    const returnTime = cursor < '20:00' ? '20:00' : cursor;
    const accommodation = day.accommodation?.[0];
    if (accommodation) {
        events.push({ type: 'return', accommodation, time: returnTime });
    }

    return events;
}

/* ─── Total hours helper ────────────────────────────────────────────────────── */

function totalScheduleHours(events: ScheduleEvent[]): number {
    if (events.length < 2) return 0;
    const first = events[0].time.split(':').map(Number);
    const last = events[events.length - 1].time.split(':').map(Number);
    return Math.round(last[0] * 60 + last[1] - (first[0] * 60 + first[1])) / 60;
}

/* ─── Props ─────────────────────────────────────────────────────────────────── */

interface DayScheduleTimelineProps {
    day: DayPlan;
    onPlaceClick: (place: PlaceInfo) => void;
    selectedPlace: PlaceInfo | null;
}

/* ─── Component ─────────────────────────────────────────────────────────────── */

export function DayScheduleTimeline({
    day,
    onPlaceClick,
    selectedPlace,
}: DayScheduleTimelineProps) {
    const events = useMemo(() => buildSchedule(day), [day]);
    const totalPlaces = (day.morning?.length ?? 0) + (day.afternoon?.length ?? 0) + (day.evening?.length ?? 0);
    const hours = totalScheduleHours(events);
    const dateLabel = formatDayDate(day);

    // Refs map: place_id → element — used for scrollIntoView on selection
    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        if (!selectedPlace) return;
        const el = cardRefs.current[selectedPlace.place_id];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [selectedPlace]);

    return (
        <div className="flex flex-col h-full">
            {/* ── Sticky header ── */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-5 py-4 flex-shrink-0">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-orange-500 hover:bg-orange-500 text-white font-bold border-0">
                                Día {day.day_number}
                            </Badge>
                            {day.date && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span>{dateLabel}</span>
                                </div>
                            )}
                        </div>
                        <h2 className="text-base font-bold leading-snug">
                            {day.day_summary ?? day.notes ?? `Itinerario del Día ${day.day_number}`}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {totalPlaces} {totalPlaces === 1 ? 'lugar' : 'lugares'}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ~{Math.round(hours)}h de actividades
                    </span>
                </div>
            </div>

            {/* ── Timeline events ── */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-0">
                {events.map((event, idx) => {
                    const isLast = idx === events.length - 1;

                    return (
                        <div key={idx} className="flex gap-3">
                            {/* Timeline spine */}
                            <div className="flex flex-col items-center flex-shrink-0 pt-1">
                                {/* Node dot */}
                                <div
                                    className={`w-3 h-3 rounded-full border-2 flex-shrink-0 mt-1 transition-all duration-200 ${event.type === 'return'
                                            ? 'bg-muted-foreground/30 border-muted-foreground/40'
                                            : event.type === 'lunch'
                                                ? 'bg-orange-400 border-orange-500'
                                                : (event as PlaceEvent).place.place_id ===
                                                    selectedPlace?.place_id
                                                    ? 'bg-primary border-primary scale-125'
                                                    : 'bg-background border-foreground/30'
                                        }`}
                                />
                                {/* Connector line */}
                                {!isLast && (
                                    <div className="w-px flex-1 bg-border mt-1 mb-1 min-h-[1.5rem]" />
                                )}
                            </div>

                            {/* Card */}
                            <div
                                className="flex-1 pb-4"
                                ref={(el) => {
                                    if (event.type !== 'return' && event.type !== 'lunch') {
                                        cardRefs.current[(event as PlaceEvent).place.place_id] = el;
                                    } else if (event.type === 'lunch') {
                                        cardRefs.current[(event as PlaceEvent).place.place_id] = el;
                                    }
                                }}
                            >
                                {event.type === 'return' ? (
                                    <DayReturnCard
                                        time={event.time}
                                        accommodation={event.accommodation}
                                    />
                                ) : (
                                    <DayPlaceCard
                                        place={event.place}
                                        time={event.time}
                                        isSelected={
                                            selectedPlace?.place_id === event.place.place_id
                                        }
                                        onPlaceClick={onPlaceClick}
                                        variant={event.type === 'lunch' ? 'lunch' : 'place'}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
