'use client';

import type { Itinerary, PlaceInfo } from '@/store/chatStore';
import {
  Plan,
  PlanHeader,
  PlanTitle,
  PlanDescription,
  PlanAction,
  PlanContent,
  PlanFooter,
  PlanTrigger,
} from '@/components/ai-elements/plan';
import {
  Queue,
  QueueSection,
  QueueSectionTrigger,
  QueueSectionLabel,
  QueueSectionContent,
  QueueList,
  QueueItem,
  QueueItemContent,
  QueueItemIndicator,
  QueueItemDescription,
} from '@/components/ai-elements/queue';
import {
  Plane,
  Sunrise,
  Sun,
  Moon,
  Lightbulb,
  Wallet,
  MapPin,
  Clock,
  Star,
  Save,
  Share2,
  Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ─── Helpers ────────────────────────────────────────────────── */

const ARRIVAL_KEYWORDS = [
  'clima', 'temperatura', 'frío', 'calor', 'lluvia', 'seco', 'soleado',
  'altura', 'altitud', 'mal de altura', 'aclimát', 'soroche', 'mate de coca',
  'transporte', 'taxi', 'bus', 'aeropuerto', 'llegar', 'vuelo', 'terminal',
];

function categorizeTips(tips: string[]): { arrival: string[]; general: string[] } {
  const arrival: string[] = [];
  const general: string[] = [];

  tips.forEach((tip) => {
    const lower = tip.toLowerCase();
    if (ARRIVAL_KEYWORDS.some((kw) => lower.includes(kw))) {
      arrival.push(tip);
    } else {
      general.push(tip);
    }
  });

  return { arrival, general };
}

/* ─── Place Item (reusable row) ──────────────────────────────── */

function PlaceRow({
  place,
  onPlaceClick,
}: {
  place: PlaceInfo;
  onPlaceClick?: (place: PlaceInfo) => void;
}) {
  return (
    <QueueItem
      className="cursor-pointer hover:bg-accent/60"
      onClick={() => onPlaceClick?.(place)}
    >
      <div className="flex items-start gap-2">
        <QueueItemIndicator className="mt-1.5" />
        <div className="flex-1 min-w-0">
          <QueueItemContent className="!line-clamp-none flex items-center gap-2 !text-foreground font-medium">
            {place.name}
            {place.rating && (
              <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground font-normal">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {place.rating}
              </span>
            )}
          </QueueItemContent>

          {place.why_visit && (
            <QueueItemDescription className="!line-clamp-2 mt-0.5">
              {place.why_visit}
            </QueueItemDescription>
          )}

          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {place.visit_duration && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {place.visit_duration}
              </span>
            )}
            {place.address && (
              <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
                <MapPin className="h-3 w-3 shrink-0" />
                {place.address}
              </span>
            )}
          </div>
        </div>
      </div>
    </QueueItem>
  );
}

/* ─── Time of Day Section ────────────────────────────────────── */

