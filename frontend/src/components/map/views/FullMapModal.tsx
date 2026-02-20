'use client';

import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import type { Itinerary, PlaceInfo } from '@/store/chatStore';
import { X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getPlaceThumbnail } from '@/lib/utils/google-places';
import { PlaceDetailModal } from '../overlays/PlaceDetailModal';
import {
    DEFAULT_MAP_CENTER,
    MAP_CONTAINER_STYLE,
    getCircleMarkerIcon,
    getPulsingMarkerIcon,
    getDayMarkerLabel,
    getDayColor,
    DAY_COLORS,
    GRAYSCALE_MAP_STYLES,
} from '../shared/mapConstants';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PulsingMarker } from '../shared/PulsingMarker';

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
                style={{ width: '100%', height: 128, objectFit: 'cover', borderRadius: '8px 8px 8px 8px' }}
            />
            <h4 style={{ fontWeight: 600, fontSize: 13, padding: '8px 0 0 0', marginBottom: 8, color: '#111' }}>{place.name}</h4>
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
    const [pulsingMarker, setPulsingMarker] = useState<string | null>(null);
    
    // POI visibility controls
    const [showAllPOI, setShowAllPOI] = useState(false);
    const [showAttractions, setShowAttractions] = useState(false);
    const [showBusiness, setShowBusiness] = useState(false);
    const [showGovernment, setShowGovernment] = useState(false);
    const [showMedical, setShowMedical] = useState(false);
    const [showParks, setShowParks] = useState(false);
    const [showWorship, setShowWorship] = useState(false);
    const [showSchools, setShowSchools] = useState(false);
    const [showSports, setShowSports] = useState(false);

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
            setPulsingMarker(selectedPlace.place_id);
        }
    }, [map, selectedPlace]);

    const onLoad = useCallback((mapInstance: google.maps.Map) => setMap(mapInstance), []);
    const onUnmount = useCallback(() => setMap(null), []);

    // Update map POI visibility based on checkbox states
    useEffect(() => {
        if (!map) return;

        const styles: google.maps.MapTypeStyle[] = [...GRAYSCALE_MAP_STYLES];

        // If showAllPOI is true, show all POIs. Otherwise, hide all by default and show selectively
        if (!showAllPOI) {
            styles.push({
                featureType: 'poi',
                stylers: [{ visibility: 'off' }],
            });

            // Selectively show based on individual checkboxes
            if (showAttractions) {
                styles.push({
                    featureType: 'poi.attraction',
                    stylers: [{ visibility: 'on' }],
                });
            }

            if (showBusiness) {
                styles.push({
                    featureType: 'poi.business',
                    stylers: [{ visibility: 'on' }],
                });
            }

            if (showGovernment) {
                styles.push({
                    featureType: 'poi.government',
                    stylers: [{ visibility: 'on' }],
                });
            }

            if (showMedical) {
                styles.push({
                    featureType: 'poi.medical',
                    stylers: [{ visibility: 'on' }],
                });
            }

            if (showParks) {
                styles.push({
                    featureType: 'poi.park',
                    stylers: [{ visibility: 'on' }],
                });
            }

            if (showWorship) {
                styles.push({
                    featureType: 'poi.place_of_worship',
                    stylers: [{ visibility: 'on' }],
                });
            }

            if (showSchools) {
                styles.push({
                    featureType: 'poi.school',
                    stylers: [{ visibility: 'on' }],
                });
            }

            if (showSports) {
                styles.push({
                    featureType: 'poi.sports_complex',
                    stylers: [{ visibility: 'on' }],
                });
            }
        }

        map.setOptions({ styles });
    }, [map, showAllPOI, showAttractions, showBusiness, showGovernment, showMedical, showParks, showWorship, showSchools, showSports]);

    // Handle master checkbox toggle
    const handleAllPOIToggle = (checked: boolean) => {
        setShowAllPOI(checked);
        if (checked) {
            // When enabling all, also enable individual checkboxes
            setShowAttractions(true);
            setShowBusiness(true);
            setShowGovernment(true);
            setShowMedical(true);
            setShowParks(true);
            setShowWorship(true);
            setShowSchools(true);
            setShowSports(true);
        } else {
            // When disabling all, also disable individual checkboxes
            setShowAttractions(false);
            setShowBusiness(false);
            setShowGovernment(false);
            setShowMedical(false);
            setShowParks(false);
            setShowWorship(false);
            setShowSchools(false);
            setShowSports(false);
        }
    };

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
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <Card className="absolute inset-4 shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <CardContent className="flex items-center justify-between px-6 py-4 border-b">
                    <div>
                        <h2 className="text-lg font-semibold">{itinerary.title}</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {allPlaces.length} lugares en {itinerary.day_plans.length} días
                        </p>
                    </div>
                    <Button 
                        onClick={onClose} 
                        variant="ghost" 
                        size="icon"
                        className="rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </CardContent>

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
                                styles: GRAYSCALE_MAP_STYLES,
                            }}
                        >
                            {allPlaces.map((place, index) => {
                                const isPulsing = pulsingMarker === place.place_id;
                                
                                return (
                                    <PulsingMarker
                                        key={`${place.place_id}-${index}`}
                                        position={{ lat: place.location.lat, lng: place.location.lng }}
                                        dayNumber={place.dayNumber}
                                        label={place.dayNumber.toString()}
                                        isPulsing={isPulsing}
                                        onClick={() => {
                                            setActiveMarker(place);
                                            onPlaceSelect(place);
                                            setPulsingMarker(place.place_id);
                                        }}
                                    />
                                );
                            })}

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

                    {/* POI Visibility Controls - Top Left */}
                    <Card className="absolute top-4 left-4 shadow-lg max-h-[calc(100vh-8rem)] overflow-y-auto">
                        <CardContent className="p-3 space-y-2.5">
                            <p className="text-xs font-semibold mb-2">Mostrar en el mapa:</p>

                            {/* Individual POI checkboxes */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="attractions"
                                    checked={showAttractions}
                                    onCheckedChange={(checked) => setShowAttractions(checked as boolean)}
                                    disabled={showAllPOI}
                                />
                                <Label
                                    htmlFor="attractions"
                                    className="text-xs font-normal cursor-pointer"
                                >
                                    Atracciones turísticas
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="business"
                                    checked={showBusiness}
                                    onCheckedChange={(checked) => setShowBusiness(checked as boolean)}
                                    disabled={showAllPOI}
                                />
                                <Label
                                    htmlFor="business"
                                    className="text-xs font-normal cursor-pointer"
                                >
                                    Negocios y comercios
                                </Label>
                            </div>

                            {/* <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="government"
                                    checked={showGovernment}
                                    onCheckedChange={(checked) => setShowGovernment(checked as boolean)}
                                    disabled={showAllPOI}
                                />
                                <Label
                                    htmlFor="government"
                                    className="text-xs font-normal cursor-pointer"
                                >
                                    Instituciones gubernamentales
                                </Label>
                            </div> */}

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="medical"
                                    checked={showMedical}
                                    onCheckedChange={(checked) => setShowMedical(checked as boolean)}
                                    disabled={showAllPOI}
                                />
                                <Label
                                    htmlFor="medical"
                                    className="text-xs font-normal cursor-pointer"
                                >
                                    Centros médicos
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="parks"
                                    checked={showParks}
                                    onCheckedChange={(checked) => setShowParks(checked as boolean)}
                                    disabled={showAllPOI}
                                />
                                <Label
                                    htmlFor="parks"
                                    className="text-xs font-normal cursor-pointer"
                                >
                                    Parques y plazas
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="worship"
                                    checked={showWorship}
                                    onCheckedChange={(checked) => setShowWorship(checked as boolean)}
                                    disabled={showAllPOI}
                                />
                                <Label
                                    htmlFor="worship"
                                    className="text-xs font-normal cursor-pointer"
                                >
                                    Lugares de culto
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="schools"
                                    checked={showSchools}
                                    onCheckedChange={(checked) => setShowSchools(checked as boolean)}
                                    disabled={showAllPOI}
                                />
                                <Label
                                    htmlFor="schools"
                                    className="text-xs font-normal cursor-pointer"
                                >
                                    Escuelas y universidades
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="sports"
                                    checked={showSports}
                                    onCheckedChange={(checked) => setShowSports(checked as boolean)}
                                    disabled={showAllPOI}
                                />
                                <Label
                                    htmlFor="sports"
                                    className="text-xs font-normal cursor-pointer"
                                >
                                    Complejos deportivos
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Day legend */}
                    <Card className="absolute bottom-4 left-4 shadow-lg">
                        <CardContent className="p-3">
                            <p className="text-xs font-medium mb-2">Días del viaje:</p>
                            <div className="flex flex-wrap gap-2">
                                {itinerary.day_plans.map((day) => (
                                    <Badge key={day.day_number} variant="outline" className="gap-1.5">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: getDayColor(day.day_number) }}
                                        />
                                        Día {day.day_number}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Card>

            <PlaceDetailModal place={modalPlace} open={modalOpen} onOpenChange={setModalOpen} />
        </div>
    );
}
