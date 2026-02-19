'use client';

import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import type { Itinerary, PlaceInfo } from '@/store/chatStore';
import { X, Star } from 'lucide-react';
import { getPlaceThumbnail } from '@/lib/utils/google-places';
import { PlaceDetailModal } from '../overlays/PlaceDetailModal';
import {
    DEFAULT_MAP_CENTER,
    MAP_CONTAINER_STYLE,
    getCircleMarkerIcon,
    getDayMarkerLabel,
    getDayColor,
    DAY_COLORS,
} from '../shared/mapConstants';

interface FullMapModalProps {
    itinerary: Itinerary;
    isOpen: boolean;
    onClose: () => void;
    selectedPlace?: PlaceInfo | null;
    onPlaceSelect: (place: PlaceInfo) => void;
}

/** InfoWindow content rendered inside a Google Maps InfoWindow. */
function PlaceInfoWindowContent({
    place,
    onViewDetails,
}: {
    place: PlaceInfo;
    onViewDetails: () => void;
}) {
    return (
        <div className="max-w-[240px]">
            <img
                src={getPlaceThumbnail(place.photos)}
                alt={place.name}
                style={{ width: '100%', height: 128, objectFit: 'cover', borderRadius: '8px 8px 0 0' }}
            />
            <h4 style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#111' }}>{place.name}</h4>
            {place.rating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#666', marginBottom: 6 }}>
                    <span>⭐</span>
                    <span>{place.rating}</span>
                </div>
            )}
            {place.why_visit && (
                <p style={{ fontSize: 11, color: '#666', lineHeight: 1.4, marginBottom: 10 }}>
                    {place.why_visit.length > 80 ? place.why_visit.substring(0, 80) + '...' : place.why_visit}
                </p>
            )}
            <button
                onClick={onViewDetails}
                style={{
                    width: '100%',
                    padding: '8px 16px',
                    backgroundColor: '#111',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                }}
            >
                Ver Detalles
            </button>
        </div>
    );
}

export function FullMapModal({
    itinerary,
    isOpen,
    onClose,
    selectedPlace,
    onPlaceSelect,
}: FullMapModalProps) {
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: ['places'],
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [activeMarker, setActiveMarker] = useState<PlaceInfo | null>(null);
    const [allPlaces, setAllPlaces] = useState<Array<PlaceInfo & { dayNumber: number }>>([]);
    const [modalPlace, setModalPlace] = useState<PlaceInfo | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

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
            allPlaces.forEach((place) =>
                bounds.extend(new google.maps.LatLng(place.location.lat, place.location.lng))
            );
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

    const onLoad = useCallback((mapInstance: google.maps.Map) => setMap(mapInstance), []);
    const onUnmount = useCallback(() => setMap(null), []);

    const getRoutePaths = useCallback((): google.maps.LatLngLiteral[][] => {
        return itinerary.day_plans
            .map((day) => {
                const dayPlaces = [...day.morning, ...day.afternoon, ...day.evening];
                return dayPlaces.length > 1
                    ? dayPlaces.map((p) => ({ lat: p.location.lat, lng: p.location.lng }))
                    : null;
            })
            .filter(Boolean) as google.maps.LatLngLiteral[][];
    }, [itinerary]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
            <div className="absolute inset-4 bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">{itinerary.title}</h2>
                        <p className="text-sm text-gray-600 mt-0.5">
                            {allPlaces.length} lugares en {itinerary.day_plans.length} días
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Map */}
                <div className="flex-1 relative">
                    {isLoaded && (
                        <GoogleMap
                            mapContainerStyle={MAP_CONTAINER_STYLE}
                            center={DEFAULT_MAP_CENTER}
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
                            {allPlaces.map((place, index) => (
                                <Marker
                                    key={`${place.place_id}-${index}`}
                                    position={{ lat: place.location.lat, lng: place.location.lng }}
                                    icon={getCircleMarkerIcon(place.dayNumber, 10)}
                                    label={getDayMarkerLabel(place.dayNumber)}
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
                                        strokeColor: getDayColor(index + 1),
                                        strokeOpacity: 0.6,
                                        strokeWeight: 3,
                                        geodesic: true,
                                    }}
                                />
                            ))}

                            {activeMarker && (
                                <InfoWindow
                                    position={{ lat: activeMarker.location.lat, lng: activeMarker.location.lng }}
                                    onCloseClick={() => setActiveMarker(null)}
                                >
                                    <PlaceInfoWindowContent
                                        place={activeMarker}
                                        onViewDetails={() => {
                                            setModalPlace(activeMarker);
                                            setModalOpen(true);
                                        }}
                                    />
                                </InfoWindow>
                            )}
                        </GoogleMap>
                    )}

                    {/* Day legend */}
                    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
                        <p className="text-xs font-medium mb-2 text-gray-900">Días del viaje:</p>
                        <div className="flex flex-wrap gap-2">
                            {itinerary.day_plans.map((day) => (
                                <div key={day.day_number} className="flex items-center gap-1.5">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: getDayColor(day.day_number) }}
                                    />
                                    <span className="text-xs text-gray-700">Día {day.day_number}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <PlaceDetailModal place={modalPlace} open={modalOpen} onOpenChange={setModalOpen} />
        </div>
    );
}
