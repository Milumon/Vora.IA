'use client';

import { useState } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ItineraryHeader } from '@/components/itinerary/ItineraryHeader';
import { CompactMapPreview } from '@/components/map/CompactMapPreview';
import { DayTimelineVertical } from '@/components/itinerary/DayTimelineVertical';
import { FullMapModal } from '@/components/map/FullMapModal';
import { useChatStore } from '@/store/chatStore';
import { Save, Share2, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { itinerariesApi } from '@/lib/api/endpoints';
import { useAuth } from '@/components/providers/AuthProvider';

export default function ChatPage() {
  const { generatedItinerary, selectedPlace, setSelectedPlace } = useChatStore();
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuth();
  const [, setSelectedDay] = useState(1);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const handleSaveItinerary = async () => {
    if (!generatedItinerary) return;
    if (!user) {
      alert('Debes iniciar sesión para guardar itinerarios.');
      router.push(`/${locale}/auth/login`);
      return;
    }

    try {
      const response = await itinerariesApi.create({
        title: generatedItinerary.title,
        description: generatedItinerary.description,
        destination: (generatedItinerary as any).destination || generatedItinerary.day_plans?.[0]?.morning?.[0]?.address || 'Perú',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + generatedItinerary.day_plans.length * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        days: generatedItinerary.day_plans.length,
        budget: (generatedItinerary as any).budget || 'medium',
        travel_style: Array.isArray((generatedItinerary as any).travel_style)
          ? (generatedItinerary as any).travel_style?.join(', ')
          : (generatedItinerary as any).travel_style,
        travelers: (generatedItinerary as any).travelers || 1,
        data: generatedItinerary,
      });

      alert('¡Itinerario guardado exitosamente!');
      router.push(`/${locale}/itineraries/${response.data.id}`);
    } catch (error: any) {
      console.error('Error guardando itinerario:', error);
      const msg = error.response?.data?.detail || error.message || 'Error al guardar';
      alert(`Error al guardar el itinerario: ${msg}`);
    }
  };

  const handleShareItinerary = () => {
    if (navigator.share && generatedItinerary) {
      navigator.share({
        title: generatedItinerary.title,
        text: generatedItinerary.description,
        url: window.location.href,
      }).catch((error) => console.log('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace copiado al portapapeles!');
    }
  };

  if (!generatedItinerary) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-white">
        <ChatSidebar />
      </div>
    );
  }



  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white">
      {/* Chat Sidebar - 40% */}
      <div className="w-[40%] flex-shrink-0 border-r border-gray-200">
        <ChatSidebar />
      </div>

      {/* Right Panel - 60% - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Header del itinerario */}
        <ItineraryHeader itinerary={generatedItinerary} />

        {/* Mapa compacto */}
        <div className="h-96 border-ld  rounded-lg p-10">
          <CompactMapPreview
            itinerary={generatedItinerary}
            onOpenFullMap={() => setIsMapModalOpen(true)}
          />
        </div>

        {/* Vertical day timeline */}
        <DayTimelineVertical
          itinerary={generatedItinerary}
          onDaySelect={setSelectedDay}
          onPlaceClick={setSelectedPlace}
        />

        {/* Action buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={handleSaveItinerary}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
          <button
            onClick={handleShareItinerary}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors border border-gray-300"
          >
            <Share2 className="w-4 h-4" />
            Compartir
          </button>
          <button
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors border border-gray-300"
          >
            <Download className="w-4 h-4" />
            Descargar
          </button>
        </div>
      </div>

      {/* Modal de mapa completo */}
      <FullMapModal
        itinerary={generatedItinerary}
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        selectedPlace={selectedPlace}
        onPlaceSelect={setSelectedPlace}
      />
    </div>
  );
}
