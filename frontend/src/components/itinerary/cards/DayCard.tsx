'use client';

import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import type { DayPlan, PlaceInfo } from '@/store/chatStore';
import Image from 'next/image';
import { getPlacePhotos } from '@/lib/utils/google-places';

/* ─── Helpers ─────────────────────────────────────────────────── */

/** Collect all places from every time slot of a day. */
function getAllPlaces(day: DayPlan): PlaceInfo[] {
    return [...(day.morning || []), ...(day.afternoon || []), ...(day.evening || [])];
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
 * Muestra una imagen por cada experiencia del día.
 * - Si hay 4 o menos experiencias: grid responsive
 * - Si hay más de 4 experiencias: carrusel con navegación
 */
function DayImageCarousel({ places }: { places: PlaceInfo[] }) {
    // Recolectar una foto por cada lugar (experiencia)
    const photoItems: { url: string; placeName: string }[] = [];
    
    for (const place of places) {
        const urls = getPlacePhotos(place.photos, 1, 600);
        const url = urls.find((u) => u && u !== '/placeholder-place.jpg') || urls[0];
        
        if (url) {
            photoItems.push({ url, placeName: place.name });
        }
    }

    if (photoItems.length === 0) return null;

    // Si hay más de 4 experiencias, usar carrusel
    if (photoItems.length > 4) {
        return (
            <Carousel
                opts={{
                    align: 'start',
                    loop: true,
                }}
                className="w-full"
            >
                <CarouselContent>
                    {photoItems.map((item, idx) => (
                        <CarouselItem key={`${item.placeName}-${idx}`} className="basis-full sm:basis-1/2">
                            <div
                                className="relative rounded-lg overflow-hidden bg-muted"
                                style={{
                                    aspectRatio: '16 / 9',
                                }}
                                title={item.placeName}
                            >
                                <Image
                                    src={item.url}
                                    alt={item.placeName}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 100vw, 50vw"
                                />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
            </Carousel>
        );
    }

    // Si hay 4 o menos experiencias, usar grid responsive
    const gridCols = photoItems.length === 1 
        ? 'grid-cols-1' 
        : photoItems.length === 2 
        ? 'grid-cols-1 sm:grid-cols-2' 
        : photoItems.length === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-4';

    return (
        <div className={`grid ${gridCols} gap-2`}>
            {photoItems.map((item, idx) => (
                <div
                    key={`${item.placeName}-${idx}`}
                    className="relative rounded-lg overflow-hidden bg-muted"
                    style={{
                        aspectRatio: '16 / 9',
                    }}
                    title={item.placeName}
                >
                    <Image
                        src={item.url}
                        alt={item.placeName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 25vw"
                    />
                </div>
            ))}
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
        <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
            <Badge className="bg-orange-500 hover:bg-orange-500 text-white font-semibold border-0 text-xs">
                Día {dayNumber}
            </Badge>
            <span className="text-muted-foreground hidden sm:inline">·</span>
            <span className="text-muted-foreground font-medium">
                {experienceCount} {experienceCount === 1 ? 'Experiencia' : 'Experiencias'}
            </span>
            <span className="text-muted-foreground hidden sm:inline">·</span>
            <span className="text-muted-foreground text-xs sm:text-sm">{dateLabel}</span>
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
 * - Una imagen por cada experiencia (grid si ≤4, carrusel si >4)
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
                {/* Imágenes: grid o carrusel según cantidad de experiencias */}
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
