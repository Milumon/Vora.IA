'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, MapPin, Clock, Star, Save, Share2, Edit3, ImageIcon } from 'lucide-react';
import type { Itinerary, PlaceInfo } from '@/store/chatStore';
import Image from 'next/image';
import { getPlaceThumbnail } from '@/lib/utils/google-places';
import { PlaceDetailModal } from '@/components/map/overlays/PlaceDetailModal';

interface ItinerarySummaryCardProps {
  itinerary: Itinerary;
  onPlaceClick: (place: PlaceInfo) => void;
  onSave: () => void;
  onShare: () => void;
}

export function ItinerarySummaryCard({
  itinerary,
  onPlaceClick,
  onSave,
  onShare,
}: ItinerarySummaryCardProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [modalPlace, setModalPlace] = useState<PlaceInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const toggleDay = (dayNumber: number) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayNumber)) {
        newSet.delete(dayNumber);
      } else {
        newSet.add(dayNumber);
      }
      return newSet;
    });
  };

  const handlePlaceDetail = (place: PlaceInfo) => {
    setModalPlace(place);
    setModalOpen(true);
  };

  const renderPlace = (place: PlaceInfo, timeOfDay: string) => {
    const getTimeIcon = () => {
      if (timeOfDay === 'morning') return '🌅';
      if (timeOfDay === 'afternoon') return '☀️';
      return '🌙';
    };

    const thumbnail = getPlaceThumbnail(place.photos);
    const hasPhotos = place.photos && place.photos.filter(Boolean).length > 0;
    const photoCount = place.photos?.filter(Boolean).length || 0;

    return (
      <div
        key={place.place_id}
        className="flex gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors group"
        onClick={() => {
          onPlaceClick(place);
          handlePlaceDetail(place);
        }}
      >
        {/* Imagen del lugar */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          {hasPhotos && thumbnail ? (
            <>
              <Image
                src={thumbnail}
                alt={place.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="80px"
              />
              {photoCount > 1 && (
                <div className="absolute bottom-1 right-1 bg-black/60 text-white flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{ fontSize: '10px' }}>
                  <ImageIcon style={{ width: 10, height: 10 }} />
                  {photoCount}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {getTimeIcon()}
            </div>
          )}
        </div>

        {/* Información del lugar */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
            {place.name}
          </h4>
          
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {place.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{place.rating}</span>
              </div>
            )}
            {place.visit_duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{place.visit_duration}</span>
              </div>
            )}
          </div>

          {place.why_visit && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {place.why_visit}
            </p>
          )}
        </div>

        {/* Indicador de mapa */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 space-y-6 bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-foreground">{itinerary.title}</h3>
        <p className="text-muted-foreground">{itinerary.description}</p>
        
        {itinerary.estimated_budget && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Presupuesto estimado:</span>
            <span className="text-primary font-semibold">{itinerary.estimated_budget}</span>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={onSave} className="flex-1 sm:flex-none">
          <Save className="h-4 w-4 mr-2" />
          Guardar Itinerario
        </Button>
        <Button onClick={onShare} variant="outline" className="flex-1 sm:flex-none">
          <Share2 className="h-4 w-4 mr-2" />
          Compartir
        </Button>
        <Button variant="outline" className="flex-1 sm:flex-none">
          <Edit3 className="h-4 w-4 mr-2" />
          Hacer Ajustes
        </Button>
      </div>

      {/* Días del itinerario */}
      <div className="space-y-3">
        {itinerary.day_plans.map((day) => {
          const isExpanded = expandedDays.has(day.day_number);
          const totalPlaces =
            day.morning.length + day.afternoon.length + day.evening.length;

          return (
            <Card key={day.day_number} className="overflow-hidden">
              {/* Header del día */}
              <button
                onClick={() => toggleDay(day.day_number)}
                className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {day.day_number}
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold">Día {day.day_number}</h4>
                    <p className="text-sm text-muted-foreground">
                      {totalPlaces} {totalPlaces === 1 ? 'lugar' : 'lugares'}
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {/* Contenido del día */}
              {isExpanded && (
                <div className="p-4 pt-0 space-y-4 border-t">
                  {/* Mañana */}
                  {day.morning.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <span>🌅</span> Mañana
                      </h5>
                      <div className="space-y-2">
                        {day.morning.map((place) => renderPlace(place, 'morning'))}
                      </div>
                    </div>
                  )}

                  {/* Tarde */}
                  {day.afternoon.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <span>☀️</span> Tarde
                      </h5>
                      <div className="space-y-2">
                        {day.afternoon.map((place) => renderPlace(place, 'afternoon'))}
                      </div>
                    </div>
                  )}

                  {/* Noche */}
                  {day.evening.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <span>🌙</span> Noche
                      </h5>
                      <div className="space-y-2">
                        {day.evening.map((place) => renderPlace(place, 'evening'))}
                      </div>
                    </div>
                  )}

                  {/* Notas del día */}
                  {day.notes && (
                    <div className="mt-4 p-3 bg-accent/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">💡 Consejo:</span> {day.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Tips generales */}
      {itinerary.tips && itinerary.tips.length > 0 && (
        <Card className="p-4 bg-accent/30">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <span>💡</span> Consejos Importantes
          </h4>
          <ul className="space-y-2">
            {itinerary.tips.map((tip, index) => (
              <li key={index} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-primary">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <PlaceDetailModal
        place={modalPlace}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </Card>
  );
}
