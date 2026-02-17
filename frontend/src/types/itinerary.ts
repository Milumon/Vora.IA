export interface Itinerary {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  destination: string;
  start_date?: string;
  end_date?: string;
  days: number;
  budget?: 'low' | 'medium' | 'high';
  travel_style?: string;
  status: 'draft' | 'published' | 'archived';
  data: ItineraryData;
  created_at: string;
  updated_at: string;
}

export interface ItineraryData {
  days: DayItinerary[];
  summary?: string;
  total_budget?: number;
}

export interface DayItinerary {
  day: number;
  date?: string;
  activities: Activity[];
}

export interface Activity {
  time: string;
  place: Place;
  description: string;
  duration?: number;
}

export interface Place {
  place_id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  photos?: string[];
  types?: string[];
}
