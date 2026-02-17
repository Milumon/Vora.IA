export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  itinerary_id?: string;
  places?: string[];
  suggestions?: string[];
}

export interface Conversation {
  id: string;
  user_id: string;
  itinerary_id?: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}
