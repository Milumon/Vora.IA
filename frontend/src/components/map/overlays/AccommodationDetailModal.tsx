'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Star,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    ImageIcon,
    Award,
    MapPin,
    Calendar,
} from 'lucide-react';
import type { AccommodationOption } from '@/store/chatStore';

interface AccommodationDetailModalProps {
    accommodation: AccommodationOption | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function formatPrice(price: number, currency: string): string {
    if (price <= 0) return 'Consultar';
    const symbols: Record<string, string> = { PEN: 'S/', USD: '$', EUR: '€' };
    return `${symbols[currency] || currency}${price.toFixed(0)}`;
}

function ratingLabel(r: number) {
    if (r >= 4.5) return 'Excelente';
    if (r >= 4.0) return 'Muy bueno';
    if (r >= 3.5) return 'Bueno';
    if (r >= 3.0) return 'Aceptable';
    return '';
}

function ratingColor(r: number) {
    if (r >= 4.5) return 'bg-emerald-600 dark:bg-emerald-500';
    if (r >= 4.0) return 'bg-emerald-500 dark:bg-emerald-400';
    if (r >= 3.5) return 'bg-amber-500 dark:bg-amber-400';
    return 'bg-orange-500 dark:bg-orange-400';
}

export function AccommodationDetailModal({ accommodation, open, onOpenChange }: AccommodationDetailModalProps) {
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [imageError, setImageError] = useState(false);

    if (!accommodation) return null;

    const photos = accommodation.images.filter(Boolean);
    const displayPhoto = imageError || !photos.length
        ? '/placeholder-place.jpg'
        : photos[currentPhotoIndex];
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

    const openBookingUrl = () => {
        if (accommodation.booking_url) {
            window.open(accommodation.booking_url, '_blank');
        }
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
                <div className="relative w-full h-[300px] sm:h-[300px] shrink-0 bg-muted overflow-hidden">
                    <Image
                        src={displayPhoto}
                        alt={`${accommodation.name} - Foto ${currentPhotoIndex + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 896px"
                        priority
                        onError={() => setImageError(true)}
                        unoptimized
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
                        <div className="absolute bottom-4 left-4 flex gap-2 overflow-x-auto max-w-[calc(100%-140px)] scrollbar-hide">
                            {photos.slice(0, 8).map((photo, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setImageError(false);
                                        setCurrentPhotoIndex(idx);
                                    }}
                                    className={`relative w-14 h-14 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 ${idx === currentPhotoIndex
                                        ? 'border-primary shadow-lg scale-110'
                                        : 'border-background/60 hover:border-background/80'
                                        }`}
                                >
                                    <Image
                                        src={photo}
                                        alt={`Thumbnail ${idx + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="56px"
                                        unoptimized
                                    />
                                </button>
                            ))}
                            {totalPhotos > 8 && (
                                <div className="w-14 h-14 rounded-md bg-background/60 backdrop-blur-sm border-2 border-background/60 flex items-center justify-center text-foreground text-xs font-medium flex-shrink-0">
                                    +{totalPhotos - 8}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex flex-col p-6 max-h-[calc(90vh-300px)] sm:max-h-[calc(90vh-400px)]">
                    <div className="space-y-2">
                        <DialogHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0 space-y-2">
                                    <DialogTitle className="text-2xl">{accommodation.name}</DialogTitle>

                                    {/* Accommodation type and badges in horizontal layout */}
                                    <div className="flex flex-wrap gap-2">
                                        {accommodation.type && (
                                            <Badge variant="secondary" className="gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {accommodation.type}
                                            </Badge>
                                        )}
                                        {accommodation.badges && accommodation.badges.length > 0 && (
                                            <>
                                                {accommodation.badges.map((badge, i) => (
                                                    <Badge key={i} variant="secondary" className="gap-1">
                                                        <Award className="h-3 w-3" />
                                                        {badge}
                                                    </Badge>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Price */}
                                <Card className="shrink-0">
                                    <CardContent className="p-3 text-right">
                                        {accommodation.price_per_night > 0 ? (
                                            <>
                                                <p className="text-2xl font-bold text-primary leading-none">
                                                    {formatPrice(accommodation.price_per_night, accommodation.currency)}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">por noche</p>
                                                {accommodation.total_price > 0 && accommodation.total_price !== accommodation.price_per_night && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Total: {formatPrice(accommodation.total_price, accommodation.currency)}
                                                    </p>
                                                )}
                                            </>
                                        ) : accommodation.total_price > 0 ? (
                                            <>
                                                <p className="text-2xl font-bold text-primary leading-none">
                                                    {formatPrice(accommodation.total_price, accommodation.currency)}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-2xl font-bold text-primary leading-none">
                                                Consultar
                                            </p>
                                        )}
                                        {accommodation.pricing_qualifier && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {accommodation.pricing_qualifier}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </DialogHeader>

                        <Separator />

                        {/* Check-in / Check-out */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <span className="text-muted-foreground">Check-in:</span>
                                            <span className="ml-2 font-semibold">{accommodation.check_in}</span>
                                        </div>
                                    </div>
                                    <Separator orientation="vertical" className="h-4" />
                                    <div>
                                        <span className="text-muted-foreground">Check-out:</span>
                                        <span className="ml-2 font-semibold">{accommodation.check_out}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Rating */}
                        {accommodation.rating > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`${ratingColor(accommodation.rating)} text-white border-0`}>
                                    <Star className="w-3.5 h-3.5 fill-current mr-1" />
                                    {accommodation.rating.toFixed(1)}
                                </Badge>
                                <span className="text-sm font-semibold">
                                    {ratingLabel(accommodation.rating)}
                                </span>
                                {accommodation.reviews_count > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                        ({accommodation.reviews_count.toLocaleString()} reseñas)
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Subtitles / Details */}
                        {accommodation.subtitles && accommodation.subtitles.length > 0 && (
                            <Card>
                                <CardContent className="p-4">
                                    <h4 className="font-semibold text-sm mb-3">Detalles</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {accommodation.subtitles.map((subtitle, i) => (
                                            <Badge key={i} variant="outline">
                                                {subtitle}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Booking CTA */}
                        {accommodation.booking_url && (
                            <Button
                                className="w-full gap-2"
                                size="lg"
                                onClick={openBookingUrl}
                            >
                                Ver en Airbnb
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
