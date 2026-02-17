## Fase 3: Frontend y UX (Semana 6-8)

### 3.1 Componentes Base y UI Kit

**Día 31-33: Setup de Shadcn/ui y Componentes Base**

- [ ] Instalar componentes necesarios de Shadcn/ui
- [ ] Crear componentes de layout (Header, Footer, Sidebar)
- [ ] Implementar ThemeToggle y LocaleSwitcher
- [ ] Crear componentes de formularios con react-hook-form
- [ ] Implementar sistema de notificaciones/toasts
- [ ] Crear LoadingSpinner y skeleton loaders

```bash
# Instalar componentes de Shadcn/ui
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add skeleton
```

**Header con tema e i18n:**
```typescript
// src/components/layout/Header.tsx
'use client';

import { useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export function Header() {
  const t = useTranslations('common');
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            ViajesPeru.AI
          </span>
        </Link>

        <nav className="flex items-center space-x-4">
          {user ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/chat">{t('navigation.chat')}</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/itineraries">{t('navigation.myTrips')}</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/profile">{t('navigation.profile')}</Link>
              </Button>
              <Button variant="outline" onClick={signOut}>
                {t('auth.signOut')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/login">{t('auth.login')}</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">{t('auth.register')}</Link>
              </Button>
            </>
          )}
          
          <LocaleSwitcher />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
```

### 3.2 Sistema de Autenticación

**Día 34-36: Páginas de Auth y Providers**

- [ ] Crear páginas de Login y Register
- [ ] Implementar AuthProvider con Supabase Auth
- [ ] Agregar middleware de autenticación en Next.js
- [ ] Implementar manejo de sesiones
- [ ] Agregar recuperación de contraseña
- [ ] Proteger rutas privadas

```typescript
// src/components/providers/AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### 3.3 Interfaz de Chat

**Día 37-40: Componente de Chat Conversacional**

- [ ] Crear ChatInterface con lista de mensajes
- [ ] Implementar MessageBubble con soporte para markdown
- [ ] Agregar MessageInput con autocompletar
- [ ] Implementar TypingIndicator
- [ ] Agregar scroll automático a nuevos mensajes
- [ ] Implementar streaming de respuestas (opcional)
- [ ] Agregar sugerencias de preguntas iniciales

```typescript
// src/components/chat/ChatInterface.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

const SUGGESTED_PROMPTS = [
  'Quiero ir a Cusco 5 días con presupuesto medio',
  'Planifica un viaje romántico a Arequipa',
  'Destinos de aventura en Perú para 1 semana',
  'Viaje familiar a playas del norte peruano'
];

