'use client';

/**
 * chat/page.tsx — 2-phase state machine
 *
 * Phase 1 — chatting:  ChatPanel        (messages but no itinerary)
 * Phase 2 — itinerary: Split view       (itinerary ready)
 *
 * Transitions:
 *   chatting → itinerary: chat panel squishes/fades left, itinerary panel slides right in
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatPanel } from '@/components/chat/ChatPanel';
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

type Phase = 'chatting' | 'itinerary';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const itineraryId = searchParams.get('itinerary');

  const { generatedItinerary, selectedPlace, setSelectedPlace, messages, setGeneratedItinerary, setMessages, setConversationId } = useChatStore();
  const { sendMessage, isLoading } = useChat();
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuth();
  const [, setSelectedDay] = useState(1);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [loadingItinerary, setLoadingItinerary] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  // ── Phase tracking ───────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('chatting');
  // 'entering' = animating into the new phase
  const [animating, setAnimating] = useState(false);
  const prevPhaseRef = useRef<Phase>('chatting');
  const pendingMessageSentRef = useRef(false);

  // ── Load pending message from localStorage on mount ──────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (pendingMessageSentRef.current) return;
    
    const pending = localStorage.getItem('vora_pending_message');
    console.log('🔍 [Mount] Checking for pending message:', pending);
    
    if (pending) {
      console.log('✅ [Mount] Found pending message, setting state');
      setPendingMessage(pending);
      localStorage.removeItem('vora_pending_message');
    }
  }, []);

  // ── Send pending message when user is authenticated ──────────────────────
  useEffect(() => {
    if (!pendingMessage) {
      console.log('⏭️ [Send] No pending message');
      return;
    }
    
    if (pendingMessageSentRef.current) {
      console.log('⏭️ [Send] Already sent, skipping');
      return;
    }
    
    if (!user) {
      console.log('⏳ [Send] Waiting for user authentication...');
      return;
    }
    
    console.log('🚀 [Send] All conditions met, sending message:', pendingMessage);
    pendingMessageSentRef.current = true;
    
    // Small delay to ensure everything is mounted
    const timer = setTimeout(() => {
      console.log('📤 [Send] Executing sendMessage now...');
      sendMessage(pendingMessage);
      setPendingMessage(null);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [pendingMessage, user, sendMessage]);

  // Load itinerary if ID is provided in URL
  useEffect(() => {
    if (itineraryId && !loadingItinerary) {
      setLoadingItinerary(true);
      itinerariesApi.get(itineraryId)
        .then(({ data }) => {
          // Load itinerary data
          setGeneratedItinerary(data.data);

          // If there's a conversation_id, load the conversation
          if (data.conversation_id) {
            setConversationId(data.conversation_id);
            // TODO: Load conversation messages from backend
            // For now, we'll just show the itinerary
          }

          setLoadingItinerary(false);
        })
        .catch((error) => {
          console.error('Error loading itinerary:', error);
          setLoadingItinerary(false);
        });
    }
  }, [itineraryId, setGeneratedItinerary, setConversationId]);

  useEffect(() => {
    const target: Phase = generatedItinerary ? 'itinerary' : 'chatting';

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
  }, [generatedItinerary, phase]);

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
      className="relative w-full overflow-hidden bg-white dark:bg-black"
      style={{ height: 'calc(100vh - 4rem)' }}
    >
      {/* ── PHASE 1: Chat Panel ───────────────────────────────────────── */}
      <div
        className="absolute inset-0 transition-all duration-500 ease-in-out"
        style={{
          opacity: phase === 'chatting' ? 1 : 0,
          transform: phase === 'chatting' ? 'translateX(0)' : 'translateX(-60px)',
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

      {/* ── PHASE 2: Itinerary Split View ─────────────────────────────── */}
      <div
        className="absolute inset-0 flex flex-col md:flex-row transition-all duration-600 ease-in-out"
        style={{
          opacity: phase === 'itinerary' ? 1 : 0,
          transform: phase === 'itinerary' ? 'scale(1)' : 'scale(0.97)',
          pointerEvents: phase === 'itinerary' ? 'auto' : 'none',
          zIndex: phase === 'itinerary' ? 10 : 1,
        }}
      >
        {/* Chat Sidebar — 38% on desktop, hidden on mobile */}
        <div
          className="hidden md:flex flex-shrink-0 border-r border-gray-200 dark:border-gray-700 transition-all duration-500"
          style={{
            width: phase === 'itinerary' ? '38%' : '100%',
            transform: phase === 'itinerary' ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          <ChatSidebar />
        </div>

        {/* Right Panel — 62% on desktop, full width on mobile - Scrollable */}
        <div
          className="flex-1 overflow-y-auto bg-white dark:bg-black transition-all duration-500"
          style={{
            opacity: phase === 'itinerary' ? 1 : 0,
            transform: phase === 'itinerary' ? 'translateX(0)' : 'translateX(40px)',
            transitionDelay: '100ms',
          }}
        >
          {generatedItinerary && (
            <>
              <ItineraryHeader itinerary={generatedItinerary} />

              <div className="h-64 md:h-96 rounded-lg p-4 md:p-10">
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
              <div className="sticky bottom-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row gap-2 md:gap-3">
                <button
                  onClick={handleSaveItinerary}
                  className="flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 bg-black dark:bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
                <button
                  onClick={handleShareItinerary}
                  className="flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </button>
                <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600">
                  <Download className="w-4 h-4" />
                  <span className="sm:inline">Descargar</span>
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
