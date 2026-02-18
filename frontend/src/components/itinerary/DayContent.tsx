'use client';

import { useState } from 'react';
import { MapPin, Clock, Star, ChevronRight } from 'lucide-react';
import type { DayPlan, PlaceInfo } from '@/store/chatStore';
import Image from 'next/image';
import { getPlaceThumbnail } from '@/lib/utils/google-places';
import { PlaceDetailModal } from '@/components/map/PlaceDetailModal';

interface DayContentProps {
  day: DayPlan;
  onPlaceClick: (place: PlaceInfo) => void;
}

export function DayContent({ day, onPlaceClick }: DayContentProps) {
  const [modalPlace, setModalPlace] = useState<PlaceInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handlePlaceClick = (place: PlaceInfo) => {
    onPlaceClick(place);
    setModalPlace(place);
    setModalOpen(true);
  };

  const allPlaces = [...day.morning, ...day.afternoon, ...day.evening];
  const firstPlace = allPlaces[0];
  const location = firstPlace?.address?.split(',')[0] || 'Destino';

  return (
    <div className="bg-white px-6 py-6">
      {/* Header del día */}
      <div className="flex items-start gap-4 mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white font-bold flex-shrink-0">
          {day.day_number}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Días {day.day_number}-{day.day_number}
          </h2>
          <p className="text-sm text-gray-600">
            abr {day.day_number} - {day.day_number}
          </p>
        </div>
      </div>

      {/* Descripción del día */}
      {day.notes && (
        <div className="mb-6">
          <p className="text-gray-700 leading-relaxed">
            {day.notes}
          </p>
        </div>
      )}

      {/* Galería de imágenes */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {allPlaces.slice(0, 4).map((place, index) => (
          <button
            key={`${place.place_id}-${index}`}
            onClick={() => handlePlaceClick(place)}
            className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-200 hover:opacity-90 transition-opacity"
          >
            <Image
              src={getPlaceThumbnail(place.photos)}
              alt={place.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </button>
        ))}
      </div>

      {/* Lista de lugares */}
      <div className="space-y-3">
        {allPlaces.map((place, index) => (
          <button
            key={`${place.place_id}-${index}`}
            onClick={() => handlePlaceClick(place)}
            className="w-full text-left group"
          >
            <div className="flex gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
              {/* Thumbnail */}
              <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-gray-200">
                <Image
                  src={getPlaceThumbnail(place.photos)}
                  alt={place.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-gray-700">
                  {place.name}
                </h4>
                
                <div className="flex items-center gap-2 mt-1">
                  {place.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-gray-900 text-gray-900" />
                      <span className="text-xs text-gray-600">{place.rating}</span>
                    </div>
                  )}
                  {place.visit_duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600">{place.visit_duration}</span>
                    </div>
                  )}
                </div>

                {place.why_visit && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {place.why_visit}
                  </p>
                )}
              </div>

              {/* Arrow */}
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>

      <PlaceDetailModal
        place={modalPlace}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
