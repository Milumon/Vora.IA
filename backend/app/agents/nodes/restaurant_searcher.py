"""Nodo de búsqueda de restaurantes para almuerzo y cena."""
from typing import List, Dict, Optional, Tuple
from app.agents.state import TravelState, RestaurantRecommendation
from app.agents.tools.google_places import GooglePlacesClient
from app.config.logging import get_logger

logger = get_logger(__name__)

# ── Constantes ────────────────────────────────────────────────────────────────

LUNCH_PRIMARY_RADIUS = 6000    # 6 km desde último lugar de la mañana
LUNCH_FALLBACK_RADIUS = 4000   # 4 km desde primer lugar de la tarde
DINNER_PRIMARY_RADIUS = 4000   # 4 km desde lugar de la noche
DINNER_FALLBACK_RADIUS = 4000  # 4 km desde alojamiento
DEFAULT_FALLBACK_RADIUS = 6000 # radio por defecto para fallback al centro

MAX_CANDIDATES = 5             # candidatos a enriquecer con get_place_details
TOP_RESTAURANTS = 2            # restaurantes seleccionados por comida

# Pesos del ranking
W_PROXIMITY = 0.40
W_RATING = 0.35
W_POPULARITY = 0.25


# ── Nodo principal ────────────────────────────────────────────────────────────

async def search_restaurants(state: TravelState) -> dict:
    """
    Busca restaurantes cercanos para almuerzo y cena de cada día del itinerario.

    Lógica:
      - Almuerzo: radio 6 km del último lugar de la mañana;
                  fallback 4 km del primer lugar de la tarde;
                  fallback centro del destino.
      - Cena:    radio 4 km del primer lugar de la noche;
                  fallback 4 km del alojamiento;
                  fallback centro del destino.

    Selecciona los 2 mejores por proximidad + rating + popularidad.
    """
    itinerary = state.get("itinerary")
    if not itinerary:
        logger.warning("No hay itinerario, saltando búsqueda de restaurantes")
        return {}

    day_plans = itinerary.get("day_plans", [])
    if not day_plans:
        logger.warning("No hay day_plans, saltando búsqueda de restaurantes")
        return {}

    places_client = GooglePlacesClient()
    destination = state.get("destination", "")

    # Obtener coordenadas del alojamiento (fallback para cena)
    accommodation_coords = _get_accommodation_coords(state)

    # Coordenadas del centro del destino (fallback final)
    destination_coords = await _geocode_destination(places_client, destination)

    all_recommendations: List[Dict] = []

    for day in day_plans:
        day_number = day.get("day_number", 0)

        # ── Almuerzo ──────────────────────────────────────────────────────
        lunch_restaurants = await _search_meal_restaurants(
            places_client=places_client,
            day=day,
            meal_type="lunch",
            accommodation_coords=accommodation_coords,
            destination_coords=destination_coords,
        )
        day["lunch_restaurants"] = lunch_restaurants
        all_recommendations.extend(lunch_restaurants)

        logger.info(
            "Día %d — almuerzo: %d restaurantes encontrados",
            day_number, len(lunch_restaurants),
        )

        # ── Cena ──────────────────────────────────────────────────────────
        dinner_restaurants = await _search_meal_restaurants(
            places_client=places_client,
            day=day,
            meal_type="dinner",
            accommodation_coords=accommodation_coords,
            destination_coords=destination_coords,
        )
        day["dinner_restaurants"] = dinner_restaurants
        all_recommendations.extend(dinner_restaurants)

        logger.info(
            "Día %d — cena: %d restaurantes encontrados",
            day_number, len(dinner_restaurants),
        )

    return {
        "itinerary": itinerary,
        "restaurant_recommendations": all_recommendations,
    }


# ── Búsqueda por comida ──────────────────────────────────────────────────────

