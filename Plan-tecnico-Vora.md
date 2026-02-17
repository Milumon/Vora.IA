# Plan de Trabajo Técnico - Plataforma de Agente de Viajes IA para Perú

## 📋 Índice
1. [Visión General del Proyecto](#visión-general-del-proyecto)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Fase 1: Configuración Inicial (Semana 1-2)](#fase-1-configuración-inicial)
5. [Fase 2: Backend y Agentes IA (Semana 3-5)](#fase-2-backend-y-agentes-ia)
6. [Fase 3: Frontend y UX (Semana 6-8)](#fase-3-frontend-y-ux)
7. [Fase 4: Integración y Testing (Semana 9-10)](#fase-4-integración-y-testing)
8. [Fase 5: Deploy y Optimización (Semana 11-12)](#fase-5-deploy-y-optimización)
9. [Consideraciones de Seguridad](#consideraciones-de-seguridad)
10. [Checklist de Buenas Prácticas](#checklist-de-buenas-prácticas)

---

## Visión General del Proyecto

**Nombre del proyecto:** ViajesPeru.AI (nombre tentativo)

**Descripción:** Plataforma de planificación de viajes impulsada por IA, especializada en turismo interno peruano, con agentes conversacionales que generan itinerarios personalizados utilizando datos reales de lugares y mapas.

**Stack Tecnológico:**
- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Shadcn/ui
- **Backend:** FastAPI (Python 3.11+), LangChain, LangGraph
- **Base de Datos:** Supabase (PostgreSQL + Auth + Storage)
- **IA:** OpenAI GPT-4o, Google Places/Maps API (GCP)
- **Deploy:** Vercel (Frontend), Railway (Backend)
- **Otros:** i18n (ES/EN), Tema claro/oscuro, Rate limiting, Monitoring

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
│  Next.js 14 + TypeScript + Tailwind + Shadcn/ui (Vercel)      │
│  ├─ App Router (RSC + Server Actions)                          │
│  ├─ i18n (next-intl)                                           │
│  ├─ Theme Provider (next-themes)                               │
│  └─ State Management (Zustand + React Query)                   │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTPS/WebSocket
┌────────────────────▼────────────────────────────────────────────┐
│                         API GATEWAY                             │
│              FastAPI + CORS + Rate Limiting                     │
│                      (Railway)                                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼──────┐ ┌──▼────────────────────┐
│ LangGraph    │ │ Google  │ │   Supabase            │
│ Agents       │ │ APIs    │ │   ├─ PostgreSQL       │
│ ├─Orchestr.  │ │ ├─Places│ │   ├─ Auth (JWT)       │
│ ├─Itinerary  │ │ ├─Maps  │ │   ├─ Storage          │
│ └─Refinement │ │ └─Routes│ │   └─ Real-time        │
└──────┬───────┘ └─────────┘ └───────────────────────┘
       │
┌──────▼──────────┐
│   OpenAI API    │
│   GPT-4o        │
└─────────────────┘
```

---

## Estructura del Proyecto

### Backend (`backend/`)

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI app principal
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py              # Pydantic Settings (env vars)
│   │   ├── logging.py               # Configuración de logs
│   │   └── security.py              # CORS, rate limiting, JWT
│   ├── core/
│   │   ├── __init__.py
│   │   ├── dependencies.py          # Dependencias inyectables
│   │   ├── exceptions.py            # Custom exceptions
│   │   └── middleware.py            # Middlewares personalizados
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── state.py                 # TypedDict para estado compartido
│   │   ├── graph.py                 # LangGraph workflow principal
│   │   ├── nodes/
│   │   │   ├── __init__.py
│   │   │   ├── intent_classifier.py
│   │   │   ├── preference_extractor.py
│   │   │   ├── place_searcher.py
│   │   │   ├── itinerary_builder.py
│   │   │   └── refinement_handler.py
│   │   ├── tools/
│   │   │   ├── __init__.py
│   │   │   ├── google_places.py     # Google Places API wrapper
│   │   │   ├── google_maps.py       # Google Maps/Routes API
│   │   │   └── openai_utils.py      # OpenAI helpers
│   │   └── prompts/
│   │       ├── __init__.py
│   │       ├── templates.py         # Prompt templates
│   │       └── examples.py          # Few-shot examples
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py            # Router principal v1
│   │   │   ├── endpoints/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── chat.py          # POST /chat (conversación)
│   │   │   │   ├── itineraries.py   # CRUD itinerarios
│   │   │   │   ├── places.py        # GET /places (búsqueda)
│   │   │   │   └── auth.py          # Login/Register/Refresh
│   │   │   └── schemas/
│   │   │       ├── __init__.py
│   │   │       ├── chat.py          # Pydantic models para chat
│   │   │       ├── itinerary.py
│   │   │       ├── place.py
│   │   │       └── user.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── supabase_client.py       # Cliente Supabase
│   │   ├── auth_service.py          # Lógica de autenticación
│   │   ├── itinerary_service.py     # Lógica de negocio itinerarios
│   │   └── cache_service.py         # Redis/in-memory cache
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                  # SQLAlchemy/Pydantic models
│   │   ├── itinerary.py
│   │   ├── conversation.py
│   │   └── place.py
│   └── utils/
│       ├── __init__.py
│       ├── validators.py            # Validadores custom
│       ├── formatters.py            # Formateo de respuestas
│       └── constants.py             # Constantes del sistema
├── tests/
│   ├── __init__.py
│   ├── conftest.py                  # Fixtures pytest
│   ├── unit/
│   │   ├── test_agents.py
│   │   ├── test_tools.py
│   │   └── test_services.py
│   ├── integration/
│   │   ├── test_api.py
│   │   └── test_workflows.py
│   └── e2e/
│       └── test_full_flow.py
├── alembic/                         # Migraciones DB
│   ├── versions/
│   └── env.py
├── .env.example
├── .env.local
├── requirements.txt
├── pyproject.toml                   # Poetry/Ruff config
├── Dockerfile
├── railway.json                     # Railway config
└── README.md
```

### Frontend (`frontend/`)

```
frontend/
├── public/
│   ├── locales/
│   │   ├── es/
│   │   │   ├── common.json
│   │   │   ├── chat.json
│   │   │   └── itinerary.json
│   │   └── en/
│   │       ├── common.json
│   │       ├── chat.json
│   │       └── itinerary.json
│   └── assets/
│       └── images/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx           # Root layout con providers
│   │   │   ├── page.tsx             # Landing page
│   │   │   ├── chat/
│   │   │   │   └── page.tsx         # Chat interface
│   │   │   ├── itineraries/
│   │   │   │   ├── page.tsx         # Lista de itinerarios
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     # Detalle itinerario
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── register/
│   │   │   │       └── page.tsx
│   │   │   └── profile/
│   │   │       └── page.tsx
│   │   ├── api/                     # Server actions / Route handlers
│   │   │   ├── chat/
│   │   │   │   └── route.ts
│   │   │   └── auth/
│   │   │       └── route.ts
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                      # Shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ... (otros de shadcn)
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── chat/
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── TypingIndicator.tsx
│   │   ├── itinerary/
│   │   │   ├── ItineraryCard.tsx
│   │   │   ├── ItineraryDetail.tsx
│   │   │   ├── DayTimeline.tsx
│   │   │   └── PlaceCard.tsx
│   │   ├── map/
│   │   │   ├── GoogleMapView.tsx
│   │   │   ├── RouteRenderer.tsx
│   │   │   └── PlaceMarker.tsx
│   │   ├── providers/
│   │   │   ├── ThemeProvider.tsx
│   │   │   ├── QueryProvider.tsx
│   │   │   ├── AuthProvider.tsx
│   │   │   └── I18nProvider.tsx
│   │   └── shared/
│   │       ├── LocaleSwitcher.tsx
│   │       ├── ThemeToggle.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts            # Axios/Fetch wrapper
│   │   │   ├── endpoints.ts         # API endpoints
│   │   │   └── types.ts             # TypeScript types para API
│   │   ├── supabase/
│   │   │   ├── client.ts            # Supabase browser client
│   │   │   └── server.ts            # Supabase server client
│   │   ├── utils/
│   │   │   ├── cn.ts                # className utils
│   │   │   ├── formatters.ts
│   │   │   └── validators.ts
│   │   └── constants.ts
│   ├── hooks/
│   │   ├── useChat.ts
│   │   ├── useItinerary.ts
│   │   ├── useAuth.ts
│   │   ├── useTheme.ts
│   │   └── useMediaQuery.ts
│   ├── store/
│   │   ├── chatStore.ts             # Zustand store
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   ├── types/
│   │   ├── chat.ts
│   │   ├── itinerary.ts
│   │   ├── user.ts
│   │   └── global.d.ts
│   └── middleware.ts                # Next.js middleware (i18n, auth)
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Fase 1: Configuración Inicial (Semana 1-2)

### 1.1 Setup de Infraestructura Base

**Día 1-2: Configuración de Repositorio y Herramientas**

- [ ] Crear repositorio Git (monorepo o multi-repo)
- [ ] Configurar `.gitignore` para Python y Node.js
- [ ] Setup de pre-commit hooks (black, ruff, prettier, eslint)
- [ ] Configurar EditorConfig para consistencia
- [ ] Documentar README.md inicial con instrucciones de setup

**Herramientas recomendadas:**
```bash
# Backend
pip install black ruff mypy pytest pytest-cov
pip install pre-commit

# Frontend
npm install -D prettier eslint-config-next @typescript-eslint/parser
npm install -D husky lint-staged
```

### 1.2 Backend Base (FastAPI)

**Día 3-4: Estructura Base de FastAPI**

- [ ] Crear proyecto FastAPI con estructura modular
- [ ] Configurar Poetry o pip-tools para dependencias
- [ ] Implementar `config/settings.py` con Pydantic Settings
- [ ] Setup de logging estructurado (structlog o loguru)
- [ ] Crear `main.py` con configuración CORS
- [ ] Implementar middleware de rate limiting (slowapi)
- [ ] Configurar pytest con fixtures básicos

**Dependencias core:**
```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.6.0
pydantic-settings==2.1.0
python-dotenv==1.0.0
slowapi==0.1.9
supabase==2.3.0
langchain==0.1.6
langgraph==0.0.20
langchain-openai==0.0.5
httpx==0.26.0
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
```

**Código inicial de `main.py`:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config.settings import get_settings
from app.api.v1.router import api_router

settings = get_settings()
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="ViajesPeru.AI API",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Router principal
app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### 1.3 Supabase Setup

**Día 5-6: Configuración de Base de Datos y Auth**

- [ ] Crear proyecto en Supabase
- [ ] Diseñar schema de base de datos (ver abajo)
- [ ] Crear migraciones SQL iniciales
- [ ] Configurar Row Level Security (RLS)
- [ ] Setup de Auth providers (Email/Password mínimo)
- [ ] Crear cliente Supabase en backend
- [ ] Implementar servicio de autenticación

**Schema de base de datos:**

```sql
-- Usuarios (extendido de auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    locale TEXT DEFAULT 'es',
    theme TEXT DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itinerarios
CREATE TABLE public.itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    destination TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    days INTEGER NOT NULL,
    budget TEXT, -- 'low', 'medium', 'high'
    travel_style TEXT, -- 'adventure', 'relaxed', 'cultural', etc.
    status TEXT DEFAULT 'draft', -- 'draft', 'published', 'archived'
    data JSONB NOT NULL, -- Estructura completa del itinerario
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversaciones (para persistencia de chat)
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    itinerary_id UUID REFERENCES public.itineraries(id) ON DELETE CASCADE,
    messages JSONB NOT NULL DEFAULT '[]',
    state JSONB, -- Estado del LangGraph
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lugares favoritos (opcional para MVP)
CREATE TABLE public.favorite_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    place_id TEXT NOT NULL, -- Google Place ID
    place_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, place_id)
);

-- Índices
CREATE INDEX idx_itineraries_user_id ON public.itineraries(user_id);
CREATE INDEX idx_itineraries_created_at ON public.itineraries(created_at DESC);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_itinerary_id ON public.conversations(itinerary_id);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_places ENABLE ROW LEVEL SECURITY;

-- Profiles: usuarios solo ven su propio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Itineraries: usuarios solo ven/editan sus itinerarios
CREATE POLICY "Users can view own itineraries" ON public.itineraries
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own itineraries" ON public.itineraries
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own itineraries" ON public.itineraries
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own itineraries" ON public.itineraries
    FOR DELETE USING (auth.uid() = user_id);

-- Conversations: similar a itineraries
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_itineraries_updated_at BEFORE UPDATE ON public.itineraries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 1.4 Frontend Base (Next.js)

**Día 7-10: Setup de Next.js 14 con TypeScript**

- [ ] Crear proyecto Next.js 14 con App Router
- [ ] Configurar TypeScript estricto
- [ ] Instalar y configurar Tailwind CSS
- [ ] Setup de Shadcn/ui (npx shadcn-ui@latest init)
- [ ] Configurar next-intl para i18n
- [ ] Configurar next-themes para tema claro/oscuro
- [ ] Crear providers iniciales (Theme, I18n, QueryClient)
- [ ] Setup de Zustand para state management
- [ ] Configurar ESLint y Prettier

**Dependencias core:**
```json
{
  "dependencies": {
    "next": "14.1.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "typescript": "5.3.3",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/auth-helpers-nextjs": "^0.9.0",
    "next-intl": "^3.5.0",
    "next-themes": "^0.2.1",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.5",
    "zod": "^3.22.4",
    "react-hook-form": "^7.49.3",
    "@hookform/resolvers": "^3.3.4",
    "date-fns": "^3.2.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.312.0"
  },
  "devDependencies": {
    "@types/node": "20.11.0",
    "@types/react": "18.2.48",
    "@types/react-dom": "18.2.18",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.1.0",
    "prettier": "^3.2.4",
    "prettier-plugin-tailwindcss": "^0.5.11"
  }
}
```

**Configuración de i18n (`src/middleware.ts`):**
```typescript
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'always'
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

**Layout root con providers:**
```typescript
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await import(`../../../public/locales/${locale}/common.json`);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 1.5 Integración Google Cloud Platform

**Día 11-12: Setup de GCP y APIs**

- [ ] Crear proyecto en Google Cloud Console
- [ ] Habilitar APIs: Places, Maps JavaScript, Routes, Geocoding
- [ ] Crear API Key con restricciones de dominio
- [ ] Configurar billing alerts (importante para controlar costos)
- [ ] Implementar wrapper de Google Places API en backend
- [ ] Crear componente de Google Maps en frontend
- [ ] Testear integración básica

**Wrapper de Google Places API:**
```python
# app/agents/tools/google_places.py
import httpx
from typing import List, Dict, Optional
from app.config.settings import get_settings

settings = get_settings()

class GooglePlacesClient:
    BASE_URL = "https://places.googleapis.com/v1"
    
    def __init__(self):
        self.api_key = settings.GOOGLE_PLACES_API_KEY
        self.client = httpx.AsyncClient()
    
    async def search_nearby(
        self,
        location: str,
        query: str,
        radius: int = 5000,
        language: str = "es",
        max_results: int = 10
    ) -> List[Dict]:
        """Busca lugares cercanos a una ubicación"""
        url = f"{self.BASE_URL}/places:searchText"
        headers = {
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.photos,places.types,places.location,places.priceLevel"
        }
        payload = {
            "textQuery": f"{query} en {location}",
            "languageCode": language,
            "maxResultCount": max_results,
            "locationBias": {
                "circle": {
                    "center": await self._geocode(location),
                    "radius": radius
                }
            }
        }
        
        response = await self.client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json().get("places", [])
    
    async def _geocode(self, address: str) -> Dict[str, float]:
        """Convierte dirección a coordenadas"""
        # Implementar usando Geocoding API
        pass
```

**Deliverables de Fase 1:**
- ✅ Repositorio configurado con estructura completa
- ✅ Backend FastAPI funcionando localmente
- ✅ Frontend Next.js con i18n y temas funcionando
- ✅ Supabase configurado con schema inicial
- ✅ Google APIs integradas y testeadas
- ✅ Documentación de setup en README

---

## Fase 2: Backend y Agentes IA (Semana 3-5)

### 2.1 Implementación de Agentes con LangGraph

**Día 13-15: Definición de Estado y Nodos Base**

- [ ] Definir `TravelState` TypedDict con todos los campos necesarios
- [ ] Implementar nodo de clasificación de intención
- [ ] Implementar nodo de extracción de preferencias
- [ ] Crear prompts estructurados para cada nodo
- [ ] Setup de LangGraph checkpointer con PostgreSQL
- [ ] Implementar persistencia de estado en Supabase

**Definición del estado:**
```python
# app/agents/state.py
from typing import TypedDict, Annotated, Literal, List, Dict, Optional
import operator
from datetime import date

class Message(TypedDict):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: str

class PlaceInfo(TypedDict):
    place_id: str
    name: str
    address: str
    rating: Optional[float]
    price_level: Optional[int]
    types: List[str]
    photos: List[str]
    location: Dict[str, float]  # {lat, lng}

class DayPlan(TypedDict):
    day_number: int
    date: Optional[str]
    morning: List[PlaceInfo]
    afternoon: List[PlaceInfo]
    evening: List[PlaceInfo]
    notes: str

class TravelState(TypedDict):
    # Conversación
    messages: Annotated[List[Message], operator.add]
    
    # Intención actual
    intent: Literal["new_trip", "refine", "question", "clarify"]
    
    # Preferencias del usuario
    destination: Optional[str]
    destinations: Optional[List[str]]  # Para multi-ciudad
    start_date: Optional[date]
    end_date: Optional[date]
    days: Optional[int]
    budget: Optional[Literal["low", "medium", "high"]]
    travel_style: Optional[List[str]]  # ["cultural", "adventure", "relaxed", etc.]
    travelers: Optional[int]
    
    # Datos de lugares
    searched_places: List[PlaceInfo]
    
    # Itinerario generado
    itinerary: Optional[Dict]  # Estructura completa del itinerario
    day_plans: List[DayPlan]
    
    # Control de flujo
    needs_clarification: bool
    clarification_questions: List[str]
    iteration_count: int
    max_iterations: int
```

**Nodo de clasificación de intención:**
```python
# app/agents/nodes/intent_classifier.py
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from app.agents.state import TravelState

async def classify_intent(state: TravelState) -> TravelState:
    """Clasifica la intención del último mensaje del usuario"""
    
    llm = ChatOpenAI(model="gpt-4o", temperature=0)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Eres un clasificador de intenciones para un agente de viajes.
        
Analiza el último mensaje del usuario y clasifica su intención en una de estas categorías:
- new_trip: El usuario quiere planear un viaje nuevo
- refine: El usuario quiere ajustar/modificar un itinerario existente
- question: El usuario tiene una pregunta sobre destinos/viajes
- clarify: El usuario está respondiendo a una pregunta de clarificación

Responde SOLO con una palabra: new_trip, refine, question, o clarify"""),
        ("user", "{message}")
    ])
    
    last_message = state["messages"][-1]["content"]
    
    chain = prompt | llm
    result = await chain.ainvoke({"message": last_message})
    
    intent = result.content.strip().lower()
    
    return {
        **state,
        "intent": intent,
        "iteration_count": state.get("iteration_count", 0) + 1
    }
```

**Día 16-18: Implementación de Búsqueda de Lugares**

- [ ] Crear herramienta de búsqueda de Google Places
- [ ] Implementar nodo que llama a Google Places API
- [ ] Agregar caché de resultados de búsqueda
- [ ] Implementar filtrado y ranking de resultados
- [ ] Manejar errores y rate limits de la API

```python
# app/agents/nodes/place_searcher.py
from typing import List
from app.agents.state import TravelState, PlaceInfo
from app.agents.tools.google_places import GooglePlacesClient

async def search_places(state: TravelState) -> TravelState:
    """Busca lugares relevantes según las preferencias del usuario"""
    
    if not state.get("destination"):
        return state
    
    places_client = GooglePlacesClient()
    
    # Definir categorías según travel_style
    search_queries = _build_search_queries(
        state.get("travel_style", []),
        state.get("budget", "medium")
    )
    
    all_places: List[PlaceInfo] = []
    
    for query in search_queries:
        try:
            results = await places_client.search_nearby(
                location=state["destination"],
                query=query,
                max_results=5
            )
            all_places.extend(_parse_places(results))
        except Exception as e:
            # Log error pero continúa con otras búsquedas
            print(f"Error searching {query}: {e}")
            continue
    
    # Eliminar duplicados y rankear
    unique_places = _deduplicate_places(all_places)
    ranked_places = _rank_places(unique_places, state)
    
    return {
        **state,
        "searched_places": ranked_places[:30]  # Top 30
    }

def _build_search_queries(travel_style: List[str], budget: str) -> List[str]:
    """Construye queries de búsqueda según preferencias"""
    queries = []
    
    base_queries = {
        "cultural": ["museos", "sitios históricos", "galerías de arte"],
        "adventure": ["trekking", "actividades al aire libre", "deportes extremos"],
        "relaxed": ["spas", "cafés", "parques", "miradores"],
        "gastronomy": ["restaurantes típicos", "mercados gastronómicos", "tours culinarios"],
        "nightlife": ["bares", "discotecas", "vida nocturna"]
    }
    
    for style in travel_style:
        if style in base_queries:
            queries.extend(base_queries[style])
    
    # Siempre agregar básicos
    queries.extend(["atracciones turísticas", "lugares imprescindibles"])
    
    return queries
```

**Día 19-21: Constructor de Itinerarios**

- [ ] Implementar nodo que construye itinerario completo
- [ ] Crear prompts para generación de itinerarios día a día
- [ ] Implementar validación de itinerarios
- [ ] Agregar optimización de rutas (orden lógico de visitas)
- [ ] Calcular tiempos de desplazamiento entre lugares

```python
# app/agents/nodes/itinerary_builder.py
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List
from app.agents.state import TravelState, DayPlan

class ItineraryOutput(BaseModel):
    title: str = Field(description="Título atractivo del itinerario")
    description: str = Field(description="Descripción general del viaje")
    day_plans: List[DayPlan] = Field(description="Plan para cada día")
    tips: List[str] = Field(description="Consejos generales para el viaje")

async def build_itinerary(state: TravelState) -> TravelState:
    """Construye un itinerario completo usando GPT-4o"""
    
    llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
    parser = PydanticOutputParser(pydantic_object=ItineraryOutput)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Eres un experto planificador de viajes especializado en Perú.

Crea un itinerario detallado día a día considerando:
- Destino: {destination}
- Días: {days}
- Presupuesto: {budget}
- Estilo de viaje: {travel_style}
- Número de viajeros: {travelers}

LUGARES DISPONIBLES:
{places_json}

INSTRUCCIONES:
1. Distribuye los lugares lógicamente por días
2. Agrupa lugares cercanos en el mismo día
3. Balancea actividades: no sobrecargues días
4. Considera horarios (museos cierran temprano, vida nocturna empieza tarde, etc.)
5. Incluye tiempo para comidas y descanso
6. Sugiere restaurantes típicos para cada día
7. Añade consejos prácticos (qué llevar, cómo moverse, etc.)

{format_instructions}
"""),
        ("user", "Crea el mejor itinerario posible con esta información.")
    ])
    
    places_json = _format_places_for_llm(state["searched_places"])
    
    chain = prompt | llm | parser
    
    result = await chain.ainvoke({
        "destination": state["destination"],
        "days": state["days"],
        "budget": state.get("budget", "medium"),
        "travel_style": ", ".join(state.get("travel_style", ["variado"])),
        "travelers": state.get("travelers", 1),
        "places_json": places_json,
        "format_instructions": parser.get_format_instructions()
    })
    
    # Enriquecer con datos de rutas
    enriched_day_plans = await _add_route_info(result.day_plans)
    
    itinerary = {
        "title": result.title,
        "description": result.description,
        "day_plans": enriched_day_plans,
        "tips": result.tips,
        "metadata": {
            "destination": state["destination"],
            "days": state["days"],
            "budget": state["budget"],
            "travel_style": state["travel_style"]
        }
    }
    
    return {
        **state,
        "itinerary": itinerary,
        "day_plans": enriched_day_plans
    }
```

### 2.2 Construcción del Grafo Principal

**Día 22-24: Ensamblaje de LangGraph**

- [ ] Crear grafo principal con todos los nodos
- [ ] Definir edges condicionales entre nodos
- [ ] Implementar lógica de ciclos y refinamiento
- [ ] Agregar manejo de errores y fallbacks
- [ ] Testear flujos completos end-to-end

```python
# app/agents/graph.py
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres import PostgresSaver
from app.agents.state import TravelState
from app.agents.nodes.intent_classifier import classify_intent
from app.agents.nodes.preference_extractor import extract_preferences
from app.agents.nodes.place_searcher import search_places
from app.agents.nodes.itinerary_builder import build_itinerary
from app.agents.nodes.refinement_handler import handle_refinement

def create_travel_agent_graph(checkpointer):
    """Crea el grafo principal del agente de viajes"""
    
    workflow = StateGraph(TravelState)
    
    # Agregar nodos
    workflow.add_node("classify_intent", classify_intent)
    workflow.add_node("extract_preferences", extract_preferences)
    workflow.add_node("search_places", search_places)
    workflow.add_node("build_itinerary", build_itinerary)
    workflow.add_node("handle_refinement", handle_refinement)
    
    # Definir flujo
    workflow.set_entry_point("classify_intent")
    
    # Edges condicionales basados en intent
    workflow.add_conditional_edges(
        "classify_intent",
        route_by_intent,
        {
            "new_trip": "extract_preferences",
            "refine": "handle_refinement",
            "question": "build_itinerary",  # Responde con conocimiento
            "clarify": "extract_preferences"
        }
    )
    
    workflow.add_edge("extract_preferences", "search_places")
    workflow.add_edge("search_places", "build_itinerary")
    workflow.add_edge("build_itinerary", END)
    workflow.add_edge("handle_refinement", "build_itinerary")
    
    # Compilar con checkpointer para persistencia
    return workflow.compile(checkpointer=checkpointer)

def route_by_intent(state: TravelState) -> str:
    """Rutea según la intención clasificada"""
    intent = state.get("intent", "new_trip")
    
    # Validar si necesita clarificación
    if state.get("needs_clarification", False):
        return "clarify"
    
    # Límite de iteraciones para evitar loops infinitos
    if state.get("iteration_count", 0) > state.get("max_iterations", 10):
        return "new_trip"  # Reinicia
    
    return intent
```

### 2.3 API Endpoints

**Día 25-27: Implementación de Endpoints REST**

- [ ] Implementar endpoint POST /chat
- [ ] Implementar CRUD para itinerarios
- [ ] Agregar endpoint de búsqueda de lugares
- [ ] Implementar autenticación JWT con Supabase
- [ ] Agregar validación de requests con Pydantic
- [ ] Documentar endpoints con OpenAPI

```python
# app/api/v1/endpoints/chat.py
from fastapi import APIRouter, Depends, HTTPException, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.api.v1.schemas.chat import ChatRequest, ChatResponse
from app.agents.graph import create_travel_agent_graph
from app.services.supabase_client import get_supabase_client
from app.core.dependencies import get_current_user
from langgraph.checkpoint.postgres import PostgresSaver

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat_with_agent(
    request: ChatRequest,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """
    Envía un mensaje al agente de viajes y recibe una respuesta.
    
    El agente mantiene el contexto de la conversación usando thread_id.
    """
    try:
        # Crear checkpointer para persistencia
        checkpointer = PostgresSaver.from_conn_string(
            conn_string=settings.DATABASE_URL
        )
        
        # Crear o recuperar el grafo
        graph = create_travel_agent_graph(checkpointer)
        
        # Configuración del thread
        config = {
            "configurable": {
                "thread_id": request.thread_id or str(uuid.uuid4()),
                "user_id": current_user.id
            }
        }
        
        # Preparar entrada
        input_state = {
            "messages": [{
                "role": "user",
                "content": request.message,
                "timestamp": datetime.now().isoformat()
            }],
            "max_iterations": 10
        }
        
        # Ejecutar el grafo
        result = await graph.ainvoke(input_state, config=config)
        
        # Guardar conversación en Supabase si es nuevo itinerario
        if result.get("itinerary") and request.save_conversation:
            await _save_conversation(
                supabase,
                current_user.id,
                result,
                config["configurable"]["thread_id"]
            )
        
        return ChatResponse(
            message=result["messages"][-1]["content"],
            itinerary=result.get("itinerary"),
            thread_id=config["configurable"]["thread_id"],
            needs_clarification=result.get("needs_clarification", False),
            clarification_questions=result.get("clarification_questions", [])
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error procesando mensaje: {str(e)}"
        )
```

**Día 28-30: Testing del Backend**

- [ ] Tests unitarios de nodos individuales
- [ ] Tests de integración del grafo completo
- [ ] Tests de endpoints API
- [ ] Tests de autenticación y autorización
- [ ] Mocking de APIs externas (Google, OpenAI)
- [ ] Coverage mínimo del 70%

**Deliverables de Fase 2:**
- ✅ Agentes LangGraph funcionando end-to-end
- ✅ API REST completa y documentada
- ✅ Integración con Google Places API
- ✅ Persistencia de estado en Supabase
- ✅ Tests con buena cobertura
- ✅ Documentación técnica de agentes

---

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

## Fase 4: Integración y Testing (Semana 9-10)

### 4.1 Integración Frontend-Backend

**Día 49-52: Conexión Completa**

- [ ] Configurar cliente API en frontend
- [ ] Implementar custom hooks para llamadas API
- [ ] Agregar React Query para caché y sincronización
- [ ] Implementar manejo de errores global
- [ ] Agregar loading states en todas las acciones
- [ ] Configurar interceptores de autenticación
- [ ] Testear flujo completo end-to-end

```typescript
// src/lib/api/client.ts
import axios from 'axios';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
apiClient.interceptors.request.use(async (config) => {
  const supabase = createClientComponentClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  return config;
});

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirigir a login
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

```typescript
// src/hooks/useChat.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import apiClient from '@/lib/api/client';
import type { ChatRequest, ChatResponse, Message } from '@/types/chat';

export function useChat(initialThreadId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadId, setThreadId] = useState<string | undefined>(initialThreadId);
  const queryClient = useQueryClient();

  const { mutate: sendMessage, isLoading } = useMutation({
    mutationFn: async (content: string) => {
      const request: ChatRequest = {
        message: content,
        thread_id: threadId,
        save_conversation: true,
      };

      const response = await apiClient.post<ChatResponse>('/chat', request);
      return response.data;
    },
    onMutate: (content) => {
      // Optimistic update
      const userMessage: Message = {
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);
    },
    onSuccess: (data) => {
      setThreadId(data.thread_id);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        itinerary: data.itinerary,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Invalidar cache de itinerarios si se creó uno nuevo
      if (data.itinerary) {
        queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      }
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      // Mostrar toast de error
    },
  });

  return {
    messages,
    isLoading,
    sendMessage,
    threadId,
  };
}
```

### 4.2 Testing Completo

**Día 53-56: Suite de Tests**

- [ ] Tests E2E con Playwright o Cypress
- [ ] Tests de integración de flujos críticos
- [ ] Tests de accesibilidad (a11y)
- [ ] Tests de rendimiento (Lighthouse)
- [ ] Tests de responsive design
- [ ] Tests de i18n
- [ ] Tests de seguridad básicos

```typescript
// tests/e2e/chat-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/chat');
  });

  test('should create a new itinerary from chat', async ({ page }) => {
    // Enviar mensaje
    const input = page.locator('[data-testid="chat-input"]');
    await input.fill('Quiero ir a Cusco 5 días con presupuesto medio');
    await input.press('Enter');

    // Esperar respuesta del agente
    await expect(page.locator('[data-testid="typing-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="typing-indicator"]')).not.toBeVisible({ timeout: 30000 });

    // Verificar que se generó un itinerario
    await expect(page.locator('[data-testid="itinerary-card"]')).toBeVisible();
    await expect(page.locator('text=Cusco')).toBeVisible();
  });

  test('should display suggested prompts for new users', async ({ page }) => {
    await expect(page.locator('[data-testid="suggested-prompt"]')).toHaveCount(4);
  });
});
```

### 4.3 Optimización y Performance

**Día 57-60: Mejoras de Performance**

- [ ] Implementar code splitting en frontend
- [ ] Optimizar imágenes con next/image
- [ ] Agregar caché de Google Places API
- [ ] Implementar rate limiting más granular
- [ ] Optimizar queries de base de datos
- [ ] Agregar índices en Supabase
- [ ] Implementar lazy loading de componentes
- [ ] Analizar y reducir bundle size

**Deliverables de Fase 4:**
- ✅ Integración completa frontend-backend
- ✅ Suite de tests con cobertura >80%
- ✅ Performance optimizado (Lighthouse >90)
- ✅ Manejo robusto de errores
- ✅ Documentación de API actualizada

---

## Fase 5: Deploy y Optimización (Semana 11-12)

### 5.1 Configuración de Deploy

**Día 61-63: Deploy de Backend en Railway**

- [ ] Crear proyecto en Railway
- [ ] Configurar variables de entorno
- [ ] Conectar con repositorio Git
- [ ] Configurar auto-deploy en main branch
- [ ] Setup de PostgreSQL en Railway
- [ ] Ejecutar migraciones en producción
- [ ] Configurar health checks
- [ ] Setup de logging y monitoring

```json
// railway.json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

**Día 64-65: Deploy de Frontend en Vercel**

- [ ] Conectar repositorio con Vercel
- [ ] Configurar variables de entorno
- [ ] Setup de dominios personalizados (opcional)
- [ ] Configurar redirects y rewrites
- [ ] Habilitar Edge Functions si es necesario
- [ ] Setup de Analytics
- [ ] Configurar preview deployments

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google Places photos
      'maps.googleapis.com',
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
```

### 5.2 Monitoreo y Observabilidad

**Día 66-68: Setup de Monitoring**

- [ ] Configurar Sentry para error tracking
- [ ] Setup de logs estructurados (Logtail o similar)
- [ ] Implementar métricas custom (Prometheus/Grafana opcional)
- [ ] Configurar alertas críticas
- [ ] Setup de uptime monitoring (UptimeRobot)
- [ ] Implementar tracking de costos de APIs
- [ ] Crear dashboard de métricas clave

```python
# app/config/logging.py
import logging
import sys
from loguru import logger

class InterceptHandler(logging.Handler):
    def emit(self, record):
        logger_opt = logger.opt(depth=6, exception=record.exc_info)
        logger_opt.log(record.levelname, record.getMessage())

def setup_logging():
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    
    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
        level="INFO",
    )
    
    # En producción, enviar a servicio externo
    if settings.ENVIRONMENT == "production":
        logger.add(
            "logs/app.log",
            rotation="500 MB",
            retention="10 days",
            compression="zip",
        )
