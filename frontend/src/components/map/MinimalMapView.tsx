'use client';

import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import type { Itinerary, PlaceInfo } from '@/store/chatStore';
import { Star, MapPin, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { getPlaceThumbnail } from '@/lib/utils/google-places';

interface MinimalMapViewProps {
  itinerary: Itinerary;
  selectedPlace?: PlaceInfo | null;
  onPlaceSelect: (place: PlaceInfo) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: -12.0464,
  lng: -77.0428,
};

export function MinimalMapView({
  itinerary,
  selectedPlace,
  onPlaceSelect,
}: MinimalMapViewProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<PlaceInfo | null>(null);
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

  useEffect(() => {
    if (map && selectedPlace) {
      map.panTo(new google.maps.LatLng(selectedPlace.location.lat, selectedPlace.location.lng));
      map.setZoom(15);
      setActiveMarker(selectedPlace);
    }
  }, [map, selectedPlace]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const getMarkerIcon = (dayNumber: number) => {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#000000',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 8,
    };
  };

  const getMarkerLabel = (dayNumber: number) => {
    return {
      text: `${dayNumber}`,
      color: '#ffffff',
      fontSize: '11px',
      fontWeight: 'bold',
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
        <div className="text-center p-6">
          <p className="text-sm text-gray-600">Error al cargar el mapa</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-gray-900" />
          <p className="text-sm text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Map title overlay */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-semibold text-sm text-gray-900">{itinerary.title}</h3>
          <p className="text-xs text-gray-600 mt-0.5">
            {allPlaces.length} lugares • {itinerary.day_plans.length} días
          </p>
        </div>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
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
            label={getMarkerLabel(place.dayNumber)}
            onClick={() => {
              setActiveMarker(place);
              onPlaceSelect(place);
            }}
            animation={
              selectedPlace?.place_id === place.place_id
                ? google.maps.Animation.BOUNCE
                : undefined
            }
          />
        ))}

        {getRoutePaths().map((path, index) => (
          <Polyline
            key={`route-${index}`}
            path={path}
            options={{
              strokeColor: '#000000',
              strokeOpacity: 0.4,
              strokeWeight: 2,
              geodesic: true,
            }}
          />
        ))}

        {activeMarker && (
          <InfoWindow
            position={{
              lat: activeMarker.location.lat,
              lng: activeMarker.location.lng,
            }}
            onCloseClick={() => setActiveMarker(null)}
          >
            <div className="max-w-[240px]">
              <div className="relative w-full h-32 -mt-2 -mx-2 mb-2">
                <img
                  src={getPlaceThumbnail(activeMarker.photos)}
                  alt={activeMarker.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px 8px 0 0',
                  }}
                />
              </div>

              <h4 style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', color: '#111' }}>
                {activeMarker.name}
              </h4>
              
              {activeMarker.rating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                  <Star style={{ width: 12, height: 12, fill: '#000', color: '#000' }} />
                  <span>{activeMarker.rating}</span>
                </div>
              )}

              {activeMarker.why_visit && (
                <p style={{ fontSize: '11px', color: '#666', lineHeight: 1.4 }}>
                  {activeMarker.why_visit.length > 80
                    ? activeMarker.why_visit.substring(0, 80) + '...'
                    : activeMarker.why_visit}
                </p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