function TimeSection({
  label,
  icon,
  places,
  onPlaceClick,
}: {
  label: string;
  icon: React.ReactNode;
  places: PlaceInfo[];
  onPlaceClick?: (place: PlaceInfo) => void;
}) {
  if (places.length === 0) return null;

  return (
    <QueueSection defaultOpen>
      <QueueSectionTrigger>
        <QueueSectionLabel
          label={label}
          count={places.length}
          icon={icon}
        />
      </QueueSectionTrigger>
      <QueueSectionContent>
        <QueueList className="max-h-none">
          {places.map((place) => (
            <PlaceRow
              key={place.place_id}
              place={place}
              onPlaceClick={onPlaceClick}
            />
          ))}
        </QueueList>
      </QueueSectionContent>
    </QueueSection>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */

interface ItineraryMessageProps {
  itinerary: Itinerary;
  onPlaceClick?: (place: PlaceInfo) => void;
  onSave?: () => void;
  onShare?: () => void;
}

export function ItineraryMessage({
  itinerary,
  onPlaceClick,
  onSave,
  onShare,
}: ItineraryMessageProps) {
  const { arrival: arrivalTips, general: generalTips } = categorizeTips(
    itinerary.tips || [],
  );

  return (
    <Plan defaultOpen className="w-full border-orange-200/50 dark:border-orange-800/30">
      {/* ── Header ─────────────────────────────────────────────── */}
      <PlanHeader>
        <div className="space-y-1.5">
          <PlanTitle>{itinerary.title}</PlanTitle>
          <PlanDescription>{itinerary.description}</PlanDescription>
        </div>
        <PlanAction>
          <PlanTrigger />
        </PlanAction>
      </PlanHeader>

      {/* ── Content ────────────────────────────────────────────── */}
      <PlanContent className="space-y-5">
        {/* Budget badge */}
        {itinerary.estimated_budget && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200/60 dark:border-orange-800/30">
            <Wallet className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0" />
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
              💰 Presupuesto estimado: {itinerary.estimated_budget}
            </span>
          </div>
        )}

        {/* ── Arrival Recommendations ────────────────────────── */}
        {arrivalTips.length > 0 && (
          <Queue className="border-blue-200/60 dark:border-blue-800/30 bg-blue-50/30 dark:bg-blue-900/10">
            <QueueSection defaultOpen>
              <QueueSectionTrigger className="text-blue-700 dark:text-blue-400">
                <QueueSectionLabel
                  label="Recomendaciones al llegar"
                  count={arrivalTips.length}
                  icon={<Plane className="h-4 w-4 text-blue-500" />}
                />
              </QueueSectionTrigger>
              <QueueSectionContent>
                <QueueList className="max-h-none">
                  {arrivalTips.map((tip, idx) => (
                    <QueueItem key={idx}>
                      <div className="flex items-start gap-2">
                        <QueueItemIndicator className="mt-1.5 !border-blue-400 !bg-blue-100 dark:!bg-blue-900/40" />
                        <QueueItemContent className="!line-clamp-none !text-foreground/90">
                          {tip}
                        </QueueItemContent>
                      </div>
                    </QueueItem>
                  ))}
                </QueueList>
              </QueueSectionContent>
            </QueueSection>
          </Queue>
        )}

        {/* ── Day Plans ──────────────────────────────────────── */}
        {itinerary.day_plans.map((day) => (
          <div key={day.day_number} className="space-y-2">
            {/* Day heading */}
            <h3 className="flex items-center gap-2.5 font-bold text-base">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-sm font-bold shrink-0">
                {day.day_number}
              </span>
              <span>
                Día {day.day_number}
                {day.date && (
                  <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                    — {day.date}
                  </span>
                )}
              </span>
            </h3>

            {/* Day summary */}
            {day.day_summary && (
              <p className="text-sm text-muted-foreground ml-10">
                {day.day_summary}
              </p>
            )}

            {/* Time sections */}
            <Queue className="ml-5">
              <TimeSection
                label="Mañana"
                icon={<Sunrise className="h-4 w-4 text-amber-500" />}
                places={day.morning}
                onPlaceClick={onPlaceClick}
              />
              <TimeSection
                label="Tarde"
                icon={<Sun className="h-4 w-4 text-orange-500" />}
                places={day.afternoon}
                onPlaceClick={onPlaceClick}
              />
              <TimeSection
                label="Noche"
                icon={<Moon className="h-4 w-4 text-indigo-500" />}
                places={day.evening}
                onPlaceClick={onPlaceClick}
              />
            </Queue>

            {/* Day-specific notes */}
            {day.notes && (
              <div className="flex items-start gap-2 ml-5 px-3 py-2 bg-amber-50/60 dark:bg-amber-900/10 rounded-lg border border-amber-200/50 dark:border-amber-800/30 text-sm">
                <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <span className="text-foreground/80">{day.notes}</span>
              </div>
            )}
          </div>
        ))}

        {/* ── General Tips ───────────────────────────────────── */}
        {generalTips.length > 0 && (
          <Queue className="border-yellow-200/60 dark:border-yellow-800/30 bg-yellow-50/30 dark:bg-yellow-900/10">
            <QueueSection defaultOpen>
              <QueueSectionTrigger className="text-yellow-700 dark:text-yellow-400">
                <QueueSectionLabel
                  label="Tips Clave"
                  count={generalTips.length}
                  icon={<Lightbulb className="h-4 w-4 text-yellow-500" />}
                />
              </QueueSectionTrigger>
              <QueueSectionContent>
                <QueueList className="max-h-none">
                  {generalTips.map((tip, idx) => (
                    <QueueItem key={idx}>
                      <div className="flex items-start gap-2">
                        <QueueItemIndicator className="mt-1.5 !border-yellow-400 !bg-yellow-100 dark:!bg-yellow-900/40" />
                        <QueueItemContent className="!line-clamp-none !text-foreground/90">
                          {tip}
                        </QueueItemContent>
                      </div>
                    </QueueItem>
                  ))}
                </QueueList>
              </QueueSectionContent>
            </QueueSection>
          </Queue>
        )}
      </PlanContent>

      {/* ── Footer actions ───────────────────────────────────── */}
      {(onSave || onShare) && (
        <PlanFooter className="flex-wrap gap-2 pt-4 border-t">
          {onSave && (
            <Button onClick={onSave} size="sm" className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              Guardar
            </Button>
          )}
          {onShare && (
            <Button onClick={onShare} size="sm" variant="outline" className="gap-1.5">
              <Share2 className="h-3.5 w-3.5" />
              Compartir
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1.5">
            <Edit3 className="h-3.5 w-3.5" />
            Ajustar
          </Button>
        </PlanFooter>
      )}
    </Plan>
  );
}