```

### 5.3 Documentación Final

**Día 69-72: Documentación Completa**

- [ ] Actualizar README con instrucciones completas
- [ ] Documentar endpoints API con OpenAPI/Swagger
- [ ] Crear guía de deployment
- [ ] Documentar arquitectura de agentes
- [ ] Crear troubleshooting guide
- [ ] Documentar proceso de contribución
- [ ] Crear changelog inicial

```markdown
# README.md estructura recomendada

# ViajesPeru.AI

> Plataforma de planificación de viajes con IA para Perú

## 🚀 Features

- ✨ Agente conversacional con GPT-4o
- 🗺️ Integración con Google Maps y Places
- 📱 Responsive y PWA-ready
- 🌍 Multiidioma (ES/EN)
- 🌓 Tema claro/oscuro
- 🔐 Autenticación segura con Supabase

## 🏗️ Arquitectura

[Diagrama de arquitectura]

## 📦 Instalación

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Configurar variables de entorno
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Configurar variables de entorno
npm run dev
```

## 🧪 Testing

```bash
# Backend
pytest

# Frontend
npm run test
npm run test:e2e
```

## 🚢 Deploy

[Instrucciones de deploy]

## 📖 Documentación

- [API Docs](http://localhost:8000/docs)
- [Arquitectura de Agentes](docs/agents.md)
- [Guía de Contribución](CONTRIBUTING.md)
```

