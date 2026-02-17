# Vora - Plataforma de Agente de Viajes IA para Perú

Plataforma de planificación de viajes impulsada por IA, especializada en turismo interno peruano, con agentes conversacionales que generan itinerarios personalizados.

## Stack Tecnológico

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Shadcn/ui
- **Backend:** FastAPI (Python 3.11+), LangChain, LangGraph
- **Base de Datos:** Supabase (PostgreSQL + Auth + Storage)
- **IA:** OpenAI GPT-4o, Google Places/Maps API
- **Deploy:** Vercel (Frontend), Railway (Backend)

## Estructura del Proyecto

```
vora/
├── backend/          # FastAPI + LangChain/LangGraph
├── frontend/         # Next.js 14 + TypeScript
└── docs/            # Documentación del proyecto
```

## Setup Inicial

### Requisitos Previos

- Python 3.11+
- Node.js 18+
- Git
- Cuenta en Supabase
- Cuenta en Google Cloud Platform
- API Key de OpenAI

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env.local
# Configurar variables de entorno en .env.local
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Configurar variables de entorno en .env.local
npm run dev
```

## Variables de Entorno

### Backend (.env.local)
- `ENVIRONMENT`: development/production
- `SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_KEY`: Anon key de Supabase
- `OPENAI_API_KEY`: API key de OpenAI
- `GOOGLE_PLACES_API_KEY`: API key de Google Places
- `ALLOWED_ORIGINS`: Orígenes permitidos para CORS

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL`: URL del backend
- `NEXT_PUBLIC_SUPABASE_URL`: URL de Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon key de Supabase
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: API key de Google Maps

## Desarrollo

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- API Docs: `http://localhost:8000/docs`

## Testing

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

## Licencia

Privado - Todos los derechos reservados
