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
    acc + day.morning.length + day.afternoon.length + day.evening.length, 0
  );

  const cities = new Set(
    itinerary.day_plans.flatMap(day =>
      [...day.morning, ...day.afternoon, ...day.evening].map(p => p.address?.split(',')[0])
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
    <div className="bg-white p-6 flex gap-8 items-start z-0">
      {/* Left Column: Image */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="relative w-[300px] h-[300px] rounded-3xl overflow-hidden shadow-sm transition-transform hover:scale-[1.02]">
          <Image
            src={headerImage}
            alt={itinerary.title}
            fill
            className="object-cover"
            sizes="300px"
            priority
          />
        </div>
        <button className="text-sm font-semibold text-gray-900 underline underline-offset-4 hover:text-gray-700 text-center w-[300px]">
          Vista previa
        </button>
      </div>

      {/* Right Column: Content */}
      <div className="flex-grow pt-4">
        <h1 className="text-4xl font-bold text-[#2D2840] mb-6 leading-tight">
          {itinerary.title}
        </h1>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 text-gray-700">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 stroke-[1.5]" />
            <span className="text-base font-medium">{itinerary.day_plans.length} días</span>
          </div>

          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 stroke-[1.5]" />
            <span className="text-base font-medium">{cities} {cities === 1 ? 'ciudad' : 'ciudades'}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Star className="w-5 h-5 stroke-[1.5]" />
            <span className="text-base font-medium">{totalPlaces} experiencias</span>
          </div>

          {totalHotels > 0 && (
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 stroke-[1.5]" />
              <span className="text-base font-medium">
                {totalHotels} {totalHotels === 1 ? 'hotel' : 'hoteles'}
              </span>
            </div>
          )}

          {totalTransports > 0 && (
            <div className="flex items-center gap-2.5">
              <Plane className="w-5 h-5 stroke-[1.5]" />
              <span className="text-base font-medium">
                {totalTransports} {totalTransports === 1 ? 'transporte' : 'transportes'}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {itinerary.description && (
          <p className="mt-6 text-gray-600 leading-relaxed max-w-2xl">
            {itinerary.description}
          </p>
        )}
      </div>
    </div>
  );
}
