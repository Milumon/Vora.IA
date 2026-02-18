'use client';

import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface TravelVisualizerProps {
  destination?: string;
  isGenerating?: boolean;
}

const DESTINATION_IMAGES: Record<string, string[]> = {
  cusco: [
    '/images/destinations/cusco-1.jpg',
    '/images/destinations/cusco-2.jpg',
    '/images/destinations/cusco-3.jpg',
  ],
  lima: [
    '/images/destinations/lima-1.jpg',
    '/images/destinations/lima-2.jpg',
    '/images/destinations/lima-3.jpg',
  ],
  arequipa: [
    '/images/destinations/arequipa-1.jpg',
    '/images/destinations/arequipa-2.jpg',
    '/images/destinations/arequipa-3.jpg',
  ],
  default: [
    '/images/destinations/peru-1.jpg',
    '/images/destinations/peru-2.jpg',
    '/images/destinations/peru-3.jpg',
  ],
};

export function TravelVisualizer({ destination, isGenerating = false }: TravelVisualizerProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const destinationKey = destination?.toLowerCase() || 'default';
  const images = DESTINATION_IMAGES[destinationKey] || DESTINATION_IMAGES.default;

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isGenerating, images.length]);

  return (
    <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col items-center justify-center p-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
      <div className="max-w-md w-full space-y-6">
        {/* Título */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {isGenerating ? 'Construyendo tu Itinerario' : 'Entendiendo tu viaje...'}
          </h2>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            {destination ? `Explorando ${destination}` : 'Descubre Perú'}
          </p>
        </div>

        {/* Galería de imágenes */}
        <div className="relative">
          <div className="grid grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <Card
                key={idx}
                className={`relative aspect-square overflow-hidden transition-all duration-500 ${
                  idx === 1 ? 'col-span-3 row-span-2 scale-105 z-10' : 'opacity-80'
                }`}
              >
                <div className="relative w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800 to-pink-800">
                  {/* Placeholder - reemplazar con imágenes reales */}
                  <div className="absolute inset-0 flex items-center justify-center text-purple-400 dark:text-purple-600">
                    <span className="text-4xl">📸</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Indicador de progreso */}
        {isGenerating && (
          <div className="flex justify-center gap-2">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentImageIndex
                    ? 'w-8 bg-purple-600 dark:bg-purple-400'
                    : 'w-2 bg-purple-300 dark:bg-purple-700'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
