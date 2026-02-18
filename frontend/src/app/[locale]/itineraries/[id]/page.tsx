'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ItineraryDetail } from '@/components/itinerary/ItineraryDetail';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ItineraryDetailPage() {
  const params = useParams();
  const [itinerary, setItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch itinerary from API
    // For now, show loading
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
          <h2 className="text-2xl font-bold">Itinerario no encontrado</h2>
          <p className="text-muted-foreground">
            El itinerario que buscas no existe o ha sido eliminado
          </p>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/itineraries">
              <ArrowLeft className="h-4 w-4" />
              Volver a mis itinerarios
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-border-subtle bg-background/95 backdrop-blur sticky top-16 z-40">
        <div className="container mx-auto px-4 py-3">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/itineraries">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
        </div>
      </div>
      <ItineraryDetail itinerary={itinerary} />
    </>
  );
}
