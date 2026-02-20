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
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import { getPlacePhotos } from '@/lib/utils/google-places';
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
            <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden p-0 flex flex-col">
                {/* Photo gallery */}
                <div className="relative w-full h-[300px] sm:h-[400px] shrink-0 bg-muted overflow-hidden">
                    <Image
                        src={displayPhoto}
                        alt={`${place.name} - Foto ${currentPhotoIndex + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 896px"
                        priority
                        onError={() => setImageError(true)}
                    />

                    {/* Navigation controls */}
                    {hasMultiplePhotos && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 backdrop-blur-sm h-10 w-10 rounded-full shadow-lg"
                                onClick={goToPrevPhoto}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 backdrop-blur-sm h-10 w-10 rounded-full shadow-lg"
                                onClick={goToNextPhoto}
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </>
                    )}

                    {/* Photo counter */}
                    {hasMultiplePhotos && (
                        <Badge 
                            variant="secondary" 
                            className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm shadow-lg"
                        >
                            <ImageIcon className="h-3 w-3 mr-1.5" />
                            {currentPhotoIndex + 1} / {totalPhotos}
                        </Badge>
                    )}

                    {/* Thumbnail strip */}
                    {hasMultiplePhotos && (
                        <div className="absolute bottom-4 left-4 flex gap-2">
                            {photos.slice(0, 5).map((photo, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setImageError(false);
                                        setCurrentPhotoIndex(idx);
                                    }}
                                    className={`relative w-14 h-14 rounded-md overflow-hidden border-2 transition-all ${
                                        idx === currentPhotoIndex
                                            ? 'border-primary shadow-lg scale-110'
                                            : 'border-background/60 hover:border-background/80'
                                    }`}
                                >
                                    <Image src={photo} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" sizes="56px" />
                                </button>
                            ))}
                            {totalPhotos > 5 && (
                                <div className="w-14 h-14 rounded-md bg-background/60 backdrop-blur-sm border-2 border-background/60 flex items-center justify-center text-foreground text-xs font-medium">
                                    +{totalPhotos - 5}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex flex-col p-6 max-h-[calc(90vh-300px)] sm:max-h-[calc(90vh-400px)]">
                    <div className="space-y-2">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">{place.name}</DialogTitle>
                            {place.address && (
                                <DialogDescription className="flex items-start gap-2 text-sm">
                                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">{place.address}</span>
                                </DialogDescription>
                            )}
                        </DialogHeader>

                        <Separator />

                        {/* Rating & price */}
                        <div className="flex flex-wrap items-center gap-2">
                            {place.rating && (
                                <Badge variant="secondary" className="gap-1.5">
                                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                    <span className="font-semibold">{place.rating}</span>
                                    <span className="text-muted-foreground">/ 5</span>
                                </Badge>
                            )}
                            {place.price_level && (
                                <Badge variant="secondary" className="gap-1.5">
                                    <DollarSign className="h-3.5 w-3.5" />
                                    <span>{'$'.repeat(place.price_level)}</span>
                                    <span className="text-muted-foreground">
                                        {PRICE_LEVEL_LABELS[place.price_level - 1] || ''}
                                    </span>
                                </Badge>
                            )}
                            {place.visit_duration && (
                                <Badge variant="secondary" className="gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{place.visit_duration}</span>
                                </Badge>
                            )}
                        </div>

                        {/* Why visit */}
                        {place.why_visit && (
                            <Card>
                                <CardContent className="p-4">
                                    <h4 className="font-semibold text-sm mb-2">Por qué visitar</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {place.why_visit}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Type tags */}
                        {place.types && place.types.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {place.types.slice(0, 4).map((type, idx) => (
                                    <Badge key={idx} variant="outline">
                                        {type.replace(/_/g, ' ')}
                                    </Badge>
                                ))}
                                {place.types.length > 4 && (
                                    <Badge variant="outline">
                                        +{place.types.length - 4}
                                    </Badge>
                                )}
                            </div>
                        )}

                        {/* Google Maps CTA */}
                        <Button 
                            variant="outline" 
                            className="w-full gap-2 py-2 bg-black hover:bg-black/80 dark:bg-amber-500 dark:hover:bg-amber-600 text-white hover:text-white" 
                            size="lg"
                            onClick={openInGoogleMaps}
                        >
                            <ExternalLink className="h-4 w-4 text-white" />
                            Ver en Google Maps
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