async def _search_meal_restaurants(
    places_client: GooglePlacesClient,
    day: Dict,
    meal_type: str,
    accommodation_coords: Optional[Tuple[float, float]],
    destination_coords: Optional[Tuple[float, float]],
) -> List[Dict]:
    """
    Busca restaurantes para una comida específica (almuerzo o cena) de un día.

    Intenta el punto de referencia primario, luego fallback, luego centro destino.
    """
    ref_point, radius, ref_name = _resolve_reference_point(
        day=day,
        meal_type=meal_type,
        accommodation_coords=accommodation_coords,
        destination_coords=destination_coords,
    )

    if ref_point is None:
        logger.warning("No se pudo determinar punto de referencia para %s", meal_type)
        return []

    lat, lng = ref_point

    # Buscar candidatos
    candidates = await places_client.search_nearby_by_coords(
        lat=lat,
        lng=lng,
        keyword="restaurante",
        radius=radius,
        place_type="restaurant",
        max_results=MAX_CANDIDATES * 2,  # pedir más por si hay filtrados
    )

    if not candidates:
        logger.info(
            "Sin candidatos para %s en radio %dm, intentando fallback...",
            meal_type, radius,
        )
        # Intentar fallback con radio más amplio desde el centro
        if destination_coords:
            candidates = await places_client.search_nearby_by_coords(
                lat=destination_coords[0],
                lng=destination_coords[1],
                keyword="restaurante",
                radius=DEFAULT_FALLBACK_RADIUS,
                place_type="restaurant",
                max_results=MAX_CANDIDATES * 2,
            )
            ref_name = "centro del destino"

    if not candidates:
        return []

    # Enriquecer top candidatos con detalles completos
    enriched = await _enrich_candidates(
        places_client, candidates[:MAX_CANDIDATES], radius
    )

    # Rankear y seleccionar top 2
    ranked = _rank_restaurants(enriched, radius)
    top = ranked[:TOP_RESTAURANTS]

    # Formatear como RestaurantRecommendation
    return [
        _to_recommendation(r, meal_type, ref_name)
        for r in top
    ]


# ── Resolución de punto de referencia ─────────────────────────────────────────

def _resolve_reference_point(
    day: Dict,
    meal_type: str,
    accommodation_coords: Optional[Tuple[float, float]],
    destination_coords: Optional[Tuple[float, float]],
) -> Tuple[Optional[Tuple[float, float]], int, str]:
    """
    Determina el punto de referencia, radio y nombre para buscar restaurantes.

    Returns:
        (coords, radio_metros, nombre_referencia)
    """
    if meal_type == "lunch":
        return _resolve_lunch_reference(day, destination_coords)
    else:
        return _resolve_dinner_reference(day, accommodation_coords, destination_coords)


def _resolve_lunch_reference(
    day: Dict,
    destination_coords: Optional[Tuple[float, float]],
) -> Tuple[Optional[Tuple[float, float]], int, str]:
    """
    Almuerzo:
      1. Último lugar de morning[] → 6 km
      2. Primer lugar de afternoon[] → 4 km
      3. Centro del destino → 6 km
    """
    morning = day.get("morning", [])
    if morning:
        last_morning = morning[-1]
        coords = _extract_coords(last_morning)
        if coords:
            return coords, LUNCH_PRIMARY_RADIUS, last_morning.get("name", "lugar de la mañana")

    afternoon = day.get("afternoon", [])
    if afternoon:
        first_afternoon = afternoon[0]
        coords = _extract_coords(first_afternoon)
        if coords:
            return coords, LUNCH_FALLBACK_RADIUS, first_afternoon.get("name", "lugar de la tarde")

    if destination_coords:
        return destination_coords, DEFAULT_FALLBACK_RADIUS, "centro del destino"

    return None, 0, ""


def _resolve_dinner_reference(
    day: Dict,
    accommodation_coords: Optional[Tuple[float, float]],
    destination_coords: Optional[Tuple[float, float]],
) -> Tuple[Optional[Tuple[float, float]], int, str]:
    """
    Cena:
      1. Primer lugar de evening[] → 4 km
      2. Coordenadas del alojamiento → 4 km
      3. Centro del destino → 4 km
    """
    evening = day.get("evening", [])
    if evening:
        first_evening = evening[0]
        coords = _extract_coords(first_evening)
        if coords:
            return coords, DINNER_PRIMARY_RADIUS, first_evening.get("name", "lugar de la noche")

    if accommodation_coords:
        return accommodation_coords, DINNER_FALLBACK_RADIUS, "alojamiento"

    if destination_coords:
        return destination_coords, DINNER_PRIMARY_RADIUS, "centro del destino"

    return None, 0, ""


# ── Enriquecimiento con get_place_details ─────────────────────────────────────

