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