'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, DollarSign, Clock, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { getPlaceThumbnail } from '@/lib/utils/google-places';
import { PlaceDetailModal } from '@/components/map/overlays/PlaceDetailModal';
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
    };
}

const PRICE_LEVEL_SYMBOLS = ['$', '$$', '$$$', '$$$$'];

export function PlaceCard({ place }: PlaceCardProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const photoUrl = getPlaceThumbnail(place.photos);
    const photoCount = place.photos?.filter(Boolean).length || 0;

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
                className="overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setModalOpen(true)}
            >
                <div className="flex flex-col sm:flex-row">
                    {/* Image */}
                    <div className="relative w-full sm:w-48 h-48 sm:h-auto shrink-0 bg-muted">
                        <Image
                            src={photoUrl}
                            alt={place.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 100vw, 192px"
                        />
                        {photoCount > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <ImageIcon className="h-3 w-3" />
                                {photoCount}
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <CardContent className="flex-1 p-4">
                        <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                                    {place.name}
                                </h4>
                                {place.rating && (
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                        <span className="text-sm font-medium">{place.rating}</span>
                                    </div>
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
                                    <Badge variant="secondary" className="text-xs">
                                        {place.types[0].replace(/_/g, ' ')}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </div>
            </Card>

            <PlaceDetailModal place={placeAsPlaceInfo} open={modalOpen} onOpenChange={setModalOpen} />
        </>
    );
}
