'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Star,
    MapPin,
    Clock,
    Utensils,
    ChevronRight,
    ImageIcon,
    Navigation,
    DollarSign,
} from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { RestaurantRecommendation } from '@/store/chatStore';

/* ─── Constants ─────────────────────────────────────────────────────────────── */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/* ─── Image utilities ───────────────────────────────────────────────────────── */

function normalizeUrl(raw: string): string {
    try {
        const u = new URL(raw);
        u.search = [...u.searchParams].sort().map(([k, v]) => `${k}=${v}`).join('&');
        return u.origin + u.pathname.replace(/\/+$/, '') + (u.search ? '?' + u.search : '');
    } catch {
        return raw.trim().replace(/\/+$/, '');
    }
}

function urlPath(raw: string): string {
    try {
        const u = new URL(raw);
        return u.origin + u.pathname.replace(/\/+$/, '');
    } catch {
        return raw.split('?')[0].replace(/\/+$/, '');
    }
}

function deduplicateImages(urls: string[]): string[] {
    const seen = new Set<string>();
    const seenPaths = new Set<string>();
    const result: string[] = [];
    for (const raw of urls) {
        if (!raw || typeof raw !== 'string') continue;
        const trimmed = raw.trim();
        if (!trimmed) continue;
        const norm = normalizeUrl(trimmed);
        const path = urlPath(trimmed);
        if (seen.has(norm) || seenPaths.has(path)) continue;
        seen.add(norm);
        seenPaths.add(path);
        result.push(trimmed);
    }
    return result;
}

async function fetchSerperImages(placeName: string): Promise<string[]> {
    try {
        const query = `${placeName} restaurante comida Perú`;
        const url = `${API_BASE}/api/v1/places/images?query=${encodeURIComponent(query)}&num=6`;
        const res = await fetch(url, { cache: 'force-cache' });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data.images) ? data.images : [];
    } catch {
        return [];
    }
}

/* ─── Image strip (horizontal scroll) ──────────────────────────────────────── */

function ImageStrip({ images, placeName }: { images: string[]; placeName: string }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScroll, setCanScroll] = useState(false);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScroll(el.scrollWidth > el.clientWidth + 4);
    }, []);

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [checkScroll, images.length]);

    const scrollRight = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const slotWidth = el.clientWidth / Math.min(images.length, 3);
        el.scrollBy({ left: slotWidth, behavior: 'smooth' });
    }, [images.length]);

    return (
        <div className="relative group/strip">
            <div
                ref={scrollRef}
                className="flex gap-1 overflow-x-auto scrollbar-hide scroll-smooth"
                onScroll={checkScroll}
            >
                {images.map((url, idx) => (
                    <div
                        key={`${url}-${idx}`}
                        className="relative flex-shrink-0 rounded-lg overflow-hidden bg-muted"
                        style={{
                            width: `calc(${100 / Math.min(images.length, 3)}% - ${((Math.min(images.length, 3) - 1) * 4) / Math.min(images.length, 3)}px)`,
                            aspectRatio: '16 / 9',
                        }}
                    >
                        <Image
                            src={url}
                            alt={`${placeName} — foto ${idx + 1}`}
                            fill
                            className="object-cover"
                            sizes="33vw"
                            unoptimized
                        />
                    </div>
                ))}
            </div>

            {canScroll && (
                <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-card/80 to-transparent pointer-events-none rounded-r-lg" />
            )}
            {canScroll && (
                <Button
                    onClick={(e) => { e.stopPropagation(); scrollRight(); }}
                    variant="secondary"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full shadow-lg opacity-0 group-hover/strip:opacity-100 transition-opacity bg-black/40 hover:bg-black/60 border-0 text-white [&_svg]:text-white"
                    aria-label="Ver más imágenes"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            )}

            {images.length > 1 && (
                <Badge
                    variant="secondary"
                    className="absolute bottom-1.5 right-1.5 bg-black/50 text-white border-0 backdrop-blur-sm shadow-sm text-[10px]"
                >
                    <ImageIcon className="h-2.5 w-2.5 mr-1" />
                    {images.length}
                </Badge>
            )}
        </div>
    );
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function ratingColor(r: number) {
    if (r >= 4.5) return 'bg-emerald-500';
    if (r >= 4.0) return 'bg-emerald-400';
    if (r >= 3.5) return 'bg-yellow-400';
    return 'bg-orange-400';
}

function ratingLabel(r: number) {
    if (r >= 4.5) return 'Excelente';
    if (r >= 4.0) return 'Muy bueno';
    if (r >= 3.5) return 'Bueno';
    return '';
}

function formatDistance(meters?: number): string {
    if (!meters && meters !== 0) return '';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
}

function todayOpeningHour(hours?: string[]): string | null {
    if (!hours || hours.length === 0) return null;
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const today = dayNames[new Date().getDay()];
    const todayEntry = hours.find(h => h.toLowerCase().startsWith(today));
    if (todayEntry) {
        const parts = todayEntry.split(':');
        if (parts.length >= 2) return parts.slice(1).join(':').trim();
    }
    return hours[0]; // Fallback: show first entry
}

