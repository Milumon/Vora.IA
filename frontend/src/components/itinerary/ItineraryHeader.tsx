'use client';

import { Calendar, MapPin, Star, Hotel, Car } from 'lucide-react';
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

  // Contar estadísticas
  const totalPlaces = itinerary.day_plans.reduce((acc, day) => 
    acc + day.morning.length + day.afternoon.length + day.evening.length, 0
  );

  const cities = new Set(
    itinerary.day_plans.flatMap(day => 
      [...day.morning, ...day.afternoon, ...day.evening].map(p => p.address?.split(',')[0])
    )
  ).size;

  return (
    <div className="bg-white">
      {/* Hero Image */}
      <div className="relative w-full h-64 bg-gray-200">
        <Image
          src={headerImage}
          alt={itinerary.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 60vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Vista previa badge */}
        <div className="absolute bottom-4 left-4">
          <button className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-medium rounded-full hover:bg-white transition-colors">
            Vista previa
          </button>
        </div>
      </div>

      {/* Header Content */}
      <div className="px-6 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {itinerary.title}
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-5 h-5" />
            <span className="text-sm">{itinerary.day_plans.length} días</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-5 h-5" />
            <span className="text-sm">{cities} {cities === 1 ? 'ciudad' : 'ciudades'}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-700">
            <Star className="w-5 h-5" />
            <span className="text-sm">{totalPlaces} experiencias</span>
          </div>
          
          {itinerary.estimated_budget && (
            <div className="flex items-center gap-2 text-gray-700">
              <Hotel className="w-5 h-5" />
              <span className="text-sm">1 hoteles</span>
            </div>
          )}
        </div>

        {/* Transport info */}
        <div className="flex items-center gap-2 text-gray-700 mb-4">
          <Car className="w-5 h-5" />
          <span className="text-sm">2 transportes</span>
        </div>

        {/* Description */}
        {itinerary.description && (
          <p className="text-sm text-gray-600 leading-relaxed">
            {itinerary.description}
          </p>
        )}
      </div>
    </div>
  );
}
