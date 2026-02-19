"""Nodo de búsqueda de lugares turísticos."""
from typing import List, Dict
from app.agents.state import TravelState, PlaceInfo
from app.agents.tools.google_places import GooglePlacesClient
from app.config.logging import get_logger

logger = get_logger(__name__)


async def search_places(state: TravelState) -> dict:
    """Busca lugares relevantes según las preferencias del usuario."""
    
    if not state.get("destination"):
        logger.warning("No hay destino definido, saltando búsqueda de lugares")
        return {"searched_places": []}
    
    places_client = GooglePlacesClient()
    
    # Definir categorías según travel_style
    search_queries = _build_search_queries(
        state.get("travel_style") or [],
        state.get("budget", "medium")
    )
    
    all_places: List[Dict] = []
    
    for query in search_queries:
        try:
            results = await places_client.search_text(
                query=query,
                location=state["destination"],
                max_results=5
            )
            all_places.extend(results)
        except Exception as e:
            logger.error(f"Error buscando '{query}': {e}")
            continue
    
    # Eliminar duplicados y rankear
    unique_places = _deduplicate_places(all_places)
    ranked_places = _rank_places(unique_places, state)
    
    return {
        "searched_places": ranked_places[:30]  # Top 30
    }


def _build_search_queries(travel_style: List[str], budget: str) -> List[str]:
    """Construye queries de búsqueda según preferencias."""
    queries = []
    
    base_queries = {
        "cultural": ["museos", "sitios históricos", "galerías de arte", "centros culturales"],
        "adventure": ["trekking", "actividades al aire libre", "deportes extremos", "tours de aventura"],
        "relaxed": ["spas", "cafés", "parques", "miradores", "plazas"],
        "gastronomy": ["restaurantes típicos", "mercados gastronómicos", "tours culinarios", "comida peruana"],
        "nightlife": ["bares", "discotecas", "vida nocturna", "pubs"]
    }
    
    # Agregar queries según estilo
    # Agregar queries según estilo
    for style in (travel_style or []):
        if style in base_queries:
            queries.extend(base_queries[style])
    
    # Siempre agregar básicos
    queries.extend([
        "atracciones turísticas",
        "lugares imprescindibles",
        "puntos de interés"
    ])
    
    # Ajustar según presupuesto
    if budget == "high":
        queries.extend(["restaurantes gourmet", "hoteles de lujo", "tours premium"])
    elif budget == "low":
        queries.extend(["comida económica", "actividades gratuitas", "mercados locales"])
    
    return queries


def _deduplicate_places(places: List[Dict]) -> List[Dict]:
    """Elimina lugares duplicados basándose en place_id."""
    seen = set()
    unique = []
    
    for place in places:
        place_id = place.get("place_id")
        if place_id and place_id not in seen:
            seen.add(place_id)
            unique.append(place)
    
    return unique


def _rank_places(places: List[Dict], state: TravelState) -> List[Dict]:
    """
    Rankea lugares según relevancia y calidad.
    
    Criterios:
    - Rating (peso: 0.4)
    - Número de reviews implícito en rating (peso: 0.3)
    - Relevancia al travel_style (peso: 0.3)
    """
    budget = state.get("budget", "medium")
    travel_style = state.get("travel_style") or []
    
    def calculate_score(place: Dict) -> float:
        score = 0.0
        
        # Rating (0-5) normalizado a 0-1
        rating = place.get("rating", 0)
        if rating:
            score += (rating / 5.0) * 0.4
        
        # Price level relevancia según presupuesto
        price_level = place.get("price_level", 2)
        if price_level:
            if budget == "low" and price_level <= 2:
                score += 0.3
            elif budget == "medium" and 2 <= price_level <= 3:
                score += 0.3
            elif budget == "high" and price_level >= 3:
                score += 0.3
        
        # Relevancia a travel_style
        place_types = place.get("types", [])
        style_match = 0
        
        style_type_mapping = {
            "cultural": ["museum", "art_gallery", "church", "historical"],
            "adventure": ["park", "natural_feature", "campground"],
            "relaxed": ["spa", "cafe", "park"],
            "gastronomy": ["restaurant", "food", "meal_takeaway"],
            "nightlife": ["bar", "night_club", "casino"]
        }
        
        for style in travel_style:
            if style in style_type_mapping:
                relevant_types = style_type_mapping[style]
                if any(t in place_types for t in relevant_types):
                    style_match += 1
        
        if travel_style:
            score += (style_match / len(travel_style)) * 0.3
        
        return score
    
    # Ordenar por score descendente
    ranked = sorted(places, key=calculate_score, reverse=True)
    
    return ranked