async def _enrich_candidates(
    places_client: GooglePlacesClient,
    candidates: List[Dict],
    search_radius: int,
) -> List[Dict]:
    """
    Enriquece candidatos con datos detallados de Google Places:
    opening_hours, user_ratings_total, fotos adicionales, price_level.
    """
    enriched = []

    for candidate in candidates:
        place_id = candidate.get("place_id")
        if not place_id:
            continue

        try:
            details = await places_client.get_place_details(place_id)
            if details:
                # Merge: mantener distance_meters del candidato, enriquecer con detalles
                merged = {**candidate, **details}
                # Restaurar distance_meters (podría perderse en el merge)
                merged["distance_meters"] = candidate.get("distance_meters", 0)
                enriched.append(merged)
            else:
                enriched.append(candidate)
        except Exception as e:
            logger.warning("Error enriqueciendo %s: %s", place_id, e)
            enriched.append(candidate)

    return enriched


# ── Ranking ───────────────────────────────────────────────────────────────────

def _rank_restaurants(restaurants: List[Dict], max_radius: int) -> List[Dict]:
    """
    Rankea restaurantes por score compuesto:
      score = proximity × 0.40 + rating × 0.35 + popularity × 0.25

    - proximity_norm = 1 - (distance / max_radius)
    - rating_norm = rating / 5.0
    - popularity_norm = min(user_ratings_total / 1000, 1.0)
    """
    def _score(r: Dict) -> float:
        distance = r.get("distance_meters", max_radius)
        proximity_norm = max(0.0, 1.0 - (distance / max_radius)) if max_radius > 0 else 0.0

        rating = r.get("rating") or 0.0
        rating_norm = rating / 5.0

        user_ratings = r.get("user_ratings_total") or 0
        popularity_norm = min(user_ratings / 1000.0, 1.0)

        return (
            proximity_norm * W_PROXIMITY
            + rating_norm * W_RATING
            + popularity_norm * W_POPULARITY
        )

    return sorted(restaurants, key=_score, reverse=True)


# ── Formateo a RestaurantRecommendation ───────────────────────────────────────

def _to_recommendation(
    restaurant: Dict,
    meal_type: str,
    reference_place: str,
) -> Dict:
    """Convierte un diccionario de restaurante enriquecido a RestaurantRecommendation."""
    price_level = restaurant.get("price_level")
    price_range = GooglePlacesClient.price_level_to_range_pen(price_level)

    return {
        "place_id": restaurant.get("place_id", ""),
        "name": restaurant.get("name", ""),
        "address": restaurant.get("address", ""),
        "rating": restaurant.get("rating"),
        "user_ratings_total": restaurant.get("user_ratings_total"),
        "opening_hours": restaurant.get("opening_hours", []),
        "price_range": price_range,
        "price_level": price_level,
        "types": restaurant.get("types", []),
        "photos": restaurant.get("photos", []),
        "location": restaurant.get("location", {"lat": 0, "lng": 0}),
        "distance_meters": restaurant.get("distance_meters"),
        "meal_type": meal_type,
        "reference_place": reference_place,
    }


# ── Utilidades ────────────────────────────────────────────────────────────────

def _extract_coords(place: Dict) -> Optional[Tuple[float, float]]:
    """Extrae (lat, lng) de un lugar si existen coordenadas válidas."""
    location = place.get("location", {})
    lat = location.get("lat")
    lng = location.get("lng")
    if lat is not None and lng is not None and (lat != 0 or lng != 0):
        return (lat, lng)
    return None


def _get_accommodation_coords(state: TravelState) -> Optional[Tuple[float, float]]:
    """Obtiene coordenadas del primer alojamiento del estado."""
    accommodations = state.get("accommodation_options", [])
    if not accommodations:
        return None

    first = accommodations[0]
    coords = first.get("coordinates")
    if not coords:
        return None

    lat = coords.get("latitude") or coords.get("lat")
    lng = coords.get("longitude") or coords.get("lng")
    if lat is not None and lng is not None:
        return (lat, lng)
    return None


async def _geocode_destination(
    places_client: GooglePlacesClient,
    destination: str,
) -> Optional[Tuple[float, float]]:
    """Geocodifica el destino para obtener coordenadas del centro de la ciudad."""
    if not destination:
        return None

    try:
        geocode_result = places_client.client.geocode(f"{destination}, Perú")
        if geocode_result:
            loc = geocode_result[0]["geometry"]["location"]
            return (loc["lat"], loc["lng"])
    except Exception as e:
        logger.warning("Error geocodificando destino '%s': %s", destination, e)

    return None
