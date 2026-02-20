'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DayPlan, PlaceInfo } from '@/store/chatStore';
import Image from 'next/image';
import { getPlacePhotos } from '@/lib/utils/google-places';

/* ─── Helpers ─────────────────────────────────────────────────── */

/** Collect all places from every time slot of a day. */
function getAllPlaces(day: DayPlan): PlaceInfo[] {
    return [...day.morning, ...day.afternoon, ...day.evening];
}

/** Build a compact route string: "Place A → Place B → …" */
function buildRouteChain(places: PlaceInfo[], maxVisible = 3): string {
    const names = places.map((p) => p.name);
    if (names.length <= maxVisible) return names.join(' → ');
    return names.slice(0, maxVisible).join(' → ') + ' → …';
}

/**
 * Format a single day's date as a short calendar label.
 * e.g. "Mar 1". Falls back to "Día N".
 */
export function formatDayDate(day: DayPlan): string {
    if (!day.date) return `Día ${day.day_number}`;
    try {
        const d = new Date(day.date + 'T12:00:00'); // noon to avoid tz-shift
        return d.toLocaleDateString('es-PE', { month: 'short', day: 'numeric' });
    } catch {
        return `Día ${day.day_number}`;
    }
}

/**
 * Format a date range for multi-day spans.
 * e.g. "Mar 1 – 3" or "Mar 28 – Abr 1".
 */
export function formatDateRange(startDay: DayPlan, endDay: DayPlan): string | null {
    if (!startDay.date || !endDay.date) return null;
    try {
        const start = new Date(startDay.date + 'T12:00:00');
        const end = new Date(endDay.date + 'T12:00:00');
        const startMonth = start.toLocaleDateString('es-PE', { month: 'short' });
        const endMonth = end.toLocaleDateString('es-PE', { month: 'short' });
        const startDay_ = start.getDate();
        const endDay_ = end.getDate();

        if (startMonth === endMonth) {
            // Same month: "Mar 1 – 3"
            return `${startMonth} ${startDay_} – ${endDay_}`;
        }
        // Different months: "Mar 28 – Abr 1"
        return `${startMonth} ${startDay_} – ${endMonth} ${endDay_}`;
    } catch {
        return null;
    }
}

/* ─── Image Carousel ──────────────────────────────────────────── */

/**
 * Horizontal image strip — exactly **1 photo per place**.
 * Images fill the card width (max 4 visible); wider aspect ratio.
 * Scrolls horizontally when there are more than 4 places.
 */
function DayImageCarousel({ places }: { places: PlaceInfo[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScroll, setCanScroll] = useState(false);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScroll(el.scrollWidth > el.clientWidth + 4);
    }, []);

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [checkScroll]);

    // 1 photo per place — take the first valid photo from each place
    const photoItems: { url: string; placeName: string }[] = [];
    places.forEach((place) => {
        const urls = getPlacePhotos(place.photos, 1, 600);
        const url = urls.find((u) => u && u !== '/placeholder-place.jpg') || urls[0];
        if (url) {
            photoItems.push({ url, placeName: place.name });
        }
    });

    if (photoItems.length === 0) return null;

    const visibleCount = Math.min(photoItems.length, 4);

    const scrollRight = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const slotWidth = el.clientWidth / visibleCount;
        el.scrollBy({ left: slotWidth, behavior: 'smooth' });
    }, [visibleCount]);

    return (
        <div className="relative group/carousel">
            <div
                ref={scrollRef}
                className="flex gap-1 overflow-x-auto scrollbar-hide scroll-smooth"
                onScroll={checkScroll}
            >
                {photoItems.map((item, idx) => (
                    <div
                        key={`${item.placeName}-${idx}`}
                        className="relative flex-shrink-0 rounded-lg overflow-hidden bg-muted"
                        style={{
                            width: `calc(${100 / visibleCount}% - ${((visibleCount - 1) * 4) / visibleCount
                                }px)`,
                            aspectRatio: '3 / 2',
                        }}
                        title={item.placeName}
                    >
                        <Image
                            src={item.url}
                            alt={item.placeName}
                            fill
                            className="object-cover"
                            sizes={`${Math.round(100 / visibleCount)}vw`}
                        />
                    </div>
                ))}
            </div>

            {/* Gradient fade on right edge when scrollable */}
            {canScroll && (
                <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-card/80 to-transparent pointer-events-none rounded-r-lg" />
            )}

            {/* Scroll-right button */}
            {canScroll && (
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        scrollRight();
                    }}
                    variant="secondary"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-opacity bg-black/40 hover:bg-black/60 border-0 text-white [&_svg]:text-white"
                    aria-label="Ver más imágenes"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            )}
        </div>
    );
}

/* ─── Tags row ────────────────────────────────────────────────── */

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
            <Badge className="bg-orange-500 hover:bg-orange-500 text-white font-semibold border-0">
                Día {dayNumber}
            </Badge>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground font-medium">
                {experienceCount} {experienceCount === 1 ? 'Experiencia' : 'Experiencias'}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground text-sm">{dateLabel}</span>
        </div>
    );
}

/* ─── Main export ─────────────────────────────────────────────── */

interface DayCardProps {
    day: DayPlan;
    onDaySelect: (dayNumber: number) => void;
}

/**
 * A single day card in the vertical itinerary timeline.
 *
 * Shows:
 * - Horizontal image carousel with **2 photos per place**
 * - Tag row: day number · experience count · calendar date (e.g. "Mar 1")
 * - Sequential route chain
 * - Day summary with arrow CTA
 */
export function DayCard({ day, onDaySelect }: DayCardProps) {
    const places = getAllPlaces(day);
    const experienceCount = places.length;
    const dateLabel = formatDayDate(day);
    const routeChain = buildRouteChain(places);
    const summary = day.day_summary || day.notes || `Explora lo mejor del Día ${day.day_number}`;

    return (
        <Card
            onClick={() => onDaySelect(day.day_number)}
            className="cursor-pointer shadow-md hover:shadow-xl transition-all group"
        >
            <CardContent className="p-5 space-y-4">
                {/* Image carousel — 2 photos per place */}
                <DayImageCarousel places={places} />

                {/* Tags */}
                <DayTags
                    dayNumber={day.day_number}
                    experienceCount={experienceCount}
                    dateLabel={dateLabel}
                />

                {/* Route chain */}
                {routeChain && (
                    <p className="text-xs text-muted-foreground truncate">{routeChain}</p>
                )}

                {/* Day summary + arrow */}
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold leading-snug line-clamp-2">
                        {summary}
                    </h3>
                    <ArrowRight className="w-5 h-5 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
            </CardContent>
        </Card>
    );
}
