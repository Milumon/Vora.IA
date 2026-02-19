'use client';

import { Badge } from '@/components/ui/badge';
import { PlaceCard } from '../cards/PlaceCard';
import { Sunrise, Sun, Moon } from 'lucide-react';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

const TIME_OF_DAY_CONFIG: Record<TimeOfDay, { label: string; Icon: typeof Sunrise; color: string }> = {
    morning: {
        label: 'Mañana',
        Icon: Sunrise,
        color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    },
    afternoon: {
        label: 'Tarde',
        Icon: Sun,
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    },
    evening: {
        label: 'Noche',
        Icon: Moon,
        color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    },
};

interface TimeOfDaySectionProps {
    timeOfDay: TimeOfDay;
    places: any[];
}

/**
 * Renders a time-of-day section (morning/afternoon/evening) with a
 * vertical timeline line, icon badge, and list of PlaceCards.
 * Extracted from DayTimeline to be reusable.
 */
export function TimeOfDaySection({ timeOfDay, places }: TimeOfDaySectionProps) {
    const config = TIME_OF_DAY_CONFIG[timeOfDay];
    const { Icon } = config;

    if (!places || places.length === 0) return null;

    return (
        <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border-subtle" />

            {/* Time Badge */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-border">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <Badge variant="outline" className={config.color}>
                    {config.label}
                </Badge>
            </div>

            {/* Places */}
            <div className="ml-12 space-y-4">
                {places.map((place, idx) => (
                    <PlaceCard key={idx} place={place} />
                ))}
            </div>
        </div>
    );
}