**Deliverables de Fase 5:**
- ✅ Aplicación deployada en producción
- ✅ CI/CD configurado
- ✅ Monitoring y alertas activos
- ✅ Documentación completa
- ✅ Performance optimizado para producción

---

## Consideraciones de Seguridad

### Seguridad en Backend

1. **Autenticación y Autorización**
   - JWT tokens con expiración corta (1 hora)
   - Refresh tokens en httpOnly cookies
   - Validación de permisos en cada endpoint
   - Rate limiting por usuario y por IP

2. **Protección de APIs**
   - API keys en variables de entorno (nunca en código)
   - Restricciones de dominio en Google Cloud Console
   - Rotación periódica de secrets
   - Validación estricta de inputs con Pydantic

3. **Base de Datos**
   - Row Level Security (RLS) habilitado
   - Prepared statements (previene SQL injection)
   - Encriptación de datos sensibles
   - Backups automáticos diarios

4. **CORS y Headers de Seguridad**
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=settings.ALLOWED_ORIGINS,  # Lista específica
       allow_credentials=True,
       allow_methods=["GET", "POST", "PUT", "DELETE"],
       allow_headers=["*"],
   )
   
   @app.middleware("http")
   async def add_security_headers(request, call_next):
       response = await call_next(request)
       response.headers["X-Content-Type-Options"] = "nosniff"
       response.headers["X-Frame-Options"] = "DENY"
       response.headers["X-XSS-Protection"] = "1; mode=block"
       return response
   ```

5. **Rate Limiting**
   ```python
   @router.post("/chat")
   @limiter.limit("10/minute")  # 10 mensajes por minuto
   async def chat_endpoint():
       ...
   
   @router.post("/auth/register")
   @limiter.limit("3/hour")  # 3 registros por hora
   async def register():
       ...
   ```

### Seguridad en Frontend

1. **Protección de Rutas**
   ```typescript
   // middleware.ts
   export async function middleware(request: NextRequest) {
     const { pathname } = request.nextUrl;
     const protectedRoutes = ['/chat', '/itineraries', '/profile'];
     
     if (protectedRoutes.some(route => pathname.startsWith(route))) {
       const supabase = createMiddlewareClient({ req: request, res: response });
       const { data: { session } } = await supabase.auth.getSession();
       
       if (!session) {
         return NextResponse.redirect(new URL('/auth/login', request.url));
       }
     }
   }
   ```

2. **Sanitización de Inputs**
   - Usar react-hook-form con validación Zod
   - Escapar HTML en contenido dinámico
   - Validar y sanitizar antes de enviar al backend

3. **Secrets Management**
   - `.env.local` en .gitignore
   - Variables de entorno solo en build time
   - API keys del backend nunca expuestas al cliente
   - Google Maps API key con restricciones de dominio

4. **Content Security Policy**
   ```typescript
   // next.config.js
   const securityHeaders = [
     {
       key: 'Content-Security-Policy',
       value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.googleapis.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: *.googleusercontent.com maps.gstatic.com;",
     },
   ];
   
   module.exports = {
     async headers() {
       return [{ source: '/:path*', headers: securityHeaders }];
     },
   };
   ```

### Seguridad de APIs Externas

1. **Google Cloud APIs**
   - API keys con restricciones de aplicación (dominio específico)
   - Quotas y billing alerts configurados
   - Monitoreo de uso anormal

2. **OpenAI API**
   - Key almacenada solo en backend
   - Límites de tokens por request
   - Logging de costos
   - Timeout de requests

3. **Supabase**
   - Service role key solo en backend
   - Anon key en frontend (con RLS activado)
   - 2FA habilitado en cuenta de Supabase
   - Políticas RLS estrictas

---

## Checklist de Buenas Prácticas

### Código

- [ ] Tipado estricto en TypeScript (no usar `any`)
- [ ] Type hints en Python (mypy passing)
- [ ] Linting automático (ESLint, Ruff)
- [ ] Formateo automático (Prettier, Black)
- [ ] Pre-commit hooks configurados
- [ ] Code review antes de merge
- [ ] Commits semánticos (Conventional Commits)

### Testing

- [ ] Cobertura mínima 70%
- [ ] Tests unitarios para lógica crítica
- [ ] Tests de integración para flujos principales
- [ ] Tests E2E para user journeys críticos
- [ ] Tests de accesibilidad (a11y)
- [ ] Tests de performance

### Documentación

- [ ] README actualizado
- [ ] Comentarios en funciones complejas
- [ ] Docstrings en Python
- [ ] JSDoc en TypeScript
- [ ] API documentada con OpenAPI
- [ ] Changelog mantenido
- [ ] Diagramas de arquitectura actualizados

### Performance

- [ ] Lazy loading de componentes
- [ ] Code splitting implementado
- [ ] Imágenes optimizadas
- [ ] Caché de API implementado
- [ ] Database queries optimizados
- [ ] Índices en tablas principales
- [ ] Lighthouse score >90

### Seguridad

- [ ] Secrets en variables de entorno
- [ ] Rate limiting configurado
- [ ] HTTPS forzado
- [ ] CORS configurado correctamente
- [ ] Headers de seguridad activos
- [ ] RLS habilitado en Supabase
- [ ] Validación de inputs en backend y frontend
- [ ] Dependencias actualizadas (sin vulnerabilidades)

### DevOps

- [ ] CI/CD configurado
- [ ] Auto-deploy en merge a main
- [ ] Preview deployments para PRs
- [ ] Monitoring y alertas activos
- [ ] Logs centralizados
- [ ] Backups automáticos
- [ ] Rollback plan documentado

### UX/UI

- [ ] Responsive en mobile, tablet, desktop
- [ ] Tema claro/oscuro funcional
- [ ] i18n sin strings hardcoded
- [ ] Loading states en todas las acciones
- [ ] Error messages claros y útiles
- [ ] Feedback visual en interacciones
- [ ] Accesibilidad (teclado, screen readers)

---

## Métricas de Éxito del MVP

### Técnicas
- ✅ Uptime >99% en 30 días
- ✅ Latencia API <500ms p95
- ✅ Lighthouse Performance >90
- ✅ Zero errores críticos no resueltos
- ✅ Test coverage >70%

### Producto
- 🎯 100 usuarios registrados en primer mes
- 🎯 50 itinerarios creados
- 🎯 Tasa de conversión chat→itinerario >60%
- 🎯 NPS >40
- 🎯 Tiempo promedio de generación <2min

### Costo
- 💰 Costo por itinerario <$0.50 (APIs)
- 💰 Costo total infraestructura <$50/mes
- 💰 CAC (si hay marketing) <$5

---

## Timeline Visual

```
Semana 1-2:  [██████████] Setup & Infraestructura
Semana 3-5:  [██████████] Backend & Agentes IA
Semana 6-8:  [██████████] Frontend & UX
Semana 9-10: [██████████] Integración & Testing
Semana 11-12:[██████████] Deploy & Optimización
             └─────────────────────────────┘
                    12 semanas totales
