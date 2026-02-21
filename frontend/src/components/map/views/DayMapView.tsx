'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow, Polyline, Marker } from '@react-google-maps/api';
import type { DayPlan, PlaceInfo, AccommodationOption } from '@/store/chatStore';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    DEFAULT_MAP_CENTER,
    MAP_CONTAINER_STYLE,
    GRAYSCALE_MAP_STYLES,
    getDayColor,
    getAccommodationMarkerIcon,
} from '../shared/mapConstants';
import { PulsingMarker } from '../shared/PulsingMarker';
import { PlaceInfoWindowContent } from '../shared/PlaceInfoWindowContent';
import { PlaceDetailModal } from '../overlays/PlaceDetailModal';
import { AccommodationDetailModal } from '../overlays/AccommodationDetailModal';

/* ─── Props ─────────────────────────────────────────────────────────────────── */

interface DayMapViewProps {
    day: DayPlan;
    selectedPlace: PlaceInfo | null;
    onPlaceSelect: (place: PlaceInfo) => void;
}

/* ─── Component ─────────────────────────────────────────────────────────────── */

export function DayMapView({ day, selectedPlace, onPlaceSelect }: DayMapViewProps) {
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: ['places'],
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [activeMarker, setActiveMarker] = useState<PlaceInfo | null>(null);
    const [pulsingMarker, setPulsingMarker] = useState<string | null>(null);
    const [isPOIControlsCollapsed, setIsPOIControlsCollapsed] = useState(false);
    const [modalPlace, setModalPlace] = useState<PlaceInfo | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAccommodation, setSelectedAccommodation] = useState<AccommodationOption | null>(null);
    const [accommodationModalOpen, setAccommodationModalOpen] = useState(false);

    // POI visibility controls
    const [showAllPOI, setShowAllPOI] = useState(false);
    const [showAttractions, setShowAttractions] = useState(false);
    const [showBusiness, setShowBusiness] = useState(false);
    const [showMedical, setShowMedical] = useState(false);
    const [showParks, setShowParks] = useState(false);
    const [showWorship, setShowWorship] = useState(false);
    const [showSchools, setShowSchools] = useState(false);
    const [showSports, setShowSports] = useState(false);

    // Collect all places for this day
    const allDayPlaces = useMemo(
        () => [
            ...(day.morning ?? []),
            ...(day.afternoon ?? []),
            ...(day.evening ?? []),
        ],
        [day]
    );

    // Route path for this day
    const routePath = useMemo(
        () =>
            allDayPlaces.length > 1
                ? allDayPlaces.map((p) => ({ lat: p.location.lat, lng: p.location.lng }))
                : null,
        [allDayPlaces]
    );

    const dayColor = getDayColor(day.day_number);

    // Accommodation marker
    const accommodationMarker = useMemo(() => {
        const acc = day.accommodation?.[0];
        if (!acc?.coordinates?.latitude || !acc?.coordinates?.longitude) return null;
        return { lat: acc.coordinates.latitude, lng: acc.coordinates.longitude, accommodation: acc };
    }, [day]);

    // Fit bounds on mount
    useEffect(() => {
        if (!map || allDayPlaces.length === 0) return;
        const bounds = new google.maps.LatLngBounds();
        allDayPlaces.forEach((p) => bounds.extend({ lat: p.location.lat, lng: p.location.lng }));
        if (accommodationMarker) {
            bounds.extend({ lat: accommodationMarker.lat, lng: accommodationMarker.lng });
        }
        map.fitBounds(bounds, { top: 60, right: 20, bottom: 20, left: 20 });
    }, [map, allDayPlaces, accommodationMarker]);

    // Animate to selected place
    useEffect(() => {
        if (!map || !selectedPlace) return;
        map.panTo({ lat: selectedPlace.location.lat, lng: selectedPlace.location.lng });
        // Small delay to let pan settle then zoom
        const t = setTimeout(() => map.setZoom(16), 300);
        setActiveMarker(selectedPlace);
        setPulsingMarker(selectedPlace.place_id);
        return () => clearTimeout(t);
    }, [map, selectedPlace]);

    const onLoad = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);

        // Native POI click handler
        mapInstance.addListener('click', (event: any) => {
            if (event.placeId) {
                event.stop();
                const service = new google.maps.places.PlacesService(mapInstance);
                service.getDetails(
                    {
                        placeId: event.placeId,
                        fields: [
                            'place_id', 'name', 'formatted_address', 'rating',
                            'price_level', 'types', 'photos', 'geometry',
                        ],
                    },
                    (place, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                            const placeInfo: PlaceInfo = {
                                place_id: place.place_id || '',
                                name: place.name || 'Lugar',
                                address: place.formatted_address || '',
                                rating: place.rating,
                                price_level: place.price_level,
                                types: place.types || [],
                                photos: place.photos?.map((ph) => ph.getUrl({ maxWidth: 800 })) || [],
                                location: {
                                    lat: place.geometry?.location?.lat() || 0,
                                    lng: place.geometry?.location?.lng() || 0,
                                },
                            };
                            setModalPlace(placeInfo);
                            setModalOpen(true);
                        }
                    }
                );
            }
        });
    }, []);

    const onUnmount = useCallback(() => setMap(null), []);

    // POI styles effect
    useEffect(() => {
        if (!map) return;
        const styles: google.maps.MapTypeStyle[] = [...GRAYSCALE_MAP_STYLES];
        if (!showAllPOI) {
            styles.push({ featureType: 'poi', stylers: [{ visibility: 'off' }] });
            if (showAttractions) styles.push({ featureType: 'poi.attraction', stylers: [{ visibility: 'on' }] });
            if (showBusiness) styles.push({ featureType: 'poi.business', stylers: [{ visibility: 'on' }] });
            if (showMedical) styles.push({ featureType: 'poi.medical', stylers: [{ visibility: 'on' }] });
            if (showParks) styles.push({ featureType: 'poi.park', stylers: [{ visibility: 'on' }] });
            if (showWorship) styles.push({ featureType: 'poi.place_of_worship', stylers: [{ visibility: 'on' }] });
            if (showSchools) styles.push({ featureType: 'poi.school', stylers: [{ visibility: 'on' }] });
            if (showSports) styles.push({ featureType: 'poi.sports_complex', stylers: [{ visibility: 'on' }] });
        }
        map.setOptions({ styles });
    }, [map, showAllPOI, showAttractions, showBusiness, showMedical, showParks, showWorship, showSchools, showSports]);

    const handleAllPOIToggle = (checked: boolean) => {
        setShowAllPOI(checked);
        setShowAttractions(checked);
        setShowBusiness(checked);
        setShowMedical(checked);
        setShowParks(checked);
        setShowWorship(checked);
        setShowSchools(checked);
        setShowSports(checked);
    };

    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-muted/20 animate-pulse">
                <p className="text-sm text-muted-foreground">Cargando mapa…</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                center={DEFAULT_MAP_CENTER}
                zoom={12}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    styles: GRAYSCALE_MAP_STYLES,
                }}
            >
                {/* Day place markers */}
                {allDayPlaces.map((place, index) => (
                    <PulsingMarker
                        key={`${place.place_id}-${index}`}
                        position={{ lat: place.location.lat, lng: place.location.lng }}
                        dayNumber={day.day_number}
                        label={String(index + 1)}
                        isPulsing={pulsingMarker === place.place_id}
                        onClick={() => {
                            setActiveMarker(place);
                            onPlaceSelect(place);
                            setPulsingMarker(place.place_id);
                        }}
                    />
                ))}

                {/* Accommodation marker */}
                {accommodationMarker && (
                    <Marker
                        position={{ lat: accommodationMarker.lat, lng: accommodationMarker.lng }}
                        icon={getAccommodationMarkerIcon()}
                        title={accommodationMarker.accommodation.name}
                        onClick={() => {
                            setSelectedAccommodation(accommodationMarker.accommodation);
                            setAccommodationModalOpen(true);
                        }}
                    />
                )}

                {/* Route polyline */}
                {routePath && (
                    <Polyline
                        path={routePath}
                        options={{
                            strokeColor: dayColor,
                            strokeOpacity: 0.65,
                            strokeWeight: 3,
                            geodesic: true,
                        }}
                    />
                )}

                {/* Active InfoWindow tooltip */}
                {activeMarker && (
                    <InfoWindow
                        position={{
                            lat: activeMarker.location.lat,
                            lng: activeMarker.location.lng,
                        }}
                        onCloseClick={() => {
                            setActiveMarker(null);
                            setPulsingMarker(null);
                        }}
                        options={{ pixelOffset: new google.maps.Size(0, -20) }}
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

            {/* ── POI Visibility Controls — top-left overlay ── */}
            <Card className="absolute top-4 left-4 shadow-lg z-10 max-h-[calc(100vh-10rem)] overflow-y-auto">
                <CardContent className="p-3 space-y-2.5">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold">Mostrar en el mapa:</p>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => setIsPOIControlsCollapsed(!isPOIControlsCollapsed)}
                            aria-label={isPOIControlsCollapsed ? 'Expandir' : 'Colapsar'}
                        >
                            {isPOIControlsCollapsed ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronUp className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {!isPOIControlsCollapsed && (
                        <>
                            {[
                                { id: 'poi-all', label: 'Todos', checked: showAllPOI, onChange: handleAllPOIToggle, master: true },
                                { id: 'poi-attractions', label: 'Atracciones', checked: showAttractions, onChange: setShowAttractions },
                                { id: 'poi-business', label: 'Negocios', checked: showBusiness, onChange: setShowBusiness },
                                { id: 'poi-medical', label: 'Centros médicos', checked: showMedical, onChange: setShowMedical },
                                { id: 'poi-parks', label: 'Parques', checked: showParks, onChange: setShowParks },
                                { id: 'poi-worship', label: 'Culto', checked: showWorship, onChange: setShowWorship },
                                { id: 'poi-schools', label: 'Escuelas', checked: showSchools, onChange: setShowSchools },
                                { id: 'poi-sports', label: 'Deportes', checked: showSports, onChange: setShowSports },
                            ].map(({ id, label, checked, onChange, master }) => (
                                <div key={id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={id}
                                        checked={checked}
                                        onCheckedChange={(c) => onChange(c as boolean)}
                                        disabled={!master && showAllPOI}
                                    />
                                    <Label
                                        htmlFor={id}
                                        className={`text-xs cursor-pointer ${master ? 'font-semibold' : 'font-normal'}`}
                                    >
                                        {label}
                                    </Label>
                                </div>
                            ))}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* ── Day color legend — bottom-left ── */}
            <Card className="absolute bottom-4 left-4 shadow-lg z-10">
                <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: dayColor }}
                        />
                        <span className="text-xs font-medium">Día {day.day_number} — ruta</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {allDayPlaces.map((p, i) => (
                            <Badge
                                key={p.place_id}
                                variant="outline"
                                className={`text-[10px] cursor-pointer hover:bg-muted transition-colors ${selectedPlace?.place_id === p.place_id
                                        ? 'border-primary text-primary bg-primary/5'
                                        : ''
                                    }`}
                                onClick={() => onPlaceSelect(p)}
                            >
                                {i + 1}. {p.name.split(' ').slice(0, 2).join(' ')}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Modals */}
            <PlaceDetailModal place={modalPlace} open={modalOpen} onOpenChange={setModalOpen} />
            <AccommodationDetailModal
                accommodation={selectedAccommodation}
                open={accommodationModalOpen}
                onOpenChange={setAccommodationModalOpen}
            />
        </div>
    );
}
