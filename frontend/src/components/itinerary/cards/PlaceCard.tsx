'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    MapPin,
    Star,
    DollarSign,
    Clock,
    ImageIcon,
    ChevronRight,
} from 'lucide-react';
import Image from 'next/image';
import { getPlaceThumbnail } from '@/lib/utils/google-places';
import { PlaceDetailModal } from '@/components/map/overlays/PlaceDetailModal';
import { Button } from '@/components/ui/button';
import type { PlaceInfo } from '@/store/chatStore';

interface PlaceCardProps {
    place: {
        place_id?: string;
        name: string;
        address?: string;
        rating?: number;
        price_level?: number;
        types?: string[];
        photos?: string[];
        description?: string;
        duration?: string;
        visit_duration?: string;
        why_visit?: string;
        location?: { lat: number; lng: number };
        /** Destination city — used to scope the Serper image query */
        destination?: string;
    };
}

const PRICE_LEVEL_SYMBOLS = ['$', '$$', '$$$', '$$$$'];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Normalise a URL so that trivially-different strings match.
 * Strips trailing slash, lowercases the host, and sorts query params.
 */
function normalizeUrl(raw: string): string {
    try {
        const u = new URL(raw);
        u.search = [...u.searchParams].sort().map(([k, v]) => `${k}=${v}`).join('&');
        return u.origin + u.pathname.replace(/\/+$/, '') + (u.search ? '?' + u.search : '');
    } catch {
        return raw.trim().replace(/\/+$/, '');
    }
}

/** Extract the pathname (without query params) for fuzzy comparison. */
function urlPath(raw: string): string {
    try {
        const u = new URL(raw);
        return u.origin + u.pathname.replace(/\/+$/, '');
    } catch {
        return raw.split('?')[0].replace(/\/+$/, '');
    }
}

/** Deduplicate a list of image URLs using both exact and fuzzy matching. */
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

        // Skip if we already have this exact URL or same path (fuzzy)
        if (seen.has(norm) || seenPaths.has(path)) continue;

        seen.add(norm);
        seenPaths.add(path);
        result.push(trimmed);
    }
    return result;
}

/** Fetch up to 6 images from the backend /places/images endpoint (SerperAPI). */
async function fetchSerperImages(placeName: string, destination?: string): Promise<string[]> {
    try {
        const query = destination
            ? `${placeName} ${destination} turismo`
            : `${placeName} turismo Peru`;
        const url = `${API_BASE}/api/v1/places/images?query=${encodeURIComponent(query)}&num=6`;
        const res = await fetch(url, { cache: 'force-cache' });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data.images) ? data.images : [];
    } catch {
        return [];
    }
}

/** Skeleton pulse block for the image area while loading. */
function ImageSkeleton() {
    return (
        <div className="w-full h-32 bg-muted animate-pulse rounded-t-xl" />
    );
}

/**
 * Horizontal image strip that dynamically fills the card width.
 * Shows up to 4 images; if more exist, a scroll button reveals them.
 */
function ImageStrip({
    images,
    placeName,
}: {
    images: string[];
    placeName: string;
}) {
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
        // Scroll by the width of one image slot
        const slotWidth = el.clientWidth / Math.min(images.length, 4);
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
                            /* Each image takes 1/min(total,4) of the container,
                               minus the gap (0.25rem = 4px per gap). */
                            width: `calc(${100 / Math.min(images.length, 4)}% - ${((Math.min(images.length, 4) - 1) * 4) /
                                Math.min(images.length, 4)
                                }px)`,
                            aspectRatio: '1 / 1',
                        }}
                    >
                        <Image
                            src={url}
                            alt={`${placeName} — foto ${idx + 1}`}
                            fill
                            className="object-cover"
                            sizes="25vw"
                            unoptimized
                        />
                    </div>
                ))}
            </div>

            {/* Gradient fade on right edge when scrollable */}
            {canScroll && (
                <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-card/80 to-transparent pointer-events-none rounded-r-lg" />
            )}

            {/* Scroll-right button */}
            {canScroll && (
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        scrollRight();
                    }}
                    variant="secondary"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full shadow-lg opacity-0 group-hover/strip:opacity-100 transition-opacity bg-black/40 hover:bg-black/60 border-0 text-white [&_svg]:text-white"
                    aria-label="Ver más imágenes"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            )}

            {/* Photo count badge */}
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

export function PlaceCard({ place }: PlaceCardProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [serperImages, setSerperImages] = useState<string[]>([]);
    const [loadingImages, setLoadingImages] = useState(true);

    // Fetch images on mount
    useEffect(() => {
        let cancelled = false;
        setLoadingImages(true);

        fetchSerperImages(place.name, place.destination)
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
    }, [place.name, place.destination]);

    // Compute final deduplicated image list
    const allImages = (() => {
        const googlePhoto = getPlaceThumbnail(place.photos);
        const candidates = [...serperImages];

        // Add Google photo as fallback
        if (googlePhoto && typeof googlePhoto === 'string' && googlePhoto.trim()) {
            candidates.push(googlePhoto.trim());
        }

        // Full dedup and limit to 6 max
        return deduplicateImages(candidates).slice(0, 6);
    })();

    const placeAsPlaceInfo: PlaceInfo = {
        place_id: place.place_id || '',
        name: place.name,
        address: place.address || '',
        rating: place.rating,
        price_level: place.price_level,
        types: place.types || [],
        photos: place.photos || [],
        location: place.location || { lat: 0, lng: 0 },
        visit_duration: place.visit_duration || place.duration,
        why_visit: place.why_visit || place.description,
    };

    return (
        <>
            <Card
                className="overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => setModalOpen(true)}
            >
                {/* ── Horizontal image strip (top) ── */}
                <div className="p-2 pb-0">
                    {loadingImages ? (
                        <ImageSkeleton />
                    ) : allImages.length === 0 ? (
                        <div className="w-full h-28 flex items-center justify-center bg-muted rounded-lg">
                            <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                    ) : allImages.length === 1 ? (
                        <div className="relative w-full h-36 rounded-lg overflow-hidden bg-muted">
                            <Image
                                src={allImages[0]}
                                alt={place.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="100vw"
                                unoptimized
                            />
                        </div>
                    ) : (
                        <ImageStrip images={allImages} placeName={place.name} />
                    )}
                </div>

                {/* ── Content ── */}
                <CardContent className="p-4 pt-3">
                    <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                                {place.name}
                            </h4>
                            {place.rating && (
                                <Badge variant="secondary" className="shrink-0 gap-1">
                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                    <span className="text-sm font-medium">{place.rating}</span>
                                </Badge>
                            )}
                        </div>

                        {place.address && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{place.address}</span>
                            </div>
                        )}

                        {(place.why_visit || place.description) && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {place.why_visit || place.description}
                            </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-2">
                            {place.price_level !== undefined && (
                                <Badge variant="outline" className="gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {PRICE_LEVEL_SYMBOLS[place.price_level - 1] || '$'}
                                </Badge>
                            )}
                            {(place.visit_duration || place.duration) && (
                                <Badge variant="outline" className="gap-1">
                                    <Clock className="h-3 w-3" />
                                    {place.visit_duration || place.duration}
                                </Badge>
                            )}
                            {place.types && place.types.length > 0 && (
                                <Badge variant="secondary">
                                    {place.types[0].replace(/_/g, ' ')}
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <PlaceDetailModal place={placeAsPlaceInfo} open={modalOpen} onOpenChange={setModalOpen} />
        </>
    );
}