```

---

## Próximos Pasos Post-MVP

Una vez lanzado el MVP, considerar:

1. **Integraciones de Reservas**
   - API de Despegar.com
   - Agregadores de vuelos (Skyscanner API)
   - Hoteles (Booking.com API)
   - Tours locales (partnerships directos)

2. **Features Adicionales**
   - Compartir itinerarios públicamente
   - Colaboración en itinerarios (multi-usuario)
   - Recomendaciones basadas en itinerarios pasados
   - Sistema de reviews de lugares
   - Exportación a Google Calendar

3. **Monetización**
   - Freemium: límite de 3 itinerarios/mes gratis
   - Pro: $9.99/mes ilimitado
   - Comisiones de afiliado en reservas
   - B2B: API para agencias de viaje

4. **Expansión**
   - Más países de LATAM
   - Mobile app (React Native)
   - Integración con redes sociales
   - Marketplace de tours locales

---

## Recursos y Referencias

### Documentación Oficial
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Next.js 14 Docs](https://nextjs.org/docs)
- [LangChain Docs](https://python.langchain.com/)
- [LangGraph Docs](https://langchain-ai.github.io/langgraph/)
- [Supabase Docs](https://supabase.com/docs)
- [Google Maps Platform](https://developers.google.com/maps)
- [OpenAI API Docs](https://platform.openai.com/docs)

### Herramientas Útiles
- [Shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Query](https://tanstack.com/query)
- [Zustand](https://zustand-demo.pmnd.rs/)

### Comunidad
- LangChain Discord
- Supabase Discord
- Next.js Discord

---

**Última actualización:** Febrero 2026
**Versión del plan:** 1.0
**Autor:** Plan técnico generado para ViajesPeru.AI

---

¿Necesitas ayuda con alguna fase específica? ¡Estoy aquí para apoyarte en cada paso! 🚀