function googleMapsUrl(lat: number, lng: number, name: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(name)}`;
}

/* ─── Single restaurant option card ─────────────────────────────────────────── */

function RestaurantOption({ restaurant }: { restaurant: RestaurantRecommendation }) {
    const [serperImages, setSerperImages] = useState<string[]>([]);
    const [loadingImages, setLoadingImages] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoadingImages(true);
        fetchSerperImages(restaurant.name)
            .then((imgs) => {
                if (!cancelled) {
                    setSerperImages(deduplicateImages(imgs));
                    setLoadingImages(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setSerperImages([]);
                    setLoadingImages(false);
                }
            });
        return () => { cancelled = true; };
    }, [restaurant.name]);

    const allImages = (() => {
        const googlePhotos = restaurant.photos ?? [];
        const candidates = [...serperImages, ...googlePhotos];
        return deduplicateImages(candidates).slice(0, 6);
    })();

    const openingInfo = todayOpeningHour(restaurant.opening_hours);
    const mapsLink = googleMapsUrl(
        restaurant.location.lat,
        restaurant.location.lng,
        restaurant.name,
    );

    return (
        <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-sm transition-shadow">
            {/* Images */}
            <div className="p-2 pb-0">
                {loadingImages ? (
                    <div className="w-full h-32 bg-muted animate-pulse rounded-lg" />
                ) : allImages.length === 0 ? (
                    <div className="w-full h-32 flex items-center justify-center bg-muted rounded-lg">
                        <Utensils className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                ) : allImages.length === 1 ? (
                    <div className="relative w-full h-36 rounded-lg overflow-hidden bg-muted">
                        <Image
                            src={allImages[0]}
                            alt={restaurant.name}
                            fill
                            className="object-cover"
                            sizes="50vw"
                            unoptimized
                        />
                    </div>
                ) : (
                    <ImageStrip images={allImages} placeName={restaurant.name} />
                )}
            </div>

            {/* Info */}
            <div className="p-3 space-y-2.5">
                {/* Name + rating */}
                <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-1">
                        {restaurant.name}
                    </h4>
                    {restaurant.rating != null && restaurant.rating > 0 && (
                        <div className="flex items-center gap-1 shrink-0">
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-white text-[11px] font-bold ${ratingColor(restaurant.rating)}`}>
                                <Star className="w-3 h-3 fill-white" />
                                {restaurant.rating.toFixed(1)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Rating label + review count */}
                <div className="flex items-center gap-2 flex-wrap">
                    {restaurant.rating != null && ratingLabel(restaurant.rating) && (
                        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                            {ratingLabel(restaurant.rating)}
                        </span>
                    )}
                    {restaurant.user_ratings_total != null && restaurant.user_ratings_total > 0 && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            ({restaurant.user_ratings_total.toLocaleString()} reseñas)
                        </span>
                    )}
                </div>

                {/* Metadata badges */}
                <div className="flex flex-wrap gap-1.5">
                    {restaurant.price_range && (
                        <Badge
                            variant="secondary"
                            className="gap-1 text-[10px] bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0"
                        >
                            <DollarSign className="w-3 h-3" />
                            {restaurant.price_range}
                        </Badge>
                    )}
                    {restaurant.distance_meters != null && (
                        <Badge
                            variant="secondary"
                            className="gap-1 text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0"
                        >
                            <Navigation className="w-3 h-3" />
                            {formatDistance(restaurant.distance_meters)}
                        </Badge>
                    )}
                    {openingInfo && (
                        <Badge
                            variant="secondary"
                            className="gap-1 text-[10px] bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-0"
                        >
                            <Clock className="w-3 h-3" />
                            {openingInfo}
                        </Badge>
                    )}
                </div>

                {/* Address */}
                {restaurant.address && (
                    <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{restaurant.address}</span>
                    </div>
                )}

                {/* Reference place */}
                {restaurant.reference_place && (
                    <p className="text-[10px] text-muted-foreground italic">
                        Cerca de {restaurant.reference_place}
                    </p>
                )}

                {/* Google Maps link */}
                <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-xl
                       bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                       dark:bg-orange-600 dark:hover:bg-orange-700 dark:active:bg-orange-800
                       text-white text-xs font-semibold transition-colors"
                >
                    <MapPin className="w-3.5 h-3.5" />
                    Ver en Google Maps
                </a>
            </div>
        </div>
    );
}

/* ─── Props ─────────────────────────────────────────────────────────────────── */

interface RestaurantCardProps {
    restaurants: RestaurantRecommendation[];
    mealType: 'lunch' | 'dinner';
}

/* ─── Main Component ────────────────────────────────────────────────────────── */

/**
 * Card displaying restaurant recommendations for a meal (lunch or dinner).
 * Shows up to 2 restaurants with photos, rating, price range, distance
 * and opening hours. Styled to match AccommodationCard pattern.
 */
export function RestaurantCard({ restaurants, mealType }: RestaurantCardProps) {
    if (!restaurants || restaurants.length === 0) return null;

    const mealLabel = mealType === 'lunch' ? 'Almuerzo' : 'Cena';
    const mealIcon = mealType === 'lunch' ? '🍽️' : '🌙';
    const gradientFrom = mealType === 'lunch'
        ? 'from-orange-600 to-amber-500 dark:from-orange-700 dark:to-amber-600'
        : 'from-indigo-600 to-purple-500 dark:from-indigo-700 dark:to-purple-600';

    return (
        <div className="w-auto bg-white dark:bg-black rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className={`bg-gradient-to-r ${gradientFrom} px-5 py-3`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Utensils className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-white uppercase tracking-wide">
                                {mealIcon} {mealLabel}
                            </p>
                            <p className="text-[11px] text-white/70 leading-none">
                                {restaurants.length} restaurante{restaurants.length !== 1 ? 's' : ''} recomendado{restaurants.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    {restaurants[0]?.price_range && (
                        <div className="text-right">
                            <p className="text-[10px] text-white/70 leading-none mb-0.5">Rango de precios</p>
                            <p className="text-sm font-bold text-white leading-none">
                                {restaurants[0].price_range}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Restaurant options */}
            <div className="px-4 py-4 space-y-3">
                {restaurants.map((restaurant, i) => (
                    <RestaurantOption key={restaurant.place_id || i} restaurant={restaurant} />
                ))}
            </div>
        </div>
    );
}
