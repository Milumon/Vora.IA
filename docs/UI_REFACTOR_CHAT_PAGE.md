# Refactorización UI/UX - Página de Chat

## Resumen
Se ha refactorizado completamente la página `/chat` para implementar un diseño minimalista en blanco y negro, inspirado en las imágenes de referencia proporcionadas (diseño tipo Layla).

## Nuevo Layout

### Estructura Final
```
┌──────────────────────────────────────────────────────────────┐
│  Chat Sidebar (40%)  │  Columna Derecha (60%) - Scrollable  │
│                      │  ┌────────────────────────────────┐  │
│                      │  │ Header del Itinerario          │  │
│                      │  │ (Imagen + Título + Stats)      │  │
│                      │  ├────────────────────────────────┤  │
│                      │  │ Mapa Compacto                  │  │
│                      │  │ [Ver mapa completo] button     │  │
│                      │  ├────────────────────────────────┤  │
│                      │  │ Timeline Horizontal            │  │
│                      │  │ (Nodos por día)                │  │
│                      │  ├────────────────────────────────┤  │
│                      │  │ Contenido del Día              │  │
│                      │  │ (Galería + Lista de lugares)   │  │
│                      │  ├────────────────────────────────┤  │
│                      │  │ Action Buttons (sticky)        │  │
│                      │  └────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Componentes Creados

#### 1. `ItineraryHeader.tsx`
- **Ubicación**: `frontend/src/components/itinerary/ItineraryHeader.tsx`
- **Función**: Header del itinerario con imagen hero y estadísticas
- **Características**:
  - Imagen hero de 256px de altura
  - Badge "Vista previa"
  - Título del itinerario
  - Grid de estadísticas (días, ciudades, experiencias, hoteles, transportes)
  - Descripción del itinerario

#### 2. `CompactMapPreview.tsx`
- **Ubicación**: `frontend/src/components/map/CompactMapPreview.tsx`
- **Función**: Vista previa compacta del mapa
- **Características**:
  - Mapa no interactivo (gestureHandling: 'none')
  - Marcadores de colores por día
  - Líneas de ruta entre lugares
  - Botón "Ver mapa completo" en esquina inferior derecha
  - Colores diferentes por día del itinerario

#### 3. `DayTimelineHorizontal.tsx`
- **Ubicación**: `frontend/src/components/itinerary/DayTimelineHorizontal.tsx`
- **Función**: Timeline horizontal con nodos por día
- **Características**:
  - Línea horizontal conectando días
  - Nodos circulares para cada día
  - Iconos de ubicación para inicio y fin
  - Iconos de transporte entre días
  - Labels con ubicación y fechas
  - Selección de día activo

#### 4. `DayContent.tsx`
- **Ubicación**: `frontend/src/components/itinerary/DayContent.tsx`
- **Función**: Contenido detallado del día seleccionado
- **Características**:
  - Header con número de día
  - Descripción/notas del día
  - Galería de imágenes (grid 2x2)
  - Lista de lugares con thumbnails
  - Click para ver detalles de cada lugar

#### 5. `FullMapModal.tsx`
- **Ubicación**: `frontend/src/components/map/FullMapModal.tsx`
- **Función**: Modal con mapa completo e interactivo
- **Características**:
  - Modal fullscreen con overlay
  - Mapa interactivo con todos los controles
  - Marcadores de colores por día
  - Info windows con detalles
  - Leyenda de colores por día
  - Botón de cerrar

### Componentes Actualizados

#### 1. `ChatSidebar.tsx`
- Sidebar de chat conversacional
- Header con avatar de Vora
- Área de mensajes con scroll
- Input de mensaje en la parte inferior
- Sugerencias de prompts iniciales

#### 2. `MessageBubble.tsx`
- Burbujas de usuario: fondo negro, texto blanco
- Burbujas del asistente: fondo gris claro, texto negro
- Avatares circulares minimalistas
- Timestamps discretos

#### 3. `MessageInput.tsx`
- Input con fondo gris claro
- Botón de envío negro
- Focus ring negro
- Auto-resize del textarea

#### 4. `page.tsx` (Chat)
- Layout de 2 columnas (40/60)
- Columna derecha scrolleable
- Manejo de estados (con/sin itinerario)
- Botones de acción sticky en la parte inferior

## Paleta de Colores

### Colores Principales
- **Blanco**: `#FFFFFF` - Fondos principales
- **Negro**: `#000000` / `#111111` - Texto principal, elementos de énfasis
- **Gris Claro**: `#F3F4F6` - Fondos secundarios, inputs
- **Gris Medio**: `#6B7280` - Texto secundario
- **Gris Oscuro**: `#1F2937` - Elementos interactivos

