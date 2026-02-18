# Diseño: Integración de Chat con Mapa Interactivo

**Fecha:** 2025-02-17  
**Estado:** Aprobado  
**Enfoque:** Transición Suave con Estado en el Store

## Resumen Ejecutivo

Implementar un sistema donde el chat conversacional transiciona suavemente a un layout de dos columnas (chat + mapa interactivo) cuando el agente genera un itinerario completo. El usuario puede seguir conversando para hacer refinamientos mientras visualiza los cambios en tiempo real en el mapa.

## Objetivos

1. Mostrar el itinerario generado de forma visual y atractiva
2. Permitir interacción continua con el agente para refinamientos
3. Visualizar la ruta en Google Maps con marcadores y popups
4. Mantener una experiencia fluida sin navegación entre páginas

## Arquitectura

### Flujo de Estados

```
Chat Simple (100% ancho)
    ↓ (usuario completa preferencias)
Conversación con preguntas de validación
    ↓ (agente genera itinerario)
Chat + Mapa (50/50 split con animación)
    ↓ (usuario puede seguir conversando)
Refinamiento del itinerario (mapa se actualiza)
```

### Store (chatStore.ts)

**Nuevos Estados:**
```typescript
interface ChatState {
  // ... estados existentes
  generatedItinerary: Itinerary | null;
  showMapView: boolean;
  selectedPlace: PlaceInfo | null;
}
```

**Nuevas Acciones:**
- `setGeneratedItinerary(itinerary)` - Guarda itinerario y activa vista de mapa
- `updateItinerary(itinerary)` - Actualiza itinerario existente
- `setSelectedPlace(place)` - Selecciona lugar para destacar
- `resetMapView()` - Vuelve al chat simple

### Tipos de Datos

```typescript
interface Itinerary {
  title: string;
  destination: string;
  days: number;
  budget: string;
  day_plans: DayPlan[];
  summary: string;
}

interface DayPlan {
  day_number: number;
  date?: string;
  morning: PlaceInfo[];
  afternoon: PlaceInfo[];
  evening: PlaceInfo[];
  notes: string;
}

interface PlaceInfo {
  place_id: string;
  name: string;
  address: string;
  rating?: number;
  price_level?: number;
  types: string[];
  photos: string[];
  location: { lat: number; lng: number };
}
```

## Componentes

### 1. ItinerarySummaryCard (NUEVO)

**Ubicación:** `frontend/src/components/chat/ItinerarySummaryCard.tsx`

**Responsabilidad:**
- Mostrar resumen del itinerario en el chat
- Tarjetas colapsables por día
- Fotos en miniatura de lugares
- Botones de acción (Guardar, Ajustar, Compartir)

**Props:**
```typescript
interface ItinerarySummaryCardProps {
  itinerary: Itinerary;
  onPlaceClick: (place: PlaceInfo) => void;
  onSave: () => void;
  onShare: () => void;
}
```

**Características:**
- Reutiliza lógica de DayTimeline.tsx
- Fotos de Google Places API
- Click en lugar centra el mapa
- Animación de expansión/colapso por día

### 2. InteractiveMapView (NUEVO)

**Ubicación:** `frontend/src/components/map/InteractiveMapView.tsx`

**Responsabilidad:**
- Renderizar mapa de Google Maps
- Mostrar marcadores por día (colores diferentes)
- Líneas conectando lugares en orden
- Popups interactivos con información del lugar

**Props:**
```typescript
interface InteractiveMapViewProps {
  itinerary: Itinerary;
  selectedPlace?: PlaceInfo | null;
  onPlaceSelect: (place: PlaceInfo) => void;
}
```

**Características:**
- Marcadores personalizados con números de día
- Popups con foto, nombre, rating, botón "Ver Detalles"
- Zoom automático para mostrar todos los lugares
- Animación al agregar/actualizar marcadores
- Líneas de ruta con draw animation

### 3. ChatInterface (MODIFICAR)

**Cambios:**
- Detectar cuando `generatedItinerary` está presente
- Renderizar `ItinerarySummaryCard` después del último mensaje
- Mantener input activo para refinamientos
- Scroll automático al resumen

### 4. page.tsx - Chat Page (MODIFICAR)

**Cambios:**
- Layout condicional basado en `showMapView`
- Animación CSS para transición de columnas
- Responsive: tabs en móvil

**Layout:**
```tsx
{showMapView ? (
  <div className="flex h-full">
    <div className="w-1/2 animate-slide-in-left">
      <ChatInterface />
    </div>
    <div className="w-1/2 animate-slide-in-right">
      <InteractiveMapView />
    </div>
  </div>
) : (
  <ChatInterface />
)}
```

## Flujo de Datos

### Backend → Frontend

**ChatResponse actualizado:**
```typescript
interface ChatResponse {
  message: string;
  thread_id: string;
  itinerary?: Itinerary;  // Presente cuando se genera itinerario
  needs_clarification: boolean;
  clarification_questions: string[];
}
```

### Detección de Itinerario

