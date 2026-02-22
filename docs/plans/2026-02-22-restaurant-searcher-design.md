# Restaurant Searcher — Diseño

**Fecha:** 2026-02-22  
**Estado:** Aprobado  
**Autor:** Copilot + Joseph Robles

## Resumen

Nuevo nodo LangGraph `search_restaurants` que se ejecuta después de `build_itinerary`. Busca restaurantes cercanos a los lugares del itinerario para almuerzo y cena de cada día, seleccionando los 2 mejores por proximidad, rating y popularidad.

## Contexto

El pipeline actual genera un itinerario día a día con franjas morning/afternoon/evening. Los restaurantes se sugieren vagamente en el prompt de GPT-4 pero sin datos reales de Google Places. Este diseño agrega recomendaciones de restaurantes verificadas con datos reales.

## Decisiones de diseño

- **Nodo separado post-itinerary** (no embebido en build_itinerary) — responsabilidad única
- **Usa `search_nearby()` existente** del GooglePlacesClient, adaptado con coordenadas directas
- **Enriquece con `get_place_details()`** para obtener opening_hours, user_ratings_total, fotos adicionales
- **Se ejecuta en todos los flujos** que llegan a build_itinerary (new_trip + todos los refinements)

## Nuevo tipo: `RestaurantRecommendation`

```python
class RestaurantRecommendation(TypedDict):
    place_id: str
    name: str
    address: str
    rating: Optional[float]
    user_ratings_total: Optional[int]
    opening_hours: Optional[List[str]]       # weekday_text de Google
    price_range: Optional[str]               # "S/ 15 - S/ 40" en PEN
    price_level: Optional[int]               # 1-4 de Google
    types: List[str]
    photos: List[str]
    location: Dict[str, float]               # {lat, lng}
    distance_meters: Optional[float]         # distancia al punto de referencia
    meal_type: Literal["lunch", "dinner"]    # almuerzo o cena
    reference_place: Optional[str]           # nombre del lugar de referencia
```

## Cambios al estado

### DayPlan — nuevos campos
```python
lunch_restaurants: List[RestaurantRecommendation]   # Top 2 para almuerzo
dinner_restaurants: List[RestaurantRecommendation]  # Top 2 para cena
```

### TravelState — nuevo campo
```python
restaurant_recommendations: List[RestaurantRecommendation]
```

## Lógica de búsqueda

### Almuerzo (13:00–15:00)
1. **Punto primario:** Último lugar de `morning[]` → buscar en radio de 6km
2. **Fallback 1:** Primer lugar de `afternoon[]` → buscar en radio de 4km
3. **Fallback 2:** Centro del destino → radio de 6km

### Cena (19:00–23:00)
1. **Punto primario:** Primer lugar de `evening[]` → buscar en radio de 4km
2. **Fallback 1:** Coordenadas del alojamiento (`accommodation_options[0].coordinates`) → radio de 4km
3. **Fallback 2:** Centro del destino → radio de 4km

### Enriquecimiento
Para los top ~5 candidatos de cada búsqueda, se llama a `get_place_details()` para obtener:
- `opening_hours.weekday_text`
- `user_ratings_total`
- Fotos adicionales (hasta 8)

### Conversión price_level → price_range (PEN)
| price_level | price_range |
|---|---|
| 1 | S/ 5 - S/ 20 |
| 2 | S/ 20 - S/ 50 |
| 3 | S/ 50 - S/ 100 |
| 4 | S/ 100+ |

## Ranking

Score compuesto para seleccionar los 2 mejores:

```
score = (proximity_norm × 0.4) + (rating_norm × 0.35) + (popularity_norm × 0.25)
```

- `proximity_norm = 1 - (distance / max_radius)`
- `rating_norm = rating / 5.0`
- `popularity_norm = min(user_ratings_total / 1000, 1.0)`

## Cambios al grafo

```
# ANTES
build_itinerary → END

# DESPUÉS
build_itinerary → search_restaurants → END
```

## Archivos afectados

| Archivo | Acción |
|---|---|
| `backend/app/agents/state.py` | Modificar — agregar RestaurantRecommendation, campos en DayPlan y TravelState |
| `backend/app/agents/tools/google_places.py` | Modificar — nuevo método search_nearby_by_coords(), ampliar get_place_details() |
| `backend/app/agents/nodes/restaurant_searcher.py` | Crear — nuevo nodo LangGraph |
| `backend/app/agents/graph.py` | Modificar — agregar nodo y redirigir edges |

## Output esperado por day_plan

```json
{
  "day_number": 1,
  "morning": [...],
  "afternoon": [...],
  "evening": [...],
  "lunch_restaurants": [
    {
      "place_id": "ChIJ...",
      "name": "Restaurante X",
      "rating": 4.5,
      "user_ratings_total": 324,
      "opening_hours": ["lunes: 11:00–23:00"],
      "price_range": "S/ 20 - S/ 50",
      "photos": ["url1", "url2"],
      "distance_meters": 1200,
      "meal_type": "lunch",
      "reference_place": "Museo de Arte"
    }
  ],
  "dinner_restaurants": [...]
}
```
