'use client';

import { useState } from 'react';
import { MapPin, Plane } from 'lucide-react';
import type { Itinerary } from '@/store/chatStore';

interface DayTimelineHorizontalProps {
  itinerary: Itinerary;
  selectedDay: number;
  onDaySelect: (day: number) => void;
}

export function DayTimelineHorizontal({ itinerary, selectedDay, onDaySelect }: DayTimelineHorizontalProps) {
  // Obtener ciudades principales por día
  const getDayLocation = (dayNumber: number) => {
    const day = itinerary.day_plans.find(d => d.day_number === dayNumber);
    if (!day) return '';
    
    const firstPlace = day.morning[0] || day.afternoon[0] || day.evening[0];
    if (!firstPlace?.address) return '';
    
    return firstPlace.address.split(',')[0];
  };

  return (
    <div className="bg-white px-6 py-6 border-b border-gray-200">
      {/* Timeline horizontal */}
      <div className="relative">
        {/* Línea horizontal */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200" />

        {/* Nodos de días */}
        <div className="relative flex justify-between items-start">
          {itinerary.day_plans.map((day, index) => {
            const isSelected = day.day_number === selectedDay;
            const isFirst = index === 0;
            const isLast = index === itinerary.day_plans.length - 1;
            const location = getDayLocation(day.day_number);

            return (
              <div key={day.day_number} className="flex flex-col items-center flex-1">
                {/* Nodo */}
                <button
                  onClick={() => onDaySelect(day.day_number)}
                  className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-gray-900 text-white ring-4 ring-gray-200'
                      : 'bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {isFirst || isLast ? (
                    <MapPin className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold">{day.day_number}</span>
                  )}
                </button>

                {/* Label */}
                <div className="mt-3 text-center">
                  <p className={`text-xs font-medium ${
                    isSelected ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {isFirst ? 'Inicio' : isLast ? 'Fin' : `Días ${day.day_number}`}
                  </p>
                  {location && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isFirst ? 'Lima' : location}
                    </p>
                  )}
                  {!isFirst && !isLast && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      abr {day.day_number} - {day.day_number}
                    </p>
                  )}
                </div>

                {/* Icono de transporte entre nodos */}
                {!isLast && (
                  <div className="absolute top-4 left-1/2 transform translate-x-12">
                    <div className="bg-white p-1 rounded-full border border-gray-200">
                      <Plane className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