**En useChat.ts:**
```typescript
if (response.data.itinerary) {
  setGeneratedItinerary(response.data.itinerary);
  // Esto activa showMapView = true automáticamente
}
```

### Actualización en Tiempo Real

**Cuando el usuario refina:**
1. Usuario: "Cambia el día 2 por algo más relajado"
2. Backend procesa y devuelve itinerario actualizado
3. Frontend detecta cambio y llama `updateItinerary()`
4. Mapa se actualiza con animación (fade out → fade in)

## Interacciones del Usuario

### Escenario 1: Ver Detalles de un Lugar

1. Usuario hace clic en lugar en ItinerarySummaryCard
2. Se llama `setSelectedPlace(place)`
3. Mapa se centra en ese lugar
4. Popup del lugar se abre automáticamente
5. Scroll suave en chat al día correspondiente

### Escenario 2: Hacer Ajustes

1. Usuario escribe refinamiento en el chat
2. Agente procesa y devuelve itinerario actualizado
3. ItinerarySummaryCard se actualiza
4. Mapa anima la transición (marcadores viejos → nuevos)
5. Mensaje del agente explica los cambios

### Escenario 3: Guardar Itinerario

1. Usuario hace clic en "Guardar Itinerario"
2. POST a `/api/v1/itineraries`
3. Toast de confirmación
4. Opción de navegar a `/itineraries/[id]`

## Consideraciones Técnicas

### Performance

- Mapa solo se renderiza cuando `showMapView = true`
- Lazy loading de imágenes de Google Places
- Debounce en actualizaciones del mapa (300ms)
- Memoización de componentes pesados

### Responsive Design

**Desktop (lg+):**
- 50/50 split entre chat y mapa
- Ambos visibles simultáneamente

**Tablet (md):**
- 40/60 split (chat más pequeño)
- Scroll independiente en cada columna

**Mobile (sm):**
- Tabs: "Chat" | "Mapa"
- Toggle entre vistas
- Mapa ocupa pantalla completa cuando está activo

### Animaciones

**Transición de Layout:**
- Mapa: slide-in desde derecha (400ms ease-out)
- Chat: ajuste de ancho suave (400ms ease-out)

**Marcadores:**
- Fade-in con stagger (200ms entre cada uno)
- Bounce al aparecer

**Líneas de Ruta:**
- Draw animation (600ms)
- Stroke-dasharray animado

### Accesibilidad

- Marcadores con aria-labels descriptivos
- Botones con labels claros
- Navegación por teclado en el mapa
- Anuncios de screen reader para cambios de estado
- Contraste adecuado en popups

### Manejo de Errores

**Si Google Maps falla:**
- Mostrar mensaje de error amigable
- Ofrecer lista de lugares sin mapa
- Botón para reintentar carga del mapa

**Si faltan coordenadas:**
- Geocodificar direcciones automáticamente
- Fallback a coordenadas del centro de la ciudad

## Dependencias

### Nuevas Librerías

- `@react-google-maps/api` (ya instalada)
- `framer-motion` (para animaciones suaves) - OPCIONAL

### APIs Requeridas

- Google Maps JavaScript API (ya configurada)
- Google Places API (ya configurada)
- Google Places Photos API (para imágenes)

## Plan de Implementación

### Fase 1: Store y Tipos
1. Actualizar chatStore.ts con nuevos estados
2. Crear tipos TypeScript para Itinerary y PlaceInfo
3. Actualizar useChat.ts para detectar itinerarios

### Fase 2: Componentes Base
1. Crear ItinerarySummaryCard
2. Crear InteractiveMapView
3. Implementar lógica de marcadores y popups

### Fase 3: Integración
1. Modificar ChatInterface para mostrar resumen
2. Actualizar page.tsx con layout condicional
3. Implementar animaciones de transición

### Fase 4: Interacciones
1. Click en lugar → centrar mapa
2. Refinamiento → actualizar mapa
3. Guardar itinerario → API call

### Fase 5: Polish
1. Animaciones suaves
2. Responsive design
3. Manejo de errores
4. Testing

## Criterios de Éxito

- ✅ Transición suave de chat simple a chat+mapa
- ✅ Marcadores visibles con información correcta
- ✅ Popups interactivos funcionando
- ✅ Refinamientos actualizan el mapa en tiempo real
- ✅ Responsive en mobile, tablet y desktop
- ✅ Performance: < 2s para renderizar mapa completo
- ✅ Accesibilidad: navegable por teclado

## Riesgos y Mitigaciones

**Riesgo:** Google Maps API quota excedida
**Mitigación:** Implementar caché de mapas, lazy loading

**Riesgo:** Performance en itinerarios largos (10+ días)
**Mitigación:** Virtualización de lista de días, clustering de marcadores

**Riesgo:** Coordenadas faltantes en lugares
**Mitigación:** Geocoding automático, fallback a centro de ciudad

## Notas Adicionales

- El diseño prioriza la experiencia fluida sobre la complejidad técnica
- Reutiliza componentes existentes donde sea posible
- Mantiene consistencia con el diseño actual de la aplicación
- Escalable para futuras funcionalidades (compartir, exportar PDF, etc.)
