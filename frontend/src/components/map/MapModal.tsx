'use client';

import { X } from 'lucide-react';
import type { Itinerary, PlaceInfo } from '@/store/chatStore';
import { MinimalMapView } from './MinimalMapView';
import { useEffect } from 'react';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: Itinerary;
  selectedPlace?: PlaceInfo | null;
  onPlaceSelect: (place: PlaceInfo) => void;
}

export function MapModal({ isOpen, onClose, itinerary, selectedPlace, onPlaceSelect }: MapModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full h-full max-w-7xl max-h-[90vh] m-4 bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{itinerary.title}</h2>
            <p className="text-sm text-gray-600">Mapa completo del itinerario</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Map */}
        <div className="w-full h-full pt-20">
          <MinimalMapView
            itinerary={itinerary}
            selectedPlace={selectedPlace}
            onPlaceSelect={onPlaceSelect}
          />
        </div>
      </div>
    </div>
  );
}
