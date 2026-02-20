# Implementación de Persistencia de Chat con React Query

**Fecha:** 2025-02-19  
**Estado:** En Progreso

## ✅ Completado

### 1. Diseño y Documentación
- ✅ Documento de diseño completo en `docs/plans/2025-02-19-chat-persistence-react-query-design.md`
- ✅ Arquitectura definida: React Query + Zustand + Supabase
- ✅ Flujos de usuario documentados

### 2. Base de Datos
- ✅ Esquema actualizado en `supabase/schema.sql`:
  - Eliminado `conversations.itinerary_id`
  - Agregado `itineraries.conversation_id`
  - Agregado `conversations.is_active` y `last_message_at`
  - Índices optimizados
- ✅ Script de migración creado en `supabase/migrations/002_add_conversation_persistence.sql`
- ✅ Función helper `get_active_conversation()` para queries eficientes

### 3. Frontend - React Query
- ✅ Instalado `@tanstack/react-query` con pnpm
- ✅ `QueryProvider` creado con configuración de 7 días de caché
- ✅ Integrado en `app/[locale]/layout.tsx`
- ✅ API client para conversaciones en `lib/api/conversations.ts`
- ✅ Hooks de React Query en `hooks/useConversation.ts`:
  - `useActiveConversation()` - Carga conversación activa
  - `useCreateConversation()` - Crea nueva conversación
  - `useSaveMessage()` - Guarda mensajes con optimistic updates
  - `useDeactivateConversation()` - Desactiva conversación

### 4. Frontend - Integración
- ✅ Hook `useChat` actualizado para usar React Query
- ✅ Hidratación automática de Zustand desde React Query
- ✅ Optimistic updates implementados

### 5. Backend - Endpoints de Conversaciones
- ✅ Schemas de Pydantic en `backend/app/api/v1/schemas/conversation.py`
- ✅ Endpoints completos en `backend/app/api/v1/endpoints/conversations.py`:
  - `GET /api/v1/conversations/active` - Obtiene conversación activa
  - `POST /api/v1/conversations` - Crea nueva conversación
  - `PATCH /api/v1/conversations/{id}/messages` - Agrega mensaje
  - `PATCH /api/v1/conversations/{id}/deactivate` - Desactiva conversación
  - `GET /api/v1/conversations/{id}` - Obtiene conversación específica
- ✅ Router registrado en `backend/app/api/v1/router.py`

### 6. Backend - Endpoint de Chat Modificado
- ✅ Auto-guarda mensajes en `conversations` table
- ✅ Crea conversación si no existe
- ✅ Actualiza `last_message_at` automáticamente
- ✅ Retorna `conversation_id` (como `thread_id`)
- ✅ Vincula itinerarios a conversaciones con `conversation_id`
- ✅ Desactiva conversaciones anteriores al crear nueva

## 🚧 Pendiente

### 1. Migración de Base de Datos

**CRÍTICO:** Ejecutar en Supabase SQL Editor:

```bash
# 1. Abrir Supabase Dashboard → https://supabase.com/dashboard
# 2. Seleccionar proyecto Vora
# 3. Ir a SQL Editor
# 4. Copiar contenido de supabase/migrations/002_add_conversation_persistence.sql
# 5. Ejecutar
# 6. Verificar que no hay errores
```

### 2. Frontend - UI Improvements

- Agregar botón "Nueva Conversación" en ChatSidebar
- Mostrar indicador de "Cargando conversación..."
- Toast notifications para errores de guardado
- Botón de "Reintentar" si falla el guardado

### 3. Testing

- Unit tests para hooks de React Query
- Integration tests para flujo completo
- E2E tests con Playwright
- Probar flujo: enviar mensaje → refrescar → verificar recuperación

## 📋 Próximos Pasos Inmediatos

1. **✅ COMPLETADO: Backend implementado**
2. **🔴 CRÍTICO: Ejecutar migración de base de datos** en Supabase
3. **Probar flujo completo**:
   - Enviar mensaje → Verificar guardado en Supabase
   - Refrescar página → Verificar recuperación
   - Generar itinerario → Verificar persistencia
4. **Agregar UI improvements** (botón nueva conversación, loading states)

## 🎯 Beneficios Implementados

- ✅ **Caché de 7 días**: Datos persisten localmente
- ✅ **Optimistic Updates**: UI instantánea
- ✅ **Recuperación automática**: Al recargar `/chat`
- ✅ **Múltiples itinerarios**: Por conversación
- ✅ **Rollback en errores**: Sin pérdida de datos

## 🔧 Comandos Útiles

```bash
# Frontend
cd frontend
pnpm install  # Ya ejecutado
pnpm dev      # Iniciar dev server

# Backend
cd backend
python -m uvicorn app.main:app --reload

# Verificar React Query DevTools (opcional)
pnpm add @tanstack/react-query-devtools
```

## 📚 Referencias

- [React Query Docs](https://tanstack.com/query/latest)
- [Vercel React Best Practices](.agents/skills/vercel-react-best-practices/AGENTS.md)
- [Diseño Completo](docs/plans/2025-02-19-chat-persistence-react-query-design.md)
