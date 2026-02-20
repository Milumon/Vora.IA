# Actualización de Mapas: Tema Blanco y Negro + Controles POI

## Cambios Implementados

### 1. Tema en Blanco y Negro

Se agregó un estilo de mapa en escala de grises (`GRAYSCALE_MAP_STYLES`) en `mapConstants.ts` que proporciona:
- Geometría en tonos grises (#f5f5f5, #eeeeee, #dadada)
- Agua en gris claro (#c9c9c9)
- Carreteras en blanco y gris
- Texto en tonos grises oscuros (#616161, #757575)
- Parques y áreas verdes en gris claro (#e5e5e5)

### 2. Colores de Marcadores Vibrantes

Se actualizaron los colores de los marcadores para tener alto contraste sobre el fondo en escala de grises:

```typescript
export const DAY_COLORS = [
    '#FF1744', // bright red     — Day 1
    '#00E676', // bright green   — Day 2
    '#2979FF', // bright blue    — Day 3
    '#FF9100', // bright orange  — Day 4
    '#D500F9', // bright purple  — Day 5
    '#00E5FF', // bright cyan    — Day 6
    '#FFEA00', // bright yellow  — Day 7
] as const;
```

Estos colores proporcionan:
- Máximo contraste sobre el fondo gris
- Fácil diferenciación entre días
- Excelente visibilidad en diferentes condiciones de luz
- Accesibilidad mejorada

### 3. Efecto de Sonar Vibrante en Marcadores Seleccionados

Se implementó un efecto de sonar con ondas que se propagan desde el centro del marcador:

#### Componente PulsingMarker
Nuevo componente personalizado que usa `OverlayView` de Google Maps para renderizar marcadores HTML con animaciones CSS tipo sonar:

**Características:**
- Marcadores normales: 24px de diámetro, borde blanco de 2px
- Marcadores seleccionados: 32px de diámetro, borde blanco de 3px
- Tres ondas sonar que se propagan secuencialmente desde el centro
- Cada onda tiene un delay de 0.5s respecto a la anterior
- Resplandor interior pulsante para mayor visibilidad
- Sombra con glow del color del día
- Transiciones suaves entre estados

#### Ondas Sonar
Tres anillos concéntricos que se expanden desde el centro del marcador:

1. **Onda 1**: Sin delay, comienza inmediatamente
2. **Onda 2**: Delay de 0.5s
3. **Onda 3**: Delay de 1s

Cada onda:
- Comienza en 32px (tamaño del marcador)
- Se expande hasta 80px
- Opacidad: 1 → 0.5 → 0
- Duración: 2s
- Borde de 3px del color del día

#### Animaciones CSS
Se agregaron dos animaciones personalizadas en `globals.css`:

```css
@keyframes sonar-wave {
  0% {
    width: 32px;
    height: 32px;
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    width: 80px;
    height: 80px;
    opacity: 0;
  }
}

@keyframes inner-glow {
  0%, 100% {
    opacity: 0.2;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.4;
    transform: translate(-50%, -50%) scale(1.1);
  }
}
```

#### Ventajas del Efecto Sonar
- Efecto realista similar a radar o sonar
- Altamente visible con tres ondas secuenciales
- Mantiene el marcador en su posición (no salta)
- Ondas se propagan desde el centro como ondas de agua
- Colores vibrantes que coinciden con el día
- Mejor experiencia de usuario
- Más profesional y sofisticado
- Fácil de identificar el marcador activo
- Inspirado en aplicaciones de mapas premium

### 4. Aplicación del Tema

El tema se aplica en ambos componentes de mapa:

#### CompactMapPreview.tsx
- Usa `GRAYSCALE_MAP_STYLES` en las opciones del mapa
- Marcadores con colores vibrantes (escala 8)
- Mantiene la funcionalidad de vista previa compacta
- Sin interacción del usuario (gestureHandling: 'none')

#### FullMapModal.tsx
- Usa `GRAYSCALE_MAP_STYLES` como base
- Marcadores personalizados con componente `PulsingMarker`
- Efecto sonar con tres ondas que se propagan desde el centro
- Incluye controles interactivos para POIs
- Marcadores más grandes cuando están seleccionados (24px → 32px)
- Ondas secuenciales con delays de 0.5s

### 5. Controles de Visibilidad POI

Se agregó un panel de checkbox en la esquina superior izquierda del mapa completo con las siguientes opciones:

#### Checkboxes Individuales (7 opciones activas)
- **Atracciones turísticas** (`poi.attraction`): Monumentos y lugares de interés general
- **Negocios y comercios** (`poi.business`): Tiendas, restaurantes, hoteles, etc.
- **Centros médicos** (`poi.medical`): Hospitales, clínicas, centros de salud y farmacias
- **Parques y plazas** (`poi.park`): Parques, plazas y reservas naturales
- **Lugares de culto** (`poi.place_of_worship`): Iglesias, templos, mezquitas, etc.
- **Escuelas y universidades** (`poi.school`): Instituciones educativas
- **Complejos deportivos** (`poi.sports_complex`): Coliseos, estadios y centros deportivos

#### Estado por Defecto
Todos los checkboxes están **desactivados** por defecto, ocultando estos POIs en el mapa.

#### Implementación
- Usa componentes shadcn/ui: `Checkbox` y `Label`
- Estado manejado con hooks de React
- Actualización dinámica de estilos del mapa mediante `useEffect`
- Los estilos se combinan con `GRAYSCALE_MAP_STYLES` base
- Panel con scroll para manejar la lista de opciones

### 6. Componentes UI Agregados

Se crearon dos nuevos componentes de shadcn/ui:

#### `checkbox.tsx`
- Basado en `@radix-ui/react-checkbox`
- Estilizado con Tailwind CSS
- Incluye animaciones y estados de accesibilidad
- Soporte para estado `disabled`

#### `label.tsx`
- Basado en `@radix-ui/react-label`
- Asociación semántica con inputs
- Soporte para estados disabled

## Dependencias Instaladas

```bash
pnpm add @radix-ui/react-checkbox @radix-ui/react-label
```

## Uso

### CompactMapPreview
No requiere cambios adicionales. El tema en blanco y negro y los colores vibrantes se aplican automáticamente.

### FullMapModal
Los usuarios pueden:
1. Abrir el mapa completo
2. Ver el panel de controles en la esquina superior izquierda
3. Activar/desactivar tipos específicos de POIs individualmente
4. Hacer clic en marcadores para ver efecto de pulso
5. Los cambios se aplican inmediatamente al mapa

## Notas Técnicas

- Los estilos de mapa se actualizan dinámicamente sin recargar el componente
- La combinación de estilos base + estilos condicionales permite control granular
- Los marcadores de itinerario (con colores vibrantes) se mantienen visibles sobre el tema gris
- El contraste del tema en blanco y negro mejora la legibilidad de los marcadores de colores
- El efecto de sonar vibrante se logra mediante:
  - Componente personalizado `PulsingMarker` con `OverlayView`
  - Marcadores HTML en lugar de símbolos de Google Maps
  - Animaciones CSS con `@keyframes`
  - Tres ondas sonar con diferentes delays (0s, 0.5s, 1s)
  - Cada onda se expande desde 32px hasta 80px
  - Resplandor interior pulsante adicional
  - Sombra con glow que usa el color del día
- Los marcadores seleccionados tienen mayor tamaño y zIndex para destacar
- El panel incluye scroll automático para manejar la lista completa de opciones
- Los colores vibrantes cumplen con estándares de accesibilidad WCAG para contraste
- Las animaciones usan `cubic-bezier` para transiciones suaves y naturales
