'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Star,
    MapPin,
    DollarSign,
    Clock,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    ImageIcon,
} from 'lucide-react';
import { getPlacePhotos, getPlaceThumbnail } from '@/lib/utils/google-places';
import type { PlaceInfo } from '@/store/chatStore';

interface PlaceDetailModalProps {
    place: PlaceInfo | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const PRICE_LEVEL_LABELS = ['Económico', 'Moderado', 'Caro', 'Muy caro'];

export function PlaceDetailModal({ place, open, onOpenChange }: PlaceDetailModalProps) {
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [imageError, setImageError] = useState(false);

    if (!place) return null;

    const photos = getPlacePhotos(place.photos, 8, 1200);
    const displayPhoto = imageError || !photos.length ? '/placeholder-place.jpg' : photos[currentPhotoIndex];
    const totalPhotos = photos.length;
    const hasMultiplePhotos = totalPhotos > 1;

    const goToPrevPhoto = () => {
        setImageError(false);
        setCurrentPhotoIndex((prev) => (prev === 0 ? totalPhotos - 1 : prev - 1));
    };

    const goToNextPhoto = () => {
        setImageError(false);
        setCurrentPhotoIndex((prev) => (prev === totalPhotos - 1 ? 0 : prev + 1));
    };

    const openInGoogleMaps = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}&query_place_id=${place.place_id}`;
        window.open(url, '_blank');
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    setCurrentPhotoIndex(0);
                    setImageError(false);
                }
                onOpenChange(isOpen);
            }}
        >
            <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-hidden p-0 flex flex-col rounded-2xl">
                {/* Photo gallery — flexible height */}
                <div className="relative w-full h-[300px] sm:h-[350px] shrink-0 bg-muted rounded-t-2xl overflow-hidden">
                    <Image
                        src={displayPhoto}
                        alt={`${place.name} - Foto ${currentPhotoIndex + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 768px"
                        priority
                        onError={() => setImageError(true)}
                    />

                    {/* Navigation controls */}
                    {hasMultiplePhotos && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10"
                                onClick={goToPrevPhoto}
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10"
                                onClick={goToNextPhoto}
                            >
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </>
                    )}

                    {/* Photo counter */}
                    {hasMultiplePhotos && (
                        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                            <ImageIcon className="h-3 w-3" />
                            {currentPhotoIndex + 1} / {totalPhotos}
                        </div>
                    )}

                    {/* Thumbnail strip */}
                    {hasMultiplePhotos && (
                        <div className="absolute bottom-3 left-3 flex gap-1.5">
                            {photos.slice(0, 5).map((photo, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setImageError(false);
                                        setCurrentPhotoIndex(idx);
                                    }}
                                    className={`relative w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${idx === currentPhotoIndex
                                            ? 'border-white shadow-lg scale-110'
                                            : 'border-white/40 hover:border-white/70'
                                        }`}
                                >
                                    <Image src={photo} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" sizes="48px" />
                                </button>
                            ))}
                            {totalPhotos > 5 && (
                                <div className="w-12 h-12 rounded-md bg-black/50 border-2 border-white/40 flex items-center justify-center text-white text-xs font-medium">
                                    +{totalPhotos - 5}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Content — auto height */}
                <div className="overflow-y-auto flex flex-col p-4 sm:p-6 rounded-b-2xl max-h-[calc(90vh-300px)] sm:max-h-[calc(90vh-350px)]">
                    <div className="space-y-3 overflow-hidden">
                        <DialogHeader>
                            <DialogTitle className="text-xl sm:text-2xl">{place.name}</DialogTitle>
                            {place.address && (
                                <DialogDescription className="flex items-start gap-2 text-xs sm:text-sm">
                                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">{place.address}</span>
                                </DialogDescription>
                            )}
                        </DialogHeader>

                        {/* Rating & price */}
                        <div className="flex flex-wrap items-center gap-2">
                            {place.rating && (
                                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-full">
                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                    <span className="font-semibold text-xs">{place.rating}</span>
                                    <span className="text-[10px] text-muted-foreground">/ 5</span>
                                </div>
                            )}
                            {place.price_level && (
                                <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full">
                                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                                    <span className="text-xs font-medium">{'$'.repeat(place.price_level)}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {PRICE_LEVEL_LABELS[place.price_level - 1] || ''}
                                    </span>
                                </div>
                            )}
                            {place.visit_duration && (
                                <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-full">
                                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                                    <span className="text-xs">{place.visit_duration}</span>
                                </div>
                            )}
                        </div>

                        {/* Why visit */}
                        {place.why_visit && (
                            <div className="bg-muted/50 rounded-lg p-3 border border-border min-w-0">
                                <h4 className="font-semibold text-xs sm:text-sm mb-1">Por qué visitar</h4>
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-4">
                                    {place.why_visit}
                                </p>
                            </div>
                        )}

                        {/* Type tags */}
                        {place.types && place.types.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {place.types.slice(0, 4).map((type, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[10px]">
                                        {type.replace(/_/g, ' ')}
                                    </Badge>
                                ))}
                                {place.types.length > 4 && (
                                    <Badge variant="secondary" className="text-[10px]">
                                        +{place.types.length - 4}
                                    </Badge>
                                )}
                            </div>
                        )}

                        {/* Google Maps CTA */}
                        <Button variant="outline" className="w-full gap-2 shrink-0 text-sm" onClick={openInGoogleMaps}>
                            <ExternalLink className="h-3.5 w-3.5" />
                            Ver en Google Maps
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
