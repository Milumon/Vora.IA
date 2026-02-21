# Mejora de Fotos en PlaceDetailModal

## Resumen

Se ha implementado la carga dinámica de fotos adicionales desde Google Places API cuando se abre el modal de detalles de un lugar. Esto permite mostrar hasta 10 fotos en alta resolución (1200x900px) en lugar de limitarse a las fotos iniciales.

## Implementación

### 1. Estados Agregados

**Archivo:** `frontend/src/components/map/overlays/PlaceDetailModal.tsx`

```typescript
const [allPhotos, setAllPhotos] = useState<string[]>([]);
const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
```

- `allPhotos`: Array que contiene todas las URLs de fotos (iniciales + adicionales)
- `isLoadingPhotos`: Indicador de carga mientras se obtienen fotos adicionales

### 2. useEffect para Cargar Fotos

Se agregó un `useEffect` que se ejecuta cuando el modal se abre:

```typescript
useEffect(() => {
    if (!place || !open) {
        setAllPhotos([]);
        setIsLoadingPhotos(false);
        return;
    }

    // Start with existing photos
    const initialPhotos = getPlacePhotos(place.photos, 8, 1200);
    setAllPhotos(initialPhotos);

    // If we have a place_id and Google Maps is loaded, fetch more photos
    if (place.place_id && typeof google !== 'undefined' && google.maps && google.maps.places) {
        setIsLoadingPhotos(true);

        // Create a temporary map element (required by PlacesService)
        const mapDiv = document.createElement('div');
        const service = new google.maps.places.PlacesService(mapDiv);

        service.getDetails(
            {
                placeId: place.place_id,
                fields: ['photos'],
            },
            (result, status) => {
                setIsLoadingPhotos(false);
                
                if (status === google.maps.places.PlacesServiceStatus.OK && result?.photos) {
                    // Get up to 10 photos in high resolution
                    const additionalPhotos = result.photos
                        .slice(0, 10)
                        .map((photo) => photo.getUrl({ maxWidth: 1200, maxHeight: 900 }));
                    
                    // Merge with existing photos, removing duplicates
                    const uniquePhotos = Array.from(new Set([...initialPhotos, ...additionalPhotos]));
                    setAllPhotos(uniquePhotos);
                }
            }
        );
    }
}, [place, open]);
```

### 3. Indicador de Carga

Se agregó un spinner en el contador de fotos para indicar cuando se están cargando fotos adicionales:

```typescript
{currentPhotoIndex + 1} / {totalPhotos}
{isLoadingPhotos && (
    <Loader2 className="h-3 w-3 ml-1.5 animate-spin" />
)}
```

### 4. Mejoras en Thumbnails

- Se aumentó el número de thumbnails visibles de 5 a 8
- Se agregó scroll horizontal para ver todos los thumbnails
- Se agregó `unoptimized` a las imágenes para evitar problemas con URLs externas

## Flujo de Funcionamiento

1. **Modal se abre:**
   - Se cargan las fotos iniciales del objeto `place.photos`
   - Se muestran inmediatamente en el modal

2. **Verificación de API:**
   - Se verifica si existe `place_id`
   - Se verifica si Google Maps API está cargada

3. **Llamada a Places API:**
   - Se crea un servicio temporal de Places
   - Se solicita el campo `photos` del lugar
   - Se muestra un spinner de carga

4. **Procesamiento de fotos:**
   - Se obtienen hasta 10 fotos en resolución 1200x900px
   - Se combinan con las fotos iniciales
   - Se eliminan duplicados usando `Set`

5. **Actualización de UI:**
   - Se actualiza el array de fotos
   - Se oculta el spinner de carga
   - El usuario puede navegar por todas las fotos

## Características

### Alta Resolución
- Fotos principales: 1200x900px (antes 1200x1200)
- Optimizado para pantallas grandes
- Mejor calidad visual

### Carga Progresiva
- Las fotos iniciales se muestran inmediatamente
- Las fotos adicionales se cargan en segundo plano
- No bloquea la interacción del usuario

### Eliminación de Duplicados
- Usa `Set` para evitar fotos repetidas
- Mantiene el orden de las fotos iniciales

