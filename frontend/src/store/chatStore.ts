import { create } from 'zustand';

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

interface DayPlan {
  day_number: number;
  date?: string | null;
  morning: PlaceInfo[];
  afternoon: PlaceInfo[];
  evening: PlaceInfo[];
  notes: string;
}

interface Itinerary {
  title: string;
  description: string;
  day_plans: DayPlan[];
  tips: string[];
  estimated_budget: string;
}

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

export type { Itinerary, DayPlan, PlaceInfo };
