'use client';

/**
 * chat/page.tsx — 3-phase state machine
 *
 * Phase 1 — hero:      VoraHeroLanding   (no messages)
 * Phase 2 — chatting:  ChatPanel         (messages but no itinerary)
 * Phase 3 — itinerary: Split view        (itinerary ready)
 *
 * Transitions:
 *   hero → chatting:   hero slides up & fades out, chat panel slides up from below
 *   chatting → itinerary: chat panel squishes/fades left, itinerary panel slides right in
 */

import { useState, useEffect, useRef } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { VoraHeroLanding } from '@/components/chat/VoraHeroLanding';
import { ItineraryHeader } from '@/components/itinerary/ItineraryHeader';
import { CompactMapPreview } from '@/components/map/views/CompactMapPreview';
import { DayTimelineVertical } from '@/components/itinerary/DayTimelineVertical';
import { FullMapModal } from '@/components/map/views/FullMapModal';
import { useChatStore } from '@/store/chatStore';
import { useChat } from '@/hooks/useChat';
import { Save, Share2, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { itinerariesApi } from '@/lib/api/endpoints';
import { useAuth } from '@/components/providers/AuthProvider';

type Phase = 'hero' | 'chatting' | 'itinerary';

export default function ChatPage() {
  const { generatedItinerary, selectedPlace, setSelectedPlace, messages } = useChatStore();
  const { sendMessage, isLoading } = useChat();
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuth();
  const [, setSelectedDay] = useState(1);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // ── Phase tracking ───────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('hero');
  // 'entering' = animating into the new phase
  const [animating, setAnimating] = useState(false);
  const prevPhaseRef = useRef<Phase>('hero');

  useEffect(() => {
    const target: Phase = generatedItinerary
      ? 'itinerary'
      : messages.length > 0
        ? 'chatting'
        : 'hero';

    if (target !== phase) {
      setAnimating(true);
      // Small delay lets CSS read the initial state before adding the active class
      const t = setTimeout(() => {
        prevPhaseRef.current = phase;
        setPhase(target);
        // Remove animation flag after transition completes
        const t2 = setTimeout(() => setAnimating(false), 600);
        return () => clearTimeout(t2);
      }, 50);
      return () => clearTimeout(t);
    }
  }, [messages.length, generatedItinerary]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save / Share ─────────────────────────────────────────────────────────
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
        destination:
          (generatedItinerary as any).destination ||
          generatedItinerary.day_plans?.[0]?.morning?.[0]?.address ||
          'Perú',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(
          Date.now() + generatedItinerary.day_plans.length * 24 * 60 * 60 * 1000,
        )
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
      const msg = error.response?.data?.detail || error.message || 'Error al guardar';
      alert(`Error al guardar el itinerario: ${msg}`);
    }
  };

  const handleShareItinerary = () => {
    if (navigator.share && generatedItinerary) {
      navigator
        .share({
          title: generatedItinerary.title,
          text: generatedItinerary.description,
          url: window.location.href,
        })
        .catch(() => { });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace copiado al portapapeles!');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="relative w-full overflow-hidden bg-black"
      style={{ height: 'calc(100vh - 4rem)' }}
    >
      {/* ── PHASE 1: Hero ─────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 transition-all duration-500 ease-in-out"
        style={{
          opacity: phase === 'hero' ? 1 : 0,
          transform: phase === 'hero' ? 'translateY(0)' : 'translateY(-40px)',
          pointerEvents: phase === 'hero' ? 'auto' : 'none',
          zIndex: phase === 'hero' ? 10 : 1,
        }}
      >
        <VoraHeroLanding onSendMessage={sendMessage} isLoading={isLoading} />
      </div>

      {/* ── PHASE 2: Chat Panel ───────────────────────────────────────── */}
      <div
        className="absolute inset-0 transition-all duration-500 ease-in-out"
        style={{
          opacity: phase === 'chatting' ? 1 : 0,
          transform:
            phase === 'chatting'
              ? 'translateY(0)'
              : prevPhaseRef.current === 'hero' || phase === 'hero'
                ? 'translateY(30px)'
                : 'translateX(-60px)',
          pointerEvents: phase === 'chatting' ? 'auto' : 'none',
          zIndex: phase === 'chatting' ? 10 : 1,
        }}
      >
        <ChatPanel
          messages={messages as any}
          isLoading={isLoading}
          onSendMessage={sendMessage}
        />
      </div>

      {/* ── PHASE 3: Itinerary Split View ─────────────────────────────── */}
      <div
        className="absolute inset-0 flex transition-all duration-600 ease-in-out"
        style={{
          opacity: phase === 'itinerary' ? 1 : 0,
          transform: phase === 'itinerary' ? 'scale(1)' : 'scale(0.97)',
          pointerEvents: phase === 'itinerary' ? 'auto' : 'none',
          zIndex: phase === 'itinerary' ? 10 : 1,
        }}
      >
        {/* Chat Sidebar — 38% */}
        <div
          className="flex-shrink-0 border-r border-gray-200 transition-all duration-500"
          style={{
            width: phase === 'itinerary' ? '38%' : '100%',
            transform: phase === 'itinerary' ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          <ChatSidebar />
        </div>

        {/* Right Panel — 62% - Scrollable */}
        <div
          className="flex-1 overflow-y-auto bg-white transition-all duration-500"
          style={{
            opacity: phase === 'itinerary' ? 1 : 0,
            transform: phase === 'itinerary' ? 'translateX(0)' : 'translateX(40px)',
            transitionDelay: '100ms',
          }}
        >
          {generatedItinerary && (
            <>
              <ItineraryHeader itinerary={generatedItinerary} />

              <div className="h-96 rounded-lg p-10">
                <CompactMapPreview
                  itinerary={generatedItinerary}
                  onOpenFullMap={() => setIsMapModalOpen(true)}
                />
              </div>

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
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors border border-gray-300">
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Full map modal — always mounted, lives outside the phase layers */}
      {generatedItinerary && (
        <FullMapModal
          itinerary={generatedItinerary}
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          selectedPlace={selectedPlace}
          onPlaceSelect={setSelectedPlace}
        />
      )}
    </div>
  );
}
