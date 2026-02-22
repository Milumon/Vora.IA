'use client';

import { Calendar, MapPin, Star, Building2, Plane } from 'lucide-react';
import type { Itinerary } from '@/store/chatStore';
import Image from 'next/image';
import { getPlaceThumbnail } from '@/lib/utils/google-places';

interface ItineraryHeaderProps {
  itinerary: Itinerary;
}

export function ItineraryHeader({ itinerary }: ItineraryHeaderProps) {
  // Obtener la primera imagen del itinerario
  const firstPlace = itinerary.day_plans[0]?.morning[0] ||
    itinerary.day_plans[0]?.afternoon[0] ||
    itinerary.day_plans[0]?.evening[0];

  const headerImage = firstPlace ? getPlaceThumbnail(firstPlace.photos) : '/placeholder-place.jpg';

  // ── Stats dinámicos ────────────────────────────────────────────────
  const totalPlaces = itinerary.day_plans.reduce((acc, day) =>
    acc + (day.morning?.length || 0) + (day.afternoon?.length || 0) + (day.evening?.length || 0), 0
  );

  const cities = new Set(
    itinerary.day_plans.flatMap(day =>
      [...(day.morning || []), ...(day.afternoon || []), ...(day.evening || [])].map(p => p.address?.split(',')[0])
    )
  ).size;

  // Contar hoteles reales desde accommodation en day_plans
  const totalHotels = itinerary.day_plans.reduce((acc, day) => {
    const accommodation = (day as any).accommodation;
    return acc + (Array.isArray(accommodation) ? accommodation.length : 0);
  }, 0);

  // Contar segmentos de transporte reales desde mobility en day_plans
  const totalTransports = itinerary.day_plans.filter((day) => {
    return !!(day as any).mobility;
  }).length;

  return (
    <div className="bg-white dark:bg-black p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-8 items-start z-0">
      {/* Left Column: Image */}
      <div className="w-full md:w-auto flex-shrink-0 flex flex-col gap-3">
        <div className="relative w-full md:w-[300px] h-[200px] md:h-[300px] rounded-2xl md:rounded-3xl overflow-hidden shadow-sm transition-transform hover:scale-[1.02]">
          <Image
            src={headerImage || '/placeholder-place.jpg'}
            alt={itinerary.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 300px"
            priority
          />
        </div>
        <button className="text-sm font-semibold text-gray-900 dark:text-white underline underline-offset-4 hover:text-gray-700 dark:hover:text-gray-300 text-center w-full md:w-[300px]">
          Vista previa
        </button>
      </div>

      {/* Right Column: Content */}
      <div className="flex-grow w-full md:pt-4">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6 leading-tight">
          {itinerary.title}
        </h1>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-x-4 md:gap-x-6 gap-y-3 md:gap-y-4 text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 stroke-[1.5]" />
            <span className="text-sm md:text-base font-medium">{itinerary.day_plans.length} días</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 md:w-5 md:h-5 stroke-[1.5]" />
            <span className="text-sm md:text-base font-medium">{cities} {cities === 1 ? 'ciudad' : 'ciudades'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 md:w-5 md:h-5 stroke-[1.5]" />
            <span className="text-sm md:text-base font-medium">{totalPlaces} experiencias</span>
          </div>

          {totalHotels > 0 && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 md:w-5 md:h-5 stroke-[1.5]" />
              <span className="text-sm md:text-base font-medium">
                {totalHotels} {totalHotels === 1 ? 'hotel' : 'hoteles'}
              </span>
            </div>
          )}

          {totalTransports > 0 && (
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 md:w-5 md:h-5 stroke-[1.5]" />
              <span className="text-sm md:text-base font-medium">
                {totalTransports} {totalTransports === 1 ? 'transporte' : 'transportes'}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {itinerary.description && (
          <p className="mt-4 md:mt-6 text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
            {itinerary.description}
          </p>
        )}
      </div>
    </div>
  );
}
