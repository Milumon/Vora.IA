'use client';

import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import type { Itinerary, PlaceInfo } from '@/store/chatStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Loader2, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { getPlaceThumbnail } from '@/lib/utils/google-places';
import { PlaceDetailModal } from './PlaceDetailModal';

interface InteractiveMapViewProps {
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
  lng: -77.0428, // Lima, Perú
};

// Colores por día
const DAY_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
];

export function InteractiveMapView({
  itinerary,
  selectedPlace,
  onPlaceSelect,
}: InteractiveMapViewProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<PlaceInfo | null>(null);
  const [allPlaces, setAllPlaces] = useState<Array<PlaceInfo & { dayNumber: number }>>([]);
  const [modalPlace, setModalPlace] = useState<PlaceInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Extraer todos los lugares del itinerario
  useEffect(() => {
    const places: Array<PlaceInfo & { dayNumber: number }> = [];
    
    itinerary.day_plans.forEach((day) => {
      [...day.morning, ...day.afternoon, ...day.evening].forEach((place) => {
        places.push({ ...place, dayNumber: day.day_number });
      });
    });

    setAllPlaces(places);
  }, [itinerary]);

  // Ajustar el mapa para mostrar todos los lugares
  useEffect(() => {
    if (map && allPlaces.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      allPlaces.forEach((place) => {
        bounds.extend(new google.maps.LatLng(place.location.lat, place.location.lng));
      });
      map.fitBounds(bounds);
    }
  }, [map, allPlaces]);

  // Centrar en lugar seleccionado
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
    const color = DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 10,
    };
  };

  const getMarkerLabel = (dayNumber: number, index: number) => {
    return {
      text: `${dayNumber}`,
      color: '#ffffff',
      fontSize: '12px',
      fontWeight: 'bold',
    };
  };

  // Generar líneas de ruta
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
      <div className="h-full flex items-center justify-center bg-muted">
        <Card className="p-6 max-w-md">
          <h3 className="font-semibold text-destructive mb-2">Error al cargar el mapa</h3>
          <p className="text-sm text-muted-foreground">
            No se pudo cargar Google Maps. Por favor, verifica tu conexión e intenta de nuevo.
          </p>
        </Card>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Header del mapa */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <Card className="p-4 shadow-lg">
          <h3 className="font-semibold text-lg">{itinerary.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {allPlaces.length} lugares en {itinerary.day_plans.length} días
          </p>
        </Card>
      </div>

      {/* Leyenda de colores */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="p-3 shadow-lg">
          <p className="text-xs font-medium mb-2">Días del viaje:</p>
          <div className="flex flex-wrap gap-2">
            {itinerary.day_plans.map((day) => (
              <div key={day.day_number} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: DAY_COLORS[(day.day_number - 1) % DAY_COLORS.length],
                  }}
                />
                <span className="text-xs">Día {day.day_number}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Mapa */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      >
        {/* Marcadores */}
        {allPlaces.map((place, index) => (
          <Marker
            key={`${place.place_id}-${index}`}
            position={{ lat: place.location.lat, lng: place.location.lng }}
            icon={getMarkerIcon(place.dayNumber)}
            label={getMarkerLabel(place.dayNumber, index)}
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

        {/* Líneas de ruta */}
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

        {/* Info Window */}
        {activeMarker && (
          <InfoWindow
            position={{
              lat: activeMarker.location.lat,
              lng: activeMarker.location.lng,
            }}
            onCloseClick={() => setActiveMarker(null)}
          >
            <div className="max-w-[280px]">
              {/* Imagen referencial del lugar */}
              <div className="relative w-full h-36 -mt-2 -mx-2 mb-2" style={{ width: 'calc(100% + 16px)' }}>
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
                {activeMarker.photos && activeMarker.photos.length > 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '6px',
                      right: '6px',
                      background: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ImageIcon style={{ width: 12, height: 12 }} />
                    {activeMarker.photos.length} fotos
                  </div>
                )}
              </div>

              {/* Nombre */}
              <h4 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: '#1a1a1a' }}>
                {activeMarker.name}
              </h4>
              
              {/* Rating y precio */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                {activeMarker.rating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Star style={{ width: 12, height: 12, fill: '#facc15', color: '#facc15' }} />
                    <span>{activeMarker.rating}</span>
                  </div>
                )}
                {activeMarker.price_level && (
                  <span style={{ color: '#16a34a', fontWeight: 500 }}>
                    {'$'.repeat(activeMarker.price_level)}
                  </span>
                )}
              </div>

              {/* Dirección */}
              {activeMarker.address && (
                <p style={{ fontSize: '12px', color: '#888', marginBottom: '6px', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                  <MapPin style={{ width: 12, height: 12, marginTop: 2, flexShrink: 0 }} />
                  <span>{activeMarker.address}</span>
                </p>
              )}

              {/* Descripción breve */}
              {activeMarker.why_visit && (
                <p style={{ fontSize: '12px', color: '#555', marginBottom: '10px', lineHeight: 1.4 }}>
                  {activeMarker.why_visit.length > 100
                    ? activeMarker.why_visit.substring(0, 100) + '...'
                    : activeMarker.why_visit}
                </p>
              )}

              {/* Botón Ver Detalles */}
              <button
                onClick={() => {
                  setModalPlace(activeMarker);
                  setModalOpen(true);
                }}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  backgroundColor: '#c2703e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#a85d32')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#c2703e')}
              >
                Ver Detalles
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Modal de detalle del lugar */}
      <PlaceDetailModal
        place={modalPlace}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
