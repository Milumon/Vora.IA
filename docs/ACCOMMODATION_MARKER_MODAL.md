# Marcadores de Alojamiento y Modal de Detalles

## Resumen de Cambios

Se ha implementado un nuevo sistema de marcadores para alojamientos en el mapa y un modal unificado para mostrar los detalles de las opciones de alojamiento.

## Cambios Realizados

### 1. Nuevo Icono de Marcador de Alojamiento

**Archivo:** `frontend/src/components/map/shared/mapConstants.ts`

- Se creó la función `getAccommodationMarkerIcon()` que genera un marcador circular negro con un icono de edificio/casa blanco en el centro
- El icono tiene un tamaño de 40x40 píxeles con un borde blanco de 2.5px
- Se deprecó `getAirbnbMarkerIcon()` que ahora apunta a la nueva función para mantener compatibilidad

```typescript
export function getAccommodationMarkerIcon(): google.maps.Icon {
    // Marcador circular negro con icono de edificio blanco
    const svg = `...`;
    return {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20),
    };
}
```

### 2. Nuevo Modal de Detalles de Alojamiento

**Archivo:** `frontend/src/components/map/overlays/AccommodationDetailModal.tsx`

Modal unificado que muestra información completa de cualquier opción de alojamiento:

**Características:**
- Galería de fotos con navegación (flechas izquierda/derecha)
- Miniaturas de las primeras 8 fotos
- Contador de fotos actual/total
- Información de precio (por noche y total)
- Tipo de alojamiento con icono de ubicación
- Badges de reconocimientos (Guest favorite, etc.)
- Fechas de check-in y check-out con icono de calendario
- Rating con estrellas y número de reseñas
- Detalles adicionales (subtítulos)
- Botón CTA para abrir en Airbnb

**Diseño:**
- Basado en el diseño de `HotelDetailModal.tsx`
- Responsive: 95vw en móvil, max-w-2xl en desktop
- Altura máxima: 90vh con scroll interno
- Soporte para modo oscuro

### 3. Actualización de FullMapModal

**Archivo:** `frontend/src/components/map/views/FullMapModal.tsx`

**Cambios:**
- Se agregó estado para el modal de alojamiento:
  ```typescript
  const [selectedAccommodation, setSelectedAccommodation] = useState<AccommodationOption | null>(null);
  const [accommodationModalOpen, setAccommodationModalOpen] = useState(false);
  ```

- Se actualizó `accommodationMarkers` para incluir el objeto completo de alojamiento:
  ```typescript
  const markers: Array<{ 
    lat: number; 
    lng: number; 
    name: string; 
    accommodation: AccommodationOption 
  }> = [];
  ```

- Los marcadores ahora son clickeables y abren el modal:
  ```typescript
  <Marker
    onClick={() => {
      setSelectedAccommodation(m.accommodation);
      setAccommodationModalOpen(true);
    }}
  />
  ```

- Se importa y renderiza el nuevo modal:
  ```typescript
  <AccommodationDetailModal 
    accommodation={selectedAccommodation} 
    open={accommodationModalOpen} 
    onOpenChange={setAccommodationModalOpen} 
  />
  ```

### 4. Actualización de CompactMapPreview

**Archivo:** `frontend/src/components/map/views/CompactMapPreview.tsx`

**Cambios:**
- Se actualizó el import para usar `getAccommodationMarkerIcon` en lugar de `getAirbnbMarkerIcon`
- Los marcadores ahora usan el nuevo icono de edificio

### 5. Actualización de AccommodationCard

**Archivo:** `frontend/src/components/itinerary/cards/AccommodationCard.tsx`

**Cambios:**
- Se agregó estado para el nuevo modal:
  ```typescript
  const [selectedAccommodation, setSelectedAccommodation] = useState<AccommodationOption | null>(null);
  const [accommodationModalOpen, setAccommodationModalOpen] = useState(false);
  ```

- Se actualizó `handleImageClick` para usar el nuevo modal:
  ```typescript
  const handleImageClick = (hotel: AccommodationOption) => {
    setSelectedAccommodation(hotel);
    setAccommodationModalOpen(true);
  };
  ```

- Se mantiene `HotelDetailModal` para compatibilidad hacia atrás
- Se renderiza el nuevo `AccommodationDetailModal`

## Beneficios

1. **Consistencia Visual:** Todos los alojamientos usan el mismo icono de marcador
2. **Mejor UX:** Los usuarios pueden hacer clic en los marcadores para ver detalles completos
3. **Modal Unificado:** Un solo componente para mostrar detalles de alojamiento en lugar de múltiples modales
4. **Diseño Coherente:** El modal sigue el mismo patrón de diseño que otros modales de la aplicación
5. **Responsive:** Funciona bien en dispositivos móviles y desktop
6. **Accesibilidad:** Incluye labels ARIA y navegación por teclado

## Uso

### En el Mapa
Los usuarios pueden:
1. Ver marcadores negros con icono de edificio para cada alojamiento
2. Hacer clic en cualquier marcador para ver detalles completos
3. Navegar por las fotos del alojamiento
4. Ver información de precio, rating, y amenidades
5. Hacer clic en "Ver en Airbnb" para abrir la página de reserva

### En las Tarjetas de Itinerario
Los usuarios pueden:
1. Hacer clic en las imágenes del carrusel de cualquier opción de alojamiento
2. Ver el modal con todos los detalles
3. Comparar diferentes opciones fácilmente

## Compatibilidad

- Se mantiene `HotelDetailModal` para compatibilidad hacia atrás
- `getAirbnbMarkerIcon()` ahora es un alias de `getAccommodationMarkerIcon()`
- No se requieren cambios en el backend o en los tipos de datos

## Próximos Pasos Sugeridos

1. Considerar agregar animación de hover en los marcadores
2. Agregar tooltip con información básica al pasar el mouse sobre el marcador
3. Implementar clustering de marcadores si hay muchos alojamientos cercanos
4. Agregar filtros para mostrar/ocultar marcadores de alojamiento
