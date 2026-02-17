export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  locale?: 'es' | 'en';
  theme?: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
}

export interface Profile extends User {
  preferences?: UserPreferences;
}

export interface UserPreferences {
  travel_style?: string[];
  budget_range?: 'low' | 'medium' | 'high';
  interests?: string[];
  dietary_restrictions?: string[];
}
