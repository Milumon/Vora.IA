'use client';

import { useEffect, useState } from 'react';
import { ItineraryCard } from '@/components/itinerary/ItineraryCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Plus, FolderHeart } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { itinerariesApi } from '@/lib/api/endpoints';

export default function ItinerariesPage() {
  const locale = useLocale();
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchItineraries = async () => {
      try {
        const { data } = await itinerariesApi.list();
        if (!cancelled) {
          setItineraries(Array.isArray(data) ? data : []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.detail || err.message || 'Error al cargar itinerarios');
          setItineraries([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchItineraries();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
          <p className="text-destructive">{error}</p>
          <Button asChild size="lg" variant="outline">
            <Link href={`/${locale}/auth/login`}>Iniciar sesión</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (itineraries.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <FolderHeart className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">No tienes itinerarios aún</h2>
            <p className="text-muted-foreground">
              Comienza una conversación con nuestro asistente para crear tu primer itinerario
              personalizado
            </p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link href={`/${locale}/chat`}>
              <Plus className="h-5 w-5" />
              Crear itinerario
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mis Itinerarios</h1>
          <p className="text-muted-foreground mt-1">
            Todos tus planes de viaje en un solo lugar
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href={`/${locale}/chat`}>
            <Plus className="h-4 w-4" />
            Nuevo itinerario
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {itineraries.map((itinerary) => (
          <ItineraryCard key={itinerary.id} itinerary={itinerary} />
        ))}
      </div>
    </div>
  );
}
