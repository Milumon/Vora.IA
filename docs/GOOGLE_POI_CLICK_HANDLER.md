# Manejo de Clics en POI de Google Maps

## Resumen

Se ha implementado la funcionalidad para que cuando el usuario haga clic en los marcadores POI nativos de Google Maps (negocios, atracciones turísticas, parques, etc.), se muestre un modal con información detallada incluyendo fotos del lugar.

## Implementación

### 1. Estados Agregados

**Archivo:** `frontend/src/components/map/views/FullMapModal.tsx`

```typescript
// Google POI place state
const [selectedGooglePOI, setSelectedGooglePOI] = useState<PlaceInfo | null>(null);
const [googlePOIModalOpen, setGooglePOIModalOpen] = useState(false);
```

### 2. Event Listener en el Mapa

Se agregó un listener de eventos `click` en el callback `onLoad` del mapa:

```typescript
const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    
    // Add click listener for POI markers
    mapInstance.addListener('click', (event: any) => {
        // Check if a POI was clicked
        if (event.placeId) {
            event.stop(); // Prevent default info window
            
            // Fetch place details using Places Service
            const service = new google.maps.places.PlacesService(mapInstance);
            service.getDetails(
                {
                    placeId: event.placeId,
                    fields: [
                        'place_id',
                        'name',
                        'formatted_address',
                        'rating',
                        'price_level',
                        'types',
                        'photos',
                        'geometry',
                        'opening_hours',
                        'website',
                        'formatted_phone_number',
                    ],
                },
                (place, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                        // Convert Google Place to PlaceInfo format
                        const placeInfo: PlaceInfo = {
                            place_id: place.place_id || '',
                            name: place.name || 'Lugar sin nombre',
                            address: place.formatted_address || '',
                            rating: place.rating,
                            price_level: place.price_level,
                            types: place.types || [],
                            photos: place.photos?.map((photo) => 
                                photo.getUrl({ maxWidth: 800, maxHeight: 600 })
                            ) || [],
                            location: {
                                lat: place.geometry?.location?.lat() || 0,
                                lng: place.geometry?.location?.lng() || 0,
                            },
                            why_visit: place.opening_hours?.isOpen() 
                                ? 'Abierto ahora' 
                                : place.opening_hours 
                                ? 'Cerrado' 
                                : undefined,
                        };
                        
                        setSelectedGooglePOI(placeInfo);
                        setGooglePOIModalOpen(true);
                    }
                }
            );
        }
    });
}, []);
```

### 3. Modal Adicional

Se agregó un tercer modal `PlaceDetailModal` para mostrar los detalles del POI de Google:

```typescript
<PlaceDetailModal 
    place={selectedGooglePOI} 
    open={googlePOIModalOpen} 
    onOpenChange={setGooglePOIModalOpen} 
/>
```

## Flujo de Funcionamiento

1. **Usuario activa POIs:** El usuario marca checkboxes como "Atracciones turísticas", "Negocios y comercios", etc.

2. **POIs se muestran en el mapa:** Los marcadores nativos de Google Maps aparecen en el mapa según las categorías seleccionadas.

3. **Usuario hace clic en un POI:** Al hacer clic en cualquier marcador POI de Google Maps:
   - El evento `click` se dispara con un `placeId`
   - Se previene el InfoWindow predeterminado de Google Maps con `event.stop()`

4. **Obtención de detalles:** Se usa el servicio `PlacesService.getDetails()` para obtener:
   - Nombre del lugar
   - Dirección completa
   - Rating y nivel de precio
   - Tipos de lugar
   - **Fotos** (hasta 800x600px)
   - Ubicación geográfica
   - Horarios de apertura
   - Sitio web
   - Teléfono

5. **Conversión de datos:** Los datos de Google Place se convierten al formato `PlaceInfo` usado en la aplicación.

6. **Mostrar modal:** Se abre el modal `PlaceDetailModal` con toda la información y fotos del lugar.

## Campos Solicitados a Places API

```typescript
fields: [
    'place_id',              // ID único del lugar
    'name',                  // Nombre del lugar
    'formatted_address',     // Dirección completa
    'rating',                // Calificación (1-5)
    'price_level',           // Nivel de precio (0-4)
    'types',                 // Tipos de lugar (restaurant, park, etc.)
    'photos',                // Array de fotos
    'geometry',              // Ubicación (lat/lng)
    'opening_hours',         // Horarios de apertura
    'website',               // Sitio web
    'formatted_phone_number' // Teléfono
]
```

## Características

### Fotos de Alta Calidad
- Las fotos se obtienen con `maxWidth: 800` y `maxHeight: 600`
- Se muestran en el modal con navegación de carrusel
- Fallback a placeholder si no hay fotos disponibles

### Estado de Apertura
- Si el lugar tiene horarios, se muestra "Abierto ahora" o "Cerrado"
- Se usa como `why_visit` en el modal

### Prevención de InfoWindow Predeterminado
- `event.stop()` previene que se muestre el InfoWindow nativo de Google
- En su lugar, se muestra nuestro modal personalizado con más información

### Reutilización de Componentes
- Se usa el mismo `PlaceDetailModal` que para los lugares del itinerario
- Mantiene consistencia en la UI/UX

## Categorías POI Soportadas

Cuando el usuario activa estas categorías, puede hacer clic en sus marcadores:

- ✅ Atracciones turísticas (`poi.attraction`)
- ✅ Negocios y comercios (`poi.business`)
- ✅ Centros médicos (`poi.medical`)
- ✅ Parques y plazas (`poi.park`)
- ✅ Lugares de culto (`poi.place_of_worship`)
- ✅ Escuelas y universidades (`poi.school`)
- ✅ Complejos deportivos (`poi.sports_complex`)

## Beneficios

1. **Exploración Mejorada:** Los usuarios pueden explorar lugares cercanos a su itinerario
2. **Información Rica:** Acceso a fotos, ratings, horarios y más información
3. **Integración Nativa:** Usa los datos oficiales de Google Places
4. **UX Consistente:** Mismo modal y diseño que el resto de la aplicación
5. **Sin Costo Adicional:** Usa la misma API key que ya está configurada

## Consideraciones

### Cuota de API
- Cada clic en un POI consume 1 request de Places Details API
- Costo aproximado: $0.017 USD por request
- Considerar implementar caché si hay muchos usuarios

### Performance
- Las fotos se cargan bajo demanda (solo cuando se hace clic)
- No afecta la carga inicial del mapa

### Limitaciones
- Solo funciona cuando los POIs están visibles (checkboxes activados)
- Requiere que el lugar tenga un `placeId` válido en Google Maps

## Próximos Pasos Sugeridos

1. **Caché de Lugares:** Guardar detalles de lugares ya consultados
2. **Agregar al Itinerario:** Botón para agregar el POI al itinerario actual
3. **Compartir Lugar:** Opción para compartir el lugar con otros usuarios
4. **Favoritos:** Permitir guardar lugares favoritos
5. **Filtros Avanzados:** Filtrar por rating, precio, horarios, etc.
