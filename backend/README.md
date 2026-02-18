# Vora Backend API

API backend para Vora - Plataforma de Agente de Viajes IA especializada en Perú.

## Stack Tecnológico

- **Framework**: FastAPI 0.109.0
- **IA/ML**: LangChain + LangGraph + OpenAI GPT-4
- **Base de Datos**: Supabase (PostgreSQL)
- **APIs Externas**: Google Places API, Google Maps API
- **Testing**: Pytest + pytest-asyncio
- **Linting**: Ruff + Black + MyPy

## Características

- 🤖 Agente conversacional con LangGraph
- 🗺️ Generación automática de itinerarios
- 📍 Búsqueda inteligente de lugares turísticos
- 🔐 Autenticación con Supabase Auth
- 🚦 Rate limiting y seguridad
- 📊 Logging estructurado
- ✅ Tests automatizados

## Instalación Rápida

### Windows (PowerShell)

```powershell
cd backend
.\setup.ps1
```

### Linux/Mac

```bash
cd backend
chmod +x setup.sh
./setup.sh
```

## Setup Manual

1. Crear entorno virtual:
```bash
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\Activate.ps1
```

2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

3. Configurar `.env.local` con tus credenciales (ver sección Configuración)

4. Ejecutar servidor de desarrollo:
```bash
uvicorn app.main:app --reload --port 8000
```

El servidor estará disponible en `http://localhost:8000`

## Configuración

Asegúrate de tener `.env.local` con:

```env
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Google APIs
GOOGLE_PLACES_API_KEY=AIza...
GOOGLE_MAPS_API_KEY=AIza...

# Supabase
SUPABASE_URL=https://...
SUPABASE_KEY=eyJ...

# Security
SECRET_KEY=your-secret-key
```

## Documentación API

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/health`

## Endpoints Principales

### Chat con el Agente

```bash
POST /api/v1/chat
Authorization: Bearer <token>

{
  "message": "Quiero viajar a Cusco por 5 días",
  "thread_id": "optional-thread-id"
}
```

## Testing

```bash
# Todos los tests
pytest tests/ -v

# Con coverage
pytest tests/ --cov=app --cov-report=html

# Test específico del agente
python test_agent.py
```

## Linting

```bash
black app/
ruff check app/
mypy app/
```

## Estructura

```
app/
├── agents/       # Sistema de agentes LangGraph ✨
│   ├── state.py
│   ├── graph.py
│   ├── nodes/
│   └── tools/
├── api/          # Endpoints REST
├── config/       # Configuración
├── core/         # Dependencias y middleware
├── services/     # Servicios externos
└── main.py       # Aplicación FastAPI
```

## Agentes IA

Ver [AGENTS_README.md](./AGENTS_README.md) para documentación completa de los agentes.

## Deployment

Railway: `railway up`

Docker: `docker build -t vora-backend .`
