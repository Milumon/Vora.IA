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