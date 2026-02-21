'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DayPlan, PlaceInfo, Itinerary } from '@/store/chatStore';
import { DayMapView } from '@/components/map/views/DayMapView';
import { DayScheduleTimeline } from './DayScheduleTimeline';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

interface DayDetailViewProps {
    day: DayPlan;
    itinerary: Itinerary;
}

/**
 * Split-screen layout for a single day's detail view.
 *
 * LEFT (50%)  — Interactive map (DayMapView)
 * RIGHT (50%) — Scrollable schedule timeline (DayScheduleTimeline)
 *
 * Bidirectional sync:
 * - Clicking a card → map pans + zooms + shows tooltip
 * - Clicking a map marker → card receives selectedPlace and scrolls into view
 */
export function DayDetailView({ day, itinerary }: DayDetailViewProps) {
    const [selectedPlace, setSelectedPlace] = useState<PlaceInfo | null>(null);
    const router = useRouter();
    const locale = useLocale();

    return (
        <div
            className="relative flex w-full overflow-hidden"
            style={{ height: 'calc(100vh - 4rem)' }}
        >
            {/* ── Back button (floating) ── */}
            <div className="absolute top-4 right-4 z-30">
                <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1.5 shadow-md bg-background/90 backdrop-blur-sm hover:bg-background"
                    onClick={() => router.push(`/${locale}/chat`)}
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-xs font-medium">Itinerario</span>
                </Button>
            </div>

            {/* ── LEFT: Map (50%) ── */}
            <div className="w-1/2 relative flex-shrink-0 border-r border-border">
                <DayMapView
                    day={day}
                    selectedPlace={selectedPlace}
                    onPlaceSelect={setSelectedPlace}
                />
            </div>

            {/* ── RIGHT: Timeline (50%) ── */}
            <div className="w-1/2 flex flex-col bg-background overflow-hidden">
                <DayScheduleTimeline
                    day={day}
                    onPlaceClick={setSelectedPlace}
                    selectedPlace={selectedPlace}
                />
            </div>
        </div>
    );
}
