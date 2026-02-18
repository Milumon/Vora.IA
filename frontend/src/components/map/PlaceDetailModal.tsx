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

const priceLevelLabels = ['Económico', 'Moderado', 'Caro', 'Muy caro'];

export function PlaceDetailModal({ place, open, onOpenChange }: PlaceDetailModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  if (!place) return null;

  const photos = getPlacePhotos(place.photos, 8, 1200);
  const displayPhoto = imageError || !photos.length ? '/placeholder-place.jpg' : photos[currentPhotoIndex];
  const totalPhotos = photos.length;
  const hasMultiplePhotos = totalPhotos > 1;
  const isPlaceholder = photos.length === 1 && photos[0] === '/placeholder-place.jpg';

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
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setCurrentPhotoIndex(0);
        setImageError(false);
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-3xl h-[90vh] overflow-hidden p-0 flex flex-col rounded-2xl">
        {/* Galería de fotos - 50% del modal */}
        <div className="relative w-full h-[50%] min-h-0 shrink-0 bg-muted rounded-t-2xl overflow-hidden">
          <Image
            src={displayPhoto}
            alt={`${place.name} - Foto ${currentPhotoIndex + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
            onError={() => setImageError(true)}
          />

          {/* Controles de navegación */}
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

          {/* Contador de fotos */}
          {hasMultiplePhotos && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <ImageIcon className="h-3 w-3" />
              {currentPhotoIndex + 1} / {totalPhotos}
            </div>
          )}

          {/* Thumbnails */}
          {hasMultiplePhotos && (
            <div className="absolute bottom-3 left-3 flex gap-1.5">
              {photos.slice(0, 5).map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setImageError(false);
                    setCurrentPhotoIndex(idx);
                  }}
                  className={`relative w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${
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
                  />
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

        {/* Contenido - 50% del modal, sin scroll */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-6 rounded-b-2xl">
          <div className="space-y-4 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl">{place.name}</DialogTitle>
            {place.address && (
              <DialogDescription className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                {place.address}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Rating y precio */}
          <div className="flex flex-wrap items-center gap-3">
            {place.rating && (
              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-full">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-sm">{place.rating}</span>
                <span className="text-xs text-muted-foreground">/ 5</span>
              </div>
            )}
            {place.price_level && (
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">
                  {'$'.repeat(place.price_level)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {priceLevelLabels[place.price_level - 1] || ''}
                </span>
              </div>
            )}
            {place.visit_duration && (
              <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-full">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm">{place.visit_duration}</span>
              </div>
            )}
          </div>

          {/* Por qué visitar */}
          {place.why_visit && (
            <div className="bg-muted/50 rounded-lg p-4 border border-border min-w-0">
              <h4 className="font-semibold text-sm mb-1.5">Por qué visitar</h4>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {place.why_visit}
              </p>
            </div>
          )}

          {/* Tipos/categorías */}
          {place.types && place.types.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {place.types.map((type, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {type.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          )}

          {/* Botón Google Maps */}
          <Button
            variant="outline"
            className="w-full gap-2 shrink-0"
            onClick={openInGoogleMaps}
          >
            <ExternalLink className="h-4 w-4" />
            Ver en Google Maps
          </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
