'use client';

import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import type { Itinerary, PlaceInfo } from '@/store/chatStore';
import { Maximize2, Loader2 } from 'lucide-react';

interface CompactMapPreviewProps {
  itinerary: Itinerary;
  onOpenFullMap: () => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: -12.0464,
  lng: -77.0428,
};

// Colores por día
const DAY_COLORS = [
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#3B82F6', // blue
  '#EC4899', // pink
  '#14B8A6', // teal
];

export function CompactMapPreview({ itinerary, onOpenFullMap }: CompactMapPreviewProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [allPlaces, setAllPlaces] = useState<Array<PlaceInfo & { dayNumber: number }>>([]);

  useEffect(() => {
    const places: Array<PlaceInfo & { dayNumber: number }> = [];
    
    itinerary.day_plans.forEach((day) => {
      [...day.morning, ...day.afternoon, ...day.evening].forEach((place) => {
        places.push({ ...place, dayNumber: day.day_number });
      });
    });

    setAllPlaces(places);
  }, [itinerary]);

  useEffect(() => {
    if (map && allPlaces.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      allPlaces.forEach((place) => {
        bounds.extend(new google.maps.LatLng(place.location.lat, place.location.lng));
      });
      map.fitBounds(bounds);
    }
  }, [map, allPlaces]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const getMarkerIcon = (dayNumber: number) => {
    const color = DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 8,
    };
  };

  const getRoutePaths = () => {
    const paths: google.maps.LatLngLiteral[][] = [];
    
    itinerary.day_plans.forEach((day) => {
      const dayPlaces = [...day.morning, ...day.afternoon, ...day.evening];
      if (dayPlaces.length > 1) {
        const path = dayPlaces.map((place) => ({
          lat: place.location.lat,
          lng: place.location.lng,
        }));
        paths.push(path);
      }
    });

    return paths;
  };

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">Error al cargar el mapa</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-gray-900" />
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: true,
          gestureHandling: 'none',
          zoomControl: false,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        }}
      >
        {allPlaces.map((place, index) => (
          <Marker
            key={`${place.place_id}-${index}`}
            position={{ lat: place.location.lat, lng: place.location.lng }}
            icon={getMarkerIcon(place.dayNumber)}
          />
        ))}

        {getRoutePaths().map((path, index) => (
          <Polyline
            key={`route-${index}`}
            path={path}
            options={{
              strokeColor: DAY_COLORS[index % DAY_COLORS.length],
              strokeOpacity: 0.6,
              strokeWeight: 3,
              geodesic: true,
            }}
          />
        ))}
      </GoogleMap>

      {/* Ver mapa completo button */}
      <button
        onClick={onOpenFullMap}
        className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-lg border border-gray-200"
      >
        <Maximize2 className="w-4 h-4" />
        Ver mapa completo
      </button>
    </div>
  );
}
