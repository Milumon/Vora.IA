'use client';

import { useState, useMemo } from 'react';
import { Star, ChevronRight, ChevronDown, ChevronUp, MapPin, ExternalLink, Wifi, Coffee, Car, Waves } from 'lucide-react';
import Image from 'next/image';
import type { AccommodationOption } from '@/store/chatStore';
import { HotelDetailModal } from '@/components/map/overlays/HotelDetailModal';

interface AccommodationCardProps {
    options: AccommodationOption[];
}

/* ─── Helpers ─────────────────────────────────────────────────── */

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

const AMENITY_ICONS: Record<string, typeof Wifi> = {
    'Wi-Fi': Wifi, WiFi: Wifi, wifi: Wifi,
    Desayuno: Coffee, Breakfast: Coffee,
    Estacionamiento: Car, Parking: Car,
    Piscina: Waves, Pool: Waves,
};

function getAmenityIcon(amenity: string) {
    for (const [key, Icon] of Object.entries(AMENITY_ICONS)) {
        if (amenity.toLowerCase().includes(key.toLowerCase())) return Icon;
    }
    return null;
}

/* ─── Sub-components ──────────────────────────────────────────── */

function HotelImageCarousel({
    images,
    name,
    onImageClick
}: {
    images: string[];
    name: string;
    onImageClick: () => void;
}) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (images.length === 0) {
        return (
            <div className="w-full h-40 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
        );
    }

    const goToPrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const hasMultipleImages = images.length > 1;

    return (
        <div className="relative group/carousel">
            {/* Imagen principal */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onImageClick();
                }}
                className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer hover:opacity-95 transition-opacity"
            >
                <Image 
                    src={images[currentIndex]} 
                    alt={`${name} — foto ${currentIndex + 1}`} 
                    fill 
                    className="object-cover" 
                    sizes="(max-width: 768px) 100vw, 600px" 
                    unoptimized 
                />
                
                {/* Indicador de posición */}
                {hasMultipleImages && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs font-medium">
                        {currentIndex + 1} / {images.length}
                    </div>
                )}
            </button>

            {/* Botón izquierdo */}
            {hasMultipleImages && (
                <button
                    onClick={goToPrevious}
                    aria-label="Imagen anterior"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full
                     bg-white/90 dark:bg-gray-800/90 shadow-md flex items-center justify-center
                     opacity-0 group-hover/carousel:opacity-100 hover:bg-white dark:hover:bg-gray-700 transition-all"
                >
                    <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-200 rotate-180" />
                </button>
            )}

            {/* Botón derecho */}
            {hasMultipleImages && (
                <button
                    onClick={goToNext}
                    aria-label="Imagen siguiente"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full
                     bg-white/90 dark:bg-gray-800/90 shadow-md flex items-center justify-center
                     opacity-0 group-hover/carousel:opacity-100 hover:bg-white dark:hover:bg-gray-700 transition-all"
                >
                    <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                </button>
            )}

            {/* Indicadores de puntos (opcional, para mejor UX) */}
            {hasMultipleImages && images.length <= 5 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentIndex(idx);
                            }}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                                idx === currentIndex 
                                    ? 'bg-white w-4' 
                                    : 'bg-white/50 hover:bg-white/75'
                            }`}
                            aria-label={`Ir a imagen ${idx + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function RatingBadge({ rating, reviewsCount }: { rating: number; reviewsCount: number }) {
    if (rating <= 0) return null;
    const label = ratingLabel(rating);
    return (
        <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-white text-xs font-bold ${ratingColor(rating)}`}>
                <Star className="w-3 h-3 fill-white" />
                {rating.toFixed(1)}
            </span>
            {label && <span className="text-xs font-semibold text-gray-600">{label}</span>}
            {reviewsCount > 0 && (
                <span className="text-[10px] text-gray-400">({reviewsCount.toLocaleString()})</span>
            )}
        </div>
    );
}

function HotelStars({ stars }: { stars: number }) {
    if (stars <= 0) return null;
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: stars }).map((_, i) => (
                <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            ))}
        </div>
    );
}

function AmenityChips({ amenities }: { amenities: string[] }) {
    if (amenities.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1.5">
            {amenities.slice(0, 6).map((amenity, i) => {
                const Icon = getAmenityIcon(amenity);
                return (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 text-[10px] font-medium text-gray-500">
                        {Icon && <Icon className="w-3 h-3" />}
                        {amenity}
                    </span>
                );
            })}
        </div>
    );
}

function HotelOptionCard({
    hotel,
    onImageClick
}: {
    hotel: AccommodationOption;
    onImageClick: () => void;
}) {
    return (
        <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-orange-500 overflow-hidden hover:shadow-sm transition-shadow">
            <HotelImageCarousel images={hotel.images} name={hotel.name} onImageClick={onImageClick} />
            <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{hotel.name}</h4>
                            <HotelStars stars={hotel.stars} />
                        </div>
                        {hotel.type && (
                            <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 dark:bg-orange-700 text-gray-700 dark:text-gray-300 text-[10px] font-semibold uppercase tracking-wide">
                                {hotel.type}
                            </span>
                        )}
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-lg font-black text-gray-900 dark:text-white leading-none">
                            {formatPrice(hotel.price_per_night, hotel.currency)}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">por noche</p>
                        {hotel.total_price > 0 && hotel.total_price !== hotel.price_per_night && (
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Total: {formatPrice(hotel.total_price, hotel.currency)}</p>
                        )}
                    </div>
                </div>
                <RatingBadge rating={hotel.rating} reviewsCount={hotel.reviews_count} />
                {hotel.address && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {hotel.address}
                    </p>
                )}
                <AmenityChips amenities={hotel.amenities} />
                {hotel.booking_url && (
                    <a
                        href={hotel.booking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                       bg-black dark:bg-orange-700 hover:bg-gray-800 dark:hover:bg-orange-900 active:bg-gray-700 dark:active:bg-gray-600
                       text-white text-sm font-semibold transition-colors"
                    >
                        Ver disponibilidad
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                )}
            </div>
        </div>
    );
}

/* ─── Main Component ──────────────────────────────────────────── */

export function AccommodationCard({ options }: AccommodationCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState<AccommodationOption | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const bestOption = useMemo(() => options[0] ?? null, [options]);
    const moreOptions = useMemo(() => options.slice(1), [options]);
    const visibleMore = expanded ? moreOptions : moreOptions.slice(0, 2);

    const handleImageClick = (hotel: AccommodationOption) => {
        setSelectedHotel(hotel);
        setModalOpen(true);
    };

    if (!bestOption) return null;

    return (
        <>
            <div className="w-auto bg-white dark:bg-black rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-black dark:to-orange-600 px-5 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-800 dark:bg-gray-700 flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-white uppercase tracking-wide">Alojamiento</p>
                                <p className="text-[11px] text-gray-300 dark:text-gray-400 leading-none">
                                    {bestOption.check_in} → {bestOption.check_out}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-300 dark:text-gray-400 leading-none mb-0.5">Desde</p>
                            <p className="text-xl font-black text-white leading-none">
                                {formatPrice(bestOption.price_per_night, bestOption.currency)}
                            </p>
                            <p className="text-[10px] text-gray-300 dark:text-gray-400">/noche</p>
                        </div>
                    </div>
                </div>

                {/* Options list */}
                <div className="px-5 py-4 space-y-4">
                    <HotelOptionCard hotel={bestOption} onImageClick={() => handleImageClick(bestOption)} />
                    {visibleMore.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {options.length - 1} opcion{options.length - 1 !== 1 ? 'es' : ''} más
                            </p>
                            {visibleMore.map((hotel, i) => (
                                <HotelOptionCard key={i} hotel={hotel} onImageClick={() => handleImageClick(hotel)} />
                            ))}
                        </div>
                    )}
                    {moreOptions.length > 2 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                            className="flex items-center gap-1 text-[10px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            {expanded ? 'Ver menos' : `Ver ${moreOptions.length - 2} más`}
                            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Hotel Detail Modal */}
            <HotelDetailModal
                hotel={selectedHotel}
                open={modalOpen}
                onOpenChange={setModalOpen}
            />
        </>
    );
}
