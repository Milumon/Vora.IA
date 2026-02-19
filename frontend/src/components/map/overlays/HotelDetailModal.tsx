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
    if (r >= 4.5) return 'bg-emerald-500';
    if (r >= 4.0) return 'bg-emerald-400';
    if (r >= 3.5) return 'bg-yellow-400';
    return 'bg-orange-400';
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
            <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-hidden p-0 flex flex-col rounded-2xl">
                {/* Photo gallery — flexible height */}
                <div className="relative w-full h-[300px] sm:h-[350px] shrink-0 bg-muted rounded-t-2xl overflow-hidden">
                    <Image
                        src={displayPhoto}
                        alt={`${hotel.name} - Foto ${currentPhotoIndex + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 768px"
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
                        <div className="absolute bottom-3 left-3 flex gap-1.5 overflow-x-auto max-w-[calc(100%-120px)] scrollbar-hide">
                            {photos.slice(0, 8).map((photo, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setImageError(false);
                                        setCurrentPhotoIndex(idx);
                                    }}
                                    className={`relative w-12 h-12 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 ${
                                        idx === currentPhotoIndex
                                            ? 'border-white shadow-lg scale-110'
                                            : 'border-white/40 hover:border-white/70'
                                    }`}
                                >
                                    <Image 
                                        src={photo} 
                                        alt={`Thumbnail ${idx + 1}`} 
                                        fill 
                                        className="object-cover" 
                                        sizes="48px"
                                        unoptimized
                                    />
                                </button>
                            ))}
                            {totalPhotos > 8 && (
                                <div className="w-12 h-12 rounded-md bg-black/50 border-2 border-white/40 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                    +{totalPhotos - 8}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Content — auto height */}
                <div className="overflow-y-auto flex flex-col p-4 sm:p-6 rounded-b-2xl max-h-[calc(90vh-300px)] sm:max-h-[calc(90vh-350px)]">
                    <div className="space-y-3">
                        <DialogHeader>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <DialogTitle className="text-xl sm:text-2xl mb-1.5">{hotel.name}</DialogTitle>
                                    {/* Hotel stars */}
                                    {hotel.stars > 0 && (
                                        <div className="flex items-center gap-0.5 mb-1.5">
                                            {Array.from({ length: hotel.stars }).map((_, i) => (
                                                <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                            ))}
                                        </div>
                                    )}
                                    {/* Hotel type */}
                                    {hotel.type && (
                                        <span className="inline-flex px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-semibold uppercase tracking-wide">
                                            {hotel.type}
                                        </span>
                                    )}
                                </div>
                                {/* Price */}
                                <div className="text-right shrink-0">
                                    <p className="text-xl sm:text-2xl font-black text-purple-600 leading-none">
                                        {formatPrice(hotel.price_per_night, hotel.currency)}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">por noche</p>
                                    {hotel.total_price > 0 && hotel.total_price !== hotel.price_per_night && (
                                        <p className="text-[10px] text-gray-500 mt-0.5">
                                            Total: {formatPrice(hotel.total_price, hotel.currency)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Address */}
                        {hotel.address && (
                            <div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 shrink-0" />
                                <span className="line-clamp-2">{hotel.address}</span>
                            </div>
                        )}

                        {/* Check-in / Check-out */}
                        <div className="flex items-center gap-3 text-xs sm:text-sm">
                            <div>
                                <span className="text-gray-500">Check-in:</span>
                                <span className="ml-1.5 font-semibold">{hotel.check_in}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Check-out:</span>
                                <span className="ml-1.5 font-semibold">{hotel.check_out}</span>
                            </div>
                        </div>

                        {/* Rating */}
                        {hotel.rating > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-white text-xs font-bold ${ratingColor(hotel.rating)}`}>
                                    <Star className="w-3.5 h-3.5 fill-white" />
                                    {hotel.rating.toFixed(1)}
                                </span>
                                <span className="text-xs font-semibold text-gray-600">
                                    {ratingLabel(hotel.rating)}
                                </span>
                                {hotel.reviews_count > 0 && (
                                    <span className="text-[10px] text-gray-400">
                                        ({hotel.reviews_count.toLocaleString()} reseñas)
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Amenities */}
                        {hotel.amenities && hotel.amenities.length > 0 && (
                            <div className="bg-muted/50 rounded-lg p-3 border border-border">
                                <h4 className="font-semibold text-xs sm:text-sm mb-2">Servicios</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {hotel.amenities.slice(0, 8).map((amenity, i) => {
                                        const Icon = getAmenityIcon(amenity);
                                        return (
                                            <span
                                                key={i}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-gray-200 text-[10px] font-medium text-gray-700"
                                            >
                                                {Icon && <Icon className="w-3 h-3" />}
                                                {amenity}
                                            </span>
                                        );
                                    })}
                                    {hotel.amenities.length > 8 && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-[10px] font-medium text-gray-500">
                                            +{hotel.amenities.length - 8} más
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Booking CTA */}
                        {hotel.booking_url && (
                            <Button 
                                className="w-full gap-2 bg-purple-500 hover:bg-purple-600 text-white text-sm" 
                                onClick={openBookingUrl}
                            >
                                Ver disponibilidad y reservar
                                <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