### Indicador Visual
- Spinner animado mientras se cargan fotos
- Se muestra en el contador de fotos
- Desaparece cuando termina la carga

### Thumbnails Mejorados
- Muestra hasta 8 thumbnails visibles
- Scroll horizontal para ver más
- Indicador "+X" para fotos adicionales

### Manejo de Errores
- Fallback a fotos iniciales si falla la API
- No rompe la funcionalidad existente
- Manejo silencioso de errores

## Beneficios

1. **Más Contenido Visual:** Hasta 10 fotos en lugar de 1-3
2. **Mejor Experiencia:** Los usuarios pueden ver más del lugar antes de visitarlo
3. **Carga Inteligente:** No afecta el tiempo de apertura del modal
4. **Alta Calidad:** Fotos en resolución 1200x900px
5. **Sin Duplicados:** Algoritmo que elimina fotos repetidas
6. **Feedback Visual:** El usuario sabe cuando se están cargando más fotos

## Consideraciones

### Cuota de API
- Cada apertura de modal consume 1 request de Places Details API
- Solo solicita el campo `photos` (más económico)
- Costo aproximado: $0.017 USD por request

### Performance
- Las fotos se cargan solo cuando se abre el modal
- No afecta la carga inicial de la página
- Carga asíncrona no bloquea la UI

### Caché del Navegador
- Las URLs de fotos se cachean automáticamente
- Aperturas subsecuentes son más rápidas
- Reduce el consumo de API

### Compatibilidad
- Funciona con lugares del itinerario
- Funciona con POIs de Google Maps
- Fallback a fotos iniciales si no hay `place_id`

## Casos de Uso

### 1. Lugares del Itinerario
Cuando el usuario hace clic en "Ver Detalles" de un lugar en su itinerario:
- Se muestran las fotos iniciales del backend
- Se cargan fotos adicionales de Google Places
- Total: hasta 10 fotos de alta calidad

### 2. POIs de Google Maps
Cuando el usuario hace clic en un marcador POI del mapa:
- Se muestran las fotos obtenidas en el primer request
- Se cargan fotos adicionales automáticamente
- Experiencia consistente con lugares del itinerario

### 3. Lugares sin place_id
Si un lugar no tiene `place_id` (poco común):
- Se muestran solo las fotos iniciales
- No se hace llamada adicional a la API
- Funcionalidad degradada gracefully

## Mejoras Futuras Sugeridas

1. **Caché Local:** Guardar fotos en localStorage para evitar requests repetidos
2. **Lazy Loading:** Cargar fotos bajo demanda al navegar
3. **Compresión:** Optimizar tamaño de imágenes para móviles
4. **Galería Completa:** Modo de vista de galería con todas las fotos
5. **Compartir Fotos:** Permitir compartir fotos individuales
6. **Zoom:** Permitir hacer zoom en las fotos
7. **Información de Fotos:** Mostrar créditos y fecha de las fotos

## Código de Ejemplo

### Uso del Modal

```typescript
<PlaceDetailModal 
    place={selectedPlace} 
    open={modalOpen} 
    onOpenChange={setModalOpen} 
/>
```

### Estructura de PlaceInfo

```typescript
interface PlaceInfo {
    place_id: string;        // Requerido para cargar fotos adicionales
    name: string;
    address: string;
    photos: string[];        // Fotos iniciales
    // ... otros campos
}
```

## Testing

Para probar la funcionalidad:

1. Abrir el mapa completo del itinerario
2. Activar checkboxes de POIs (ej: "Atracciones turísticas")
3. Hacer clic en un marcador POI
4. Observar:
   - Fotos iniciales se muestran inmediatamente
   - Spinner aparece en el contador
   - Más fotos se cargan en 1-2 segundos
   - Spinner desaparece
   - Thumbnails muestran todas las fotos disponibles

## Notas Técnicas

- Se usa `document.createElement('div')` para crear un elemento temporal requerido por `PlacesService`
- Las fotos se obtienen con `photo.getUrl({ maxWidth: 1200, maxHeight: 900 })`
- Se usa `Array.from(new Set([...]))` para eliminar duplicados
- El `useEffect` se limpia automáticamente cuando el modal se cierra
- Se agregó `unoptimized` a las imágenes de Next.js para evitar problemas con URLs externas
