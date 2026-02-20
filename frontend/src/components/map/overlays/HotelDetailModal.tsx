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
    MapPin,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    ImageIcon,
    Wifi,
    Coffee,
    Car,
    Waves,
} from 'lucide-react';
import type { AccommodationOption } from '@/store/chatStore';

interface HotelDetailModalProps {
    hotel: AccommodationOption | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const AMENITY_ICONS: Record<string, typeof Wifi> = {
    'Wi-Fi': Wifi,
    'WiFi': Wifi,
    'wifi': Wifi,
    'Desayuno': Coffee,
    'Breakfast': Coffee,
    'Estacionamiento': Car,
    'Parking': Car,
    'Piscina': Waves,
    'Pool': Waves,
};

function getAmenityIcon(amenity: string) {
    for (const [key, Icon] of Object.entries(AMENITY_ICONS)) {
        if (amenity.toLowerCase().includes(key.toLowerCase())) return Icon;
    }
    return null;
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

export function HotelDetailModal({ hotel, open, onOpenChange }: HotelDetailModalProps) {
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [imageError, setImageError] = useState(false);

    if (!hotel) return null;

    const photos = hotel.images.filter(Boolean);
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
        if (hotel.booking_url) {
            window.open(hotel.booking_url, '_blank');
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
                <div className="relative w-full h-[300px] sm:h-[400px] shrink-0 bg-muted overflow-hidden">
                    <Image
                        src={displayPhoto}
                        alt={`${hotel.name} - Foto ${currentPhotoIndex + 1}`}
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
                                    className={`relative w-14 h-14 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 ${
                                        idx === currentPhotoIndex
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
                    <div className="space-y-4">
                        <DialogHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0 space-y-2">
                                    <DialogTitle className="text-2xl">{hotel.name}</DialogTitle>
                                    
                                    {/* Hotel stars */}
                                    {hotel.stars > 0 && (
                                        <div className="flex items-center gap-0.5">
                                            {Array.from({ length: hotel.stars }).map((_, i) => (
                                                <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Hotel type */}
                                    {hotel.type && (
                                        <Badge variant="secondary">
                                            {hotel.type}
                                        </Badge>
                                    )}
                                </div>
                                
                                {/* Price */}
                                <Card className="shrink-0">
                                    <CardContent className="p-3 text-right">
                                        <p className="text-2xl font-bold text-primary leading-none">
                                            {formatPrice(hotel.price_per_night, hotel.currency)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">por noche</p>
                                        {hotel.total_price > 0 && hotel.total_price !== hotel.price_per_night && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Total: {formatPrice(hotel.total_price, hotel.currency)}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </DialogHeader>

                        <Separator />

                        {/* Address */}
                        {hotel.address && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                <span className="line-clamp-2">{hotel.address}</span>
                            </div>
                        )}

                        {/* Check-in / Check-out */}
                        <div className="flex items-center gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Check-in:</span>
                                <span className="ml-2 font-semibold">{hotel.check_in}</span>
                            </div>
                            <Separator orientation="vertical" className="h-4" />
                            <div>
                                <span className="text-muted-foreground">Check-out:</span>
                                <span className="ml-2 font-semibold">{hotel.check_out}</span>
                            </div>
                        </div>

                        {/* Rating */}
                        {hotel.rating > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`${ratingColor(hotel.rating)} text-white border-0`}>
                                    <Star className="w-3.5 h-3.5 fill-current mr-1" />
                                    {hotel.rating.toFixed(1)}
                                </Badge>
                                <span className="text-sm font-semibold">
                                    {ratingLabel(hotel.rating)}
                                </span>
                                {hotel.reviews_count > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                        ({hotel.reviews_count.toLocaleString()} reseñas)
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Amenities */}
                        {hotel.amenities && hotel.amenities.length > 0 && (
                            <Card>
                                <CardContent className="p-4">
                                    <h4 className="font-semibold text-sm mb-3">Servicios</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {hotel.amenities.slice(0, 8).map((amenity, i) => {
                                            const Icon = getAmenityIcon(amenity);
                                            return (
                                                <Badge key={i} variant="outline">
                                                    {Icon && <Icon className="w-3 h-3 mr-1" />}
                                                    {amenity}
                                                </Badge>
                                            );
                                        })}
                                        {hotel.amenities.length > 8 && (
                                            <Badge variant="secondary">
                                                +{hotel.amenities.length - 8} más
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Booking CTA */}
                        {hotel.booking_url && (
                            <Button 
                                className="w-full gap-2" 
                                size="lg"
                                onClick={openBookingUrl}
                            >
                                Ver disponibilidad y reservar
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
