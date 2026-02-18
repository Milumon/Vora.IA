'use client';

import { useState } from 'react';
import { MapPin, Clock, Star, ChevronRight } from 'lucide-react';
import type { Itinerary, PlaceInfo } from '@/store/chatStore';
import Image from 'next/image';
import { getPlaceThumbnail } from '@/lib/utils/google-places';
import { PlaceDetailModal } from '@/components/map/PlaceDetailModal';

interface CompactTimelineProps {
  itinerary: Itinerary;
  onPlaceClick: (place: PlaceInfo) => void;
}

export function CompactTimeline({ itinerary, onPlaceClick }: CompactTimelineProps) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [modalPlace, setModalPlace] = useState<PlaceInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const currentDay = itinerary.day_plans.find(d => d.day_number === selectedDay);
  if (!currentDay) return null;

  const allPlaces = [...currentDay.morning, ...currentDay.afternoon, ...currentDay.evening];

  const handlePlaceClick = (place: PlaceInfo) => {
    onPlaceClick(place);
    setModalPlace(place);
    setModalOpen(true);
  };

  const getTimeLabel = (index: number) => {
    const morningCount = currentDay.morning.length;
    const afternoonCount = currentDay.afternoon.length;
    
    if (index < morningCount) return 'Mañana';
    if (index < morningCount + afternoonCount) return 'Tarde';
    return 'Noche';
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header con selector de días */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Itinerario</h3>
          <span className="text-xs text-gray-500">{itinerary.day_plans.length} días</span>
        </div>
        
        {/* Day selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {itinerary.day_plans.map((day) => (
            <button
              key={day.day_number}
              onClick={() => setSelectedDay(day.day_number)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedDay === day.day_number
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Día {day.day_number}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

          {/* Places */}
          <div className="space-y-4">
            {allPlaces.map((place, index) => {
              const timeLabel = getTimeLabel(index);
              const showTimeLabel = index === 0 || 
                getTimeLabel(index - 1) !== timeLabel;

              return (
                <div key={`${place.place_id}-${index}`} className="relative">
                  {/* Time label */}
                  {showTimeLabel && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-900 flex items-center justify-center z-10">
                        <div className="w-2 h-2 rounded-full bg-gray-900" />
                      </div>
                      <span className="text-xs font-medium text-gray-900">{timeLabel}</span>
                    </div>
                  )}

                  {/* Place card */}
                  <div className="ml-12 -mt-8">
                    <button
                      onClick={() => handlePlaceClick(place)}
                      className="w-full text-left group"
                    >
                      <div className="flex gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                        {/* Thumbnail */}
                        <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-gray-200">
                          <Image
                            src={getPlaceThumbnail(place.photos)}
                            alt={place.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-gray-700">
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
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer con info del día */}
      {currentDay.notes && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600">
            <span className="font-medium">💡 Consejo:</span> {currentDay.notes}
          </p>
        </div>
      )}

      <PlaceDetailModal
        place={modalPlace}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
