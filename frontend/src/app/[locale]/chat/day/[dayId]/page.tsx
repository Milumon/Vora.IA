'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useChatStore } from '@/store/chatStore';
import { DayDetailView } from '@/components/itinerary/DayDetailView';

export default function DayDetailPage() {
    const params = useParams();
    const router = useRouter();
    const locale = useLocale();
    const { generatedItinerary } = useChatStore();

    const dayId = Number(params?.dayId);

    // Redirect if no itinerary in store (e.g. on page refresh)
    useEffect(() => {
        if (!generatedItinerary) {
            router.replace(`/${locale}/chat`);
        }
    }, [generatedItinerary, router, locale]);

    if (!generatedItinerary) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-muted-foreground text-sm">Redirigiendo…</p>
            </div>
        );
    }

    const day = generatedItinerary.day_plans.find((d) => d.day_number === dayId);

    if (!day) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center space-y-2">
                    <p className="font-semibold">Día no encontrado</p>
                    <p className="text-sm text-muted-foreground">
                        El día {dayId} no existe en este itinerario.
                    </p>
                    <button
                        onClick={() => router.push(`/${locale}/chat`)}
                        className="text-primary text-sm underline"
                    >
                        Volver al itinerario
                    </button>
                </div>
            </div>
        );
    }

    return <DayDetailView day={day} itinerary={generatedItinerary} />;
}
