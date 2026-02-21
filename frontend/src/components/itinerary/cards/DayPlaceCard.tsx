'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    MapPin,
    Star,
    Clock,
    ImageIcon,
    ChevronRight,
    Utensils,
} from 'lucide-react';
import Image from 'next/image';
import { getPlaceThumbnail } from '@/lib/utils/google-places';
import type { PlaceInfo } from '@/store/chatStore';

/* ─── Image utilities (mirrored from PlaceCard.tsx) ──────────────────────── */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

/* ─── Image strip ──────────────────────────────────────────────────────────── */

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
                            width: `calc(${100 / Math.min(images.length, 4)}% - ${((Math.min(images.length, 4) - 1) * 4) / Math.min(images.length, 4)
                                }px)`,
                            aspectRatio: '16 / 9',
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

            {canScroll && (
                <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-card/80 to-transparent pointer-events-none rounded-r-lg" />
            )}
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

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */

function ImageSkeleton() {
    return <div className="w-full h-36 bg-muted animate-pulse rounded-lg" />;
}

/* ─── Main component ────────────────────────────────────────────────────────── */

interface DayPlaceCardProps {
    place: PlaceInfo & { destination?: string };
    time: string;
    isSelected: boolean;
    onPlaceClick: (place: PlaceInfo) => void;
    variant?: 'place' | 'lunch';
}

/**
 * Card used inside the day schedule timeline.
 * Displays time badge, image carousel, name, description
 * and reacts to being selected (highlights with ring + border).
 */
export function DayPlaceCard({
    place,
    time,
    isSelected,
    onPlaceClick,
    variant = 'place',
}: DayPlaceCardProps) {
    const [serperImages, setSerperImages] = useState<string[]>([]);
    const [loadingImages, setLoadingImages] = useState(true);

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

    const allImages = (() => {
        const googlePhoto = getPlaceThumbnail(place.photos);
        const candidates = [...serperImages];
        if (googlePhoto && typeof googlePhoto === 'string' && googlePhoto.trim()) {
            candidates.push(googlePhoto.trim());
        }
        return deduplicateImages(candidates).slice(0, 6);
    })();

    return (
        <Card
            onClick={() => onPlaceClick(place)}
            className={`overflow-hidden cursor-pointer group transition-all duration-200 ${isSelected
                    ? 'ring-2 ring-primary border-primary shadow-lg shadow-primary/10'
                    : 'shadow-md hover:shadow-xl'
                }`}
        >
            {/* Image area */}
            <div className="p-2 pb-0">
                {loadingImages ? (
                    <ImageSkeleton />
                ) : allImages.length === 0 ? (
                    <div className="w-full h-36 flex items-center justify-center bg-muted rounded-lg">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                ) : allImages.length === 1 ? (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted">
                        <Image
                            src={allImages[0]}
                            alt={place.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="50vw"
                            unoptimized
                        />
                    </div>
                ) : (
                    <ImageStrip images={allImages} placeName={place.name} />
                )}
            </div>

            <CardContent className="p-4 pt-3 space-y-2">
                {/* Time badge + variant badge */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                        className={`gap-1 font-semibold text-xs border-0 ${isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-primary/10 text-primary'
                            }`}
                    >
                        <Clock className="h-3 w-3" />
                        {time}
                    </Badge>
                    {variant === 'lunch' && (
                        <Badge
                            variant="secondary"
                            className="gap-1 text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0"
                        >
                            <Utensils className="h-3 w-3" />
                            Almuerzo
                        </Badge>
                    )}
                </div>

                {/* Name */}
                <div className="flex items-start justify-between gap-2">
                    <h4
                        className={`font-semibold text-sm leading-snug line-clamp-1 transition-colors ${isSelected ? 'text-primary' : 'group-hover:text-primary'
                            }`}
                    >
                        {place.name}
                    </h4>
                    {place.rating && (
                        <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            <span>{place.rating}</span>
                        </Badge>
                    )}
                </div>

                {/* Address */}
                {place.address && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{place.address}</span>
                    </div>
                )}

                {/* Description */}
                {place.why_visit && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {place.why_visit}
                    </p>
                )}

                {/* Duration */}
                {place.visit_duration && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                        <Clock className="h-3 w-3" />
                        <span>{place.visit_duration}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
