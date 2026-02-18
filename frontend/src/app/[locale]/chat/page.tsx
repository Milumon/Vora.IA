'use client';

import { ChatInterface } from '@/components/chat/ChatInterface';
import { InteractiveMapView } from '@/components/map/InteractiveMapView';
import { useChatStore } from '@/store/chatStore';

export default function ChatPage() {
  const { showMapView, generatedItinerary, selectedPlace, setSelectedPlace } = useChatStore();

  if (!showMapView || !generatedItinerary) {
    // Vista simple: solo chat
    return (
      <div className="h-[calc(100vh-4rem)]">
        <ChatInterface />
      </div>
    );
  }

  // Vista de dos columnas: chat + mapa
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Chat - Columna Izquierda */}
      <div className="w-full lg:w-1/2 border-r border-border animate-slide-in-left">
        <ChatInterface />
      </div>

      {/* Mapa - Columna Derecha */}
      <div className="hidden lg:block lg:w-1/2 animate-slide-in-right">
        <InteractiveMapView
          itinerary={generatedItinerary}
          selectedPlace={selectedPlace}
          onPlaceSelect={setSelectedPlace}
        />
      </div>
    </div>
  );
}
