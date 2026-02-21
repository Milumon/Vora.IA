'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import type { Itinerary, PlaceInfo } from '@/store/chatStore';
import { Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DAY_COLORS,
    DEFAULT_MAP_CENTER,
    MAP_CONTAINER_STYLE,
    getCircleMarkerIcon,
    getDayColor,
    GRAYSCALE_MAP_STYLES,
    getAccommodationMarkerIcon,
} from '../shared/mapConstants';
import { MapLoadingState } from '../shared/MapLoadingState';

interface CompactMapPreviewProps {
    itinerary: Itinerary;
    onOpenFullMap: () => void;
}

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
            [...(day.morning || []), ...(day.afternoon || []), ...(day.evening || [])].forEach((place) => {
                places.push({ ...place, dayNumber: day.day_number });
            });
        });
        setAllPlaces(places);
    }, [itinerary]);

    // Collect accommodation coordinates (first option per day)
    const accommodationMarkers = useMemo(() => {
        const markers: Array<{ lat: number; lng: number; name: string }> = [];
        itinerary.day_plans.forEach((day) => {
            const acc = day.accommodation?.[0];
            if (acc?.coordinates?.latitude && acc?.coordinates?.longitude) {
                markers.push({
                    lat: acc.coordinates.latitude,
                    lng: acc.coordinates.longitude,
                    name: acc.name,
                });
            }
        });
        return markers;
    }, [itinerary]);

    useEffect(() => {
        if (map && (allPlaces.length > 0 || accommodationMarkers.length > 0)) {
            const bounds = new google.maps.LatLngBounds();
            allPlaces.forEach((place) => {
                bounds.extend(new google.maps.LatLng(place.location.lat, place.location.lng));
            });
            accommodationMarkers.forEach((m) => {
                bounds.extend(new google.maps.LatLng(m.lat, m.lng));
            });
            map.fitBounds(bounds);
        }
    }, [map, allPlaces, accommodationMarkers]);

    const onLoad = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const getRoutePaths = useCallback((): google.maps.LatLngLiteral[][] => {
        return itinerary.day_plans
            .map((day) => {
                const dayPlaces = [...(day.morning || []), ...(day.afternoon || []), ...(day.evening || [])];
                if (dayPlaces.length > 1) {
                    return dayPlaces.map((place) => ({ lat: place.location.lat, lng: place.location.lng }));
                }
                return null;
            })
            .filter(Boolean) as google.maps.LatLngLiteral[][];
    }, [itinerary]);

    if (loadError) return <MapLoadingState error />;
    if (!isLoaded) return <MapLoadingState />;

    return (
        <div className="relative h-full rounded-lg border border-border overflow-hidden shadow-subtle">
            <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                center={DEFAULT_MAP_CENTER}
                zoom={10}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    disableDefaultUI: true,
                    gestureHandling: 'none',
                    zoomControl: false,
                    styles: GRAYSCALE_MAP_STYLES,
                }}
            >
                {allPlaces.map((place, index) => (
                    <Marker
                        key={`${place.place_id}-${index}`}
                        position={{ lat: place.location.lat, lng: place.location.lng }}
                        icon={getCircleMarkerIcon(place.dayNumber, 8)}
                    />
                ))}

                {/* Accommodation markers */}
                {accommodationMarkers.map((m, index) => (
                    <Marker
                        key={`accommodation-${index}`}
                        position={{ lat: m.lat, lng: m.lng }}
                        icon={getAccommodationMarkerIcon()}
                        title={m.name}
                    />
                ))}

                {getRoutePaths().map((path, index) => (
                    <Polyline
                        key={`route-${index}`}
                        path={path}
                        options={{
                            strokeColor: getDayColor(index + 1),
                            strokeOpacity: 0.6,
                            strokeWeight: 3,
                            geodesic: true,
                        }}
                    />
                ))}
            </GoogleMap>

            <Button
                onClick={onOpenFullMap}
                variant="secondary"
                size="sm"
                className="absolute bottom-4 right-4 gap-2 shadow-lg backdrop-blur-sm bg-background/90 hover:bg-background"
            >
                <Maximize2 className="w-4 h-4" />
                Ver mapa completo
            </Button>
        </div>
    );
}
