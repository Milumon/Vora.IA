# Changelog - Vora

Todos los cambios notables del proyecto se documentan en este archivo.

## [1.0.0] - 2024-01-01

### Added - Fase 1: Configuración Inicial

#### Backend
- Estructura modular de FastAPI con App Router
- Sistema de autenticación JWT con Supabase (ECC P-256)
- Endpoints REST API (auth, chat, itineraries, places)
- Configuración con Pydantic Settings
- Logging estructurado y middleware personalizado
- Manejo de excepciones centralizado
- Cliente Supabase con verificación automática de JWT
- Tests básicos con pytest
- Linting con Black, Ruff y MyPy
- Pre-commit hooks
- Dockerfile y configuración Railway

#### Frontend
- Next.js 14 con App Router y TypeScript
- Tailwind CSS + Shadcn/ui
- Sistema i18n con next-intl (ES/EN)
- Sistema de temas con next-themes (claro/oscuro)
- Providers: Theme, Query (React Query), I18n
- State management con Zustand (authStore, chatStore)
- Custom hooks (useAuth, useChat)
- Cliente API con Axios e interceptores
- Integración Supabase (browser y server)
- TypeScript types completos
- Componentes UI base

#### Base de Datos
- Schema SQL completo con 4 tablas (profiles, itineraries, conversations, favorite_places)
- Row Level Security (RLS) policies
- Índices optimizados
- Triggers para updated_at
- Function para crear perfil automáticamente

#### Documentación
- README.md principal
- QUICKSTART.md - Guía de inicio rápido
- docs/SETUP.md - Setup detallado
- docs/ARCHITECTURE.md - Arquitectura del sistema
- docs/API.md - Documentación de API REST
- docs/SUPABASE_AUTH.md - Guía de autenticación con Supabase
- docs/PHASE1_CHECKLIST.md - Checklist de Fase 1
- CONTRIBUTING.md - Guía de contribución
- STATUS.md - Estado del proyecto
- CHANGELOG.md - Registro de cambios

#### Infraestructura
- Monorepo configurado
- Git con .gitignore y .gitattributes
- EditorConfig para consistencia
- Configuración de linting y formateo
- Archivos .env.example

### Changed

- **BREAKING**: Eliminado `SUPABASE_JWT_SECRET` de la configuración
  - Supabase migró a criptografía asimétrica (ECC P-256)
  - La verificación de JWT ahora es automática
  - Solo se requiere `SUPABASE_URL` y `SUPABASE_KEY`

### Security

- Implementada autenticación JWT con ECC P-256
- Row Level Security en todas las tablas
- Rate limiting configurado (60 req/min)
- CORS con orígenes permitidos configurables
- Validación de datos con Pydantic

### Notes

- Fase 1 completada: Configuración inicial
- Próxima fase: Backend y Agentes IA (LangGraph)
- Requiere configuración manual de servicios externos:
  - Supabase (crear proyecto y ejecutar schema.sql)
  - Google Cloud Platform (habilitar APIs)
  - OpenAI (obtener API Key)

---

## Formato

Este changelog sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

### Tipos de cambios

- `Added` - Nuevas funcionalidades
- `Changed` - Cambios en funcionalidades existentes
- `Deprecated` - Funcionalidades que serán removidas
- `Removed` - Funcionalidades removidas
- `Fixed` - Corrección de bugs
- `Security` - Cambios de seguridad