### Colores por Día (Marcadores)
1. Verde: `#10B981`
2. Ámbar: `#F59E0B`
3. Rojo: `#EF4444`
4. Púrpura: `#8B5CF6`
5. Azul: `#3B82F6`
6. Rosa: `#EC4899`
7. Teal: `#14B8A6`

## Características del Diseño

### Scroll Vertical
- La columna derecha es completamente scrolleable
- Permite ver todo el contenido del itinerario
- Botones de acción sticky en la parte inferior

### Mapa Compacto
- Vista previa no interactiva
- Botón para abrir modal con mapa completo
- Marcadores de colores por día

### Timeline Horizontal
- Nodos circulares por día
- Línea horizontal conectando días
- Iconos de transporte entre días
- Selección visual del día activo

### Modal de Mapa
- Fullscreen con overlay
- Mapa completamente interactivo
- Leyenda de colores
- Info windows con detalles

## Mejoras de UX

### Navegación
1. Timeline horizontal para navegar entre días
2. Click en lugares para ver detalles
3. Modal de mapa para exploración completa
4. Scroll suave en columna derecha

### Visualización
1. Header con imagen hero atractiva
2. Estadísticas claras del itinerario
3. Galería de imágenes por día
4. Marcadores de colores por día

### Interactividad
1. Hover states sutiles
2. Transiciones suaves
3. Feedback visual claro
4. Modales para detalles

## Archivos Creados

### Nuevos Componentes
- `frontend/src/components/itinerary/ItineraryHeader.tsx`
- `frontend/src/components/map/CompactMapPreview.tsx`
- `frontend/src/components/itinerary/DayTimelineHorizontal.tsx`
- `frontend/src/components/itinerary/DayContent.tsx`
- `frontend/src/components/map/FullMapModal.tsx`
- `frontend/src/components/chat/ChatSidebar.tsx`

### Archivos Actualizados
- `frontend/src/app/[locale]/chat/page.tsx`
- `frontend/src/components/chat/MessageBubble.tsx`
- `frontend/src/components/chat/MessageInput.tsx`
- `frontend/src/app/globals.css`

## Próximos Pasos

### Mejoras Sugeridas
1. Agregar animaciones de transición entre días
2. Implementar drag & drop para reordenar lugares
3. Agregar filtros en el timeline
4. Mejorar la vista móvil (responsive)
5. Agregar modo oscuro (opcional)
6. Optimizar carga de imágenes con lazy loading

### Testing
1. Probar en diferentes tamaños de pantalla
2. Verificar rendimiento con itinerarios largos
3. Testear interacciones entre componentes
4. Validar accesibilidad

## Notas Técnicas

### Dependencias
- React Google Maps API
- Zustand (state management)
- Tailwind CSS
- Lucide Icons
- Next.js 14

### Performance
- Lazy loading de imágenes
- Memoización de componentes pesados
- Scroll virtual para listas largas (considerar)
- Optimización de re-renders

### Accesibilidad
- Contraste adecuado (WCAG AA)
- Navegación por teclado
- ARIA labels en elementos interactivos
- Focus states visibles
