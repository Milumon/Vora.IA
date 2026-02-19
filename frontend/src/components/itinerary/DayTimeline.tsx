'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlaceCard } from './cards/PlaceCard';
import { Sunrise, Sun, Moon } from 'lucide-react';

interface DayTimelineProps {
  day: {
    day_number: number;
    date?: string;
    morning: any[];
    afternoon: any[];
    evening: any[];
    notes?: string;
  };
  dayNumber: number;
}

const timeOfDayConfig = {
  morning: {
    label: 'Mañana',
    icon: Sunrise,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  },
  afternoon: {
    label: 'Tarde',
    icon: Sun,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  },
  evening: {
    label: 'Noche',
    icon: Moon,
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
};

export function DayTimeline({ day, dayNumber }: DayTimelineProps) {
  return (
    <Card className="overflow-hidden">
      {/* Day Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Día {dayNumber}</h3>
            {day.date && (
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(day.date).toLocaleDateString('es-PE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="space-y-8">
          {/* Morning */}
          {day.morning && day.morning.length > 0 && (
            <TimeSection
              timeOfDay="morning"
              places={day.morning}
              config={timeOfDayConfig.morning}
            />
          )}

          {/* Afternoon */}
          {day.afternoon && day.afternoon.length > 0 && (
            <TimeSection
              timeOfDay="afternoon"
              places={day.afternoon}
              config={timeOfDayConfig.afternoon}
            />
          )}

          {/* Evening */}
          {day.evening && day.evening.length > 0 && (
            <TimeSection
              timeOfDay="evening"
              places={day.evening}
              config={timeOfDayConfig.evening}
            />
          )}

          {/* Notes */}
          {day.notes && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border-subtle">
              <p className="text-sm text-muted-foreground italic">{day.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TimeSection({
  timeOfDay,
  places,
  config,
}: {
  timeOfDay: string;
  places: any[];
  config: { label: string; icon: any; color: string };
}) {
  const Icon = config.icon;

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