export function ChatInterface() {
  const t = useTranslations('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage, threadId } = useChat();
  const [showSuggestions, setShowSuggestions] = useState(messages.length === 0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSuggestionClick = (prompt: string) => {
    setShowSuggestions(false);
    sendMessage(prompt);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-bold mb-4">
              {t('welcome')}
            </h2>
            <p className="text-muted-foreground mb-8">
              {t('welcomeDescription')}
            </p>
            
            {showSuggestions && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="h-auto py-4 px-6 text-left whitespace-normal"
                    onClick={() => handleSuggestionClick(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((message, idx) => (
              <MessageBubble key={idx} message={message} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <MessageInput
          onSendMessage={sendMessage}
          disabled={isLoading}
          placeholder={t('inputPlaceholder')}
        />
      </div>
    </div>
  );
}
```

### 3.4 Visualización de Itinerarios

**Día 41-44: Componentes de Itinerario**

- [ ] Crear ItineraryCard para lista de itinerarios
- [ ] Implementar ItineraryDetail con vista completa
- [ ] Crear DayTimeline para vista día a día
- [ ] Implementar PlaceCard con fotos y detalles
- [ ] Agregar GoogleMapView con marcadores
- [ ] Implementar exportación a PDF (opcional)

```typescript
// src/components/itinerary/ItineraryDetail.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DayTimeline } from './DayTimeline';
import { GoogleMapView } from '@/components/map/GoogleMapView';
import { CalendarDays, DollarSign, Users, MapPin } from 'lucide-react';
import type { Itinerary } from '@/types/itinerary';

interface ItineraryDetailProps {
  itinerary: Itinerary;
}

export function ItineraryDetail({ itinerary }: ItineraryDetailProps) {
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">{itinerary.title}</h1>
        <p className="text-muted-foreground text-lg">{itinerary.description}</p>
      </div>

      {/* Metadata */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{itinerary.destination}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <span>{itinerary.days} días</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <Badge variant="outline">{itinerary.budget}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span>{itinerary.travelers} viajeros</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapa */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa del Recorrido</CardTitle>
        </CardHeader>
        <CardContent>
          <GoogleMapView
            places={itinerary.data.day_plans.flatMap(d => [
              ...d.morning,
              ...d.afternoon,
              ...d.evening
            ])}
            showRoute
          />
        </CardContent>
      </Card>

      {/* Timeline de días */}
      <div className="space-y-6">
        {itinerary.data.day_plans.map((day, idx) => (
          <DayTimeline key={idx} day={day} dayNumber={idx + 1} />
        ))}
      </div>

      {/* Tips */}
      {itinerary.data.tips && (
        <Card>
          <CardHeader>
            <CardTitle>Consejos para tu viaje</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {itinerary.data.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### 3.5 Integración de Google Maps

**Día 45-48: Componente de Mapa Interactivo**

- [ ] Instalar @googlemaps/js-api-loader
- [ ] Crear wrapper de Google Maps
- [ ] Implementar marcadores para lugares
- [ ] Agregar polylines para rutas
- [ ] Implementar InfoWindow para detalles
- [ ] Agregar controles de zoom y centrado

```typescript
// src/components/map/GoogleMapView.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import type { PlaceInfo } from '@/types/itinerary';

interface GoogleMapViewProps {
  places: PlaceInfo[];
  showRoute?: boolean;
  center?: { lat: number; lng: number };
  zoom?: number;
}

export function GoogleMapView({
  places,
  showRoute = false,
  center,
  zoom = 12
}: GoogleMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        version: 'weekly',
      });

      await loader.load();

      if (!mapRef.current) return;

      const mapCenter = center || (places[0] ? places[0].location : { lat: -12.0464, lng: -77.0428 });

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: zoom,
        styles: [], // Agregar custom styles si quieres
      });

      setMap(mapInstance);
    };

    initMap();
  }, []);

  useEffect(() => {
    if (!map || places.length === 0) return;

    // Limpiar marcadores anteriores
    markers.forEach(m => m.setMap(null));

    // Crear nuevos marcadores
    const newMarkers = places.map((place, idx) => {
      const marker = new google.maps.Marker({
        position: place.location,
        map: map,
        title: place.name,
        label: (idx + 1).toString(),
      });

      // InfoWindow al hacer click
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-bold">${place.name}</h3>
            <p class="text-sm text-gray-600">${place.address}</p>
            ${place.rating ? `<p class="text-sm">⭐ ${place.rating}</p>` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Ajustar bounds para mostrar todos los marcadores
    const bounds = new google.maps.LatLngBounds();
    places.forEach(place => bounds.extend(place.location));
    map.fitBounds(bounds);

    // Dibujar ruta si está habilitado
    if (showRoute && places.length > 1) {
      const path = places.map(p => p.location);
      new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#4F46E5',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: map,
      });
    }
  }, [map, places, showRoute]);

  return (
    <div
      ref={mapRef}
      className="w-full h-[500px] rounded-lg"
    />
  );
}
```

**Deliverables de Fase 3:**
- ✅ UI completa con tema claro/oscuro
- ✅ Sistema de autenticación funcional
- ✅ Interfaz de chat conversacional
- ✅ Visualización de itinerarios con mapas
- ✅ Responsive en mobile y desktop
- ✅ i18n funcionando (ES/EN)

---