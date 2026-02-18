'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface PlaceInfo {
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  address?: string;
  rating?: number;
}

interface GoogleMapViewProps {
  places: PlaceInfo[];
  showRoute?: boolean;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

export function GoogleMapView({
  places,
  showRoute = false,
  center,
  zoom = 12,
  className = 'w-full h-[500px] rounded-lg',
}: GoogleMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey) {
          setError('Google Maps API key not configured');
          setLoading(false);
          return;
        }

        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['places'],
        });

        await loader.load();

        if (!mapRef.current) return;

        // Default center (Lima, Peru)
        const mapCenter = center || 
          (places[0]?.location) || 
          { lat: -12.0464, lng: -77.0428 };

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: mapCenter,
          zoom: zoom,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        setMap(mapInstance);
        setLoading(false);
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError('Error loading map');
        setLoading(false);
      }
    };

    initMap();
  }, []);

  // Update markers when places change
  useEffect(() => {
    if (!map || places.length === 0) return;

    // Clear existing markers
    markers.forEach((m) => m.setMap(null));

    // Create new markers
    const newMarkers = places.map((place, idx) => {
      const marker = new google.maps.Marker({
        position: place.location,
        map: map,
        title: place.name,
        label: {
          text: (idx + 1).toString(),
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
        },
        animation: google.maps.Animation.DROP,
      });

      // InfoWindow
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2 min-w-[200px]">
            <h3 class="font-bold text-base mb-1">${place.name}</h3>
            ${place.address ? `<p class="text-sm text-gray-600 mb-1">${place.address}</p>` : ''}
            ${place.rating ? `<p class="text-sm">⭐ ${place.rating}</p>` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Adjust bounds to show all markers
    if (places.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      places.forEach((place) => bounds.extend(place.location));
      map.fitBounds(bounds);

      // Add padding
      const padding = { top: 50, right: 50, bottom: 50, left: 50 };
      map.fitBounds(bounds, padding);
    }

    // Draw route if enabled
    if (showRoute && places.length > 1) {
      const path = places.map((p) => p.location);
      new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#D4735E', // Primary color (terracota)
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: map,
      });
    }
  }, [map, places, showRoute]);

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted rounded-lg border border-border`}>
        <div className="text-center p-6">
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Verifica que la API key de Google Maps esté configurada
          </p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className={className} />;
}
