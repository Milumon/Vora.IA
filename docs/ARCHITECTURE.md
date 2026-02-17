# Arquitectura de Vora

## Visión General

Vora es una plataforma de planificación de viajes impulsada por IA, construida con una arquitectura moderna de microservicios.

## Componentes Principales

### Frontend (Next.js 14)
- **Framework**: Next.js 14 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS + Shadcn/ui
- **Estado**: Zustand + React Query
- **i18n**: next-intl (ES/EN)
- **Temas**: next-themes (claro/oscuro)

### Backend (FastAPI)
- **Framework**: FastAPI
- **Lenguaje**: Python 3.11+
- **IA**: LangChain + LangGraph
- **Modelo**: OpenAI GPT-4o
- **APIs Externas**: Google Places, Maps, Routes

### Base de Datos (Supabase)
- **Motor**: PostgreSQL
- **Auth**: Supabase Auth (JWT)
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

## Flujo de Datos

```
Usuario → Frontend → API Gateway → Backend Services
                                  ↓
                            LangGraph Agents
                                  ↓
                    ┌─────────────┼─────────────┐
                    ↓             ↓             ↓
                OpenAI API    Google APIs   Supabase
```

## Seguridad

- Autenticación JWT via Supabase (ECC P-256)
- Row Level Security (RLS) en PostgreSQL
- CORS configurado
- Rate limiting
- API Keys con restricciones de dominio
- Verificación automática de JWT con criptografía asimétrica

## Escalabilidad

- Frontend: Vercel (Edge Network)
- Backend: Railway (Auto-scaling)
- Base de Datos: Supabase (Managed PostgreSQL)
- Cache: En memoria (futuro: Redis)

## Monitoreo

- Logs estructurados
- Health checks
- Error tracking (futuro: Sentry)
- Analytics (futuro: PostHog)
