import { create } from 'zustand';

/* ─── Mobility types (unified transport model) ─────────────── */

interface MobilityOption {
  provider: string;
  departure_time: string;
  arrival_time: string;
  duration_text: string;
  price: number;
  currency: string;
  service_type: string;
  stops: number;
  booking_url: string;
  distance_km?: number;
  airline_logo?: string;
  carrier_code?: string;
}

interface MobilitySegment {
  origin: string;
  destination: string;
  departure_date: string;
  best_flight: MobilityOption | null;
  best_transit: MobilityOption | null;
  best_drive: MobilityOption | null;
  drive_distance_km: number | null;
  drive_duration_text: string | null;
  drive_duration_seconds: number | null;
  transit_distance_km: number | null;
  transit_duration_text: string | null;
  transit_duration_seconds: number | null;
  flight_options: Record<string, unknown>[];
  transit_options: Record<string, unknown>[];
  recommended_mode: 'flight' | 'bus' | 'drive';
}

/* ─── Accommodation types ───────────────────────────────────── */

interface AccommodationOption {
  name: string;
  type: string;
  price_per_night: number;
  total_price: number;
  currency: string;
  rating: number;
  reviews_count: number;
  stars: number;
  images: string[];
  amenities: string[];
  booking_url: string;
  address: string;
  description: string;
  check_in: string;
  check_out: string;
  check_in_time: string;
  check_out_time: string;
}

/* ─── Place types ───────────────────────────────────────────── */

interface PlaceInfo {
  place_id: string;
  name: string;
  address: string;
  rating?: number;
  price_level?: number;
  types: string[];
  photos: string[];
  location: { lat: number; lng: number };
  visit_duration?: string;
  why_visit?: string;
}

/* ─── Day / Itinerary types ─────────────────────────────────── */

interface DayPlan {
  day_number: number;
  date?: string | null;
  morning: PlaceInfo[];
  afternoon: PlaceInfo[];
  evening: PlaceInfo[];
  notes: string;
  day_summary?: string;
  /** Unified mobility data (replaces old bus_transfer) */
  mobility?: MobilitySegment;
  /** Accommodation options for this day */
  accommodation?: AccommodationOption[];
  /** @deprecated — backward compat for old itineraries */
  bus_transfer?: Record<string, unknown>;
}

interface Itinerary {
  title: string;
  description: string;
  day_plans: DayPlan[];
  tips: string[];
  estimated_budget: string;
}

/* ─── Message types ─────────────────────────────────────────── */

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    needsClarification?: boolean;
    clarificationQuestions?: string[];
    progressSteps?: Array<{
      id: string;
      label: string;
      completed: boolean;
      active: boolean;
    }>;
  };
}

/* ─── Store ──────────────────────────────────────────────────── */

interface ChatState {
  messages: Message[];
  conversationId: string | null;
  isLoading: boolean;
  currentProgress: Array<{
    id: string;
    label: string;
    completed: boolean;
    active: boolean;
  }> | null;
  generatedItinerary: Itinerary | null;
  showMapView: boolean;
  selectedPlace: PlaceInfo | null;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setConversationId: (id: string) => void;
  setIsLoading: (loading: boolean) => void;
  setCurrentProgress: (progress: ChatState['currentProgress']) => void;
  setGeneratedItinerary: (itinerary: Itinerary) => void;
  updateItinerary: (itinerary: Itinerary) => void;
  setSelectedPlace: (place: PlaceInfo | null) => void;
  resetMapView: () => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  conversationId: null,
  isLoading: false,
  currentProgress: null,
  generatedItinerary: null,
  showMapView: false,
  selectedPlace: null,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setConversationId: (id) => set({ conversationId: id }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setCurrentProgress: (progress) => set({ currentProgress: progress }),
  setGeneratedItinerary: (itinerary) =>
    set({ generatedItinerary: itinerary, showMapView: true }),
  updateItinerary: (itinerary) =>
    set({ generatedItinerary: itinerary }),
  setSelectedPlace: (place) => set({ selectedPlace: place }),
  resetMapView: () =>
    set({ showMapView: false, generatedItinerary: null, selectedPlace: null }),
  clearChat: () =>
    set({
      messages: [],
      conversationId: null,
      currentProgress: null,
      generatedItinerary: null,
      showMapView: false,
      selectedPlace: null,
    }),
}));

export type { Itinerary, DayPlan, PlaceInfo, MobilitySegment, MobilityOption, AccommodationOption };
