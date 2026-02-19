"""
accommodation_searcher.py
--------------------------
Nodo LangGraph que busca opciones de alojamiento (hoteles, hostales, Airbnb)
usando SerpApi Google Hotels.

Calcula automáticamente check-in / check-out basado en las fechas del viaje
y retorna una lista normalizada de AccommodationOption.
"""
from datetime import date, timedelta, datetime
from typing import List, Dict, Optional

from app.agents.state import TravelState
from app.services.serpapi_client import search_google_hotels
from app.config.logging import get_logger

logger = get_logger(__name__)


def _parse_date(value) -> date | None:
    """Intenta convertir str/date a date object."""
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"):
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                continue
    return None


async def search_accommodation(state: TravelState) -> dict:
    """
    Busca opciones de alojamiento en el destino del viaje.
    
    Calcula check-in y check-out automáticamente:
    - check_in = start_date del viaje
    - check_out = start_date + days (o end_date si existe)
    """
    destination = state.get("destination")
    if not destination:
        logger.info("accommodation_searcher: sin destino, omitiendo")
        return {"accommodation_options": []}

    # ── Calcular fechas de check-in / check-out ─────────────────────────────
    start_date = _parse_date(state.get("start_date"))
    end_date = _parse_date(state.get("end_date"))
    days = state.get("days") or 3

    if not start_date:
        start_date = date.today() + timedelta(days=30)

    if end_date:
        check_out = end_date
    else:
        check_out = start_date + timedelta(days=days)

    check_in_str = start_date.strftime("%Y-%m-%d")
    check_out_str = check_out.strftime("%Y-%m-%d")
    adults = state.get("travelers") or 1

    logger.info(
        f"accommodation_searcher: {destination} | "
        f"{check_in_str} → {check_out_str} | {adults} adulto(s)"
    )

    # ── Búsqueda de hoteles ─────────────────────────────────────────────────
    hotels = await search_google_hotels(
        destination=destination,
        check_in_date=check_in_str,
        check_out_date=check_out_str,
        adults=adults,
        max_results=8,
    )

    # ── Filtrar y ordenar por calidad ───────────────────────────────────────
    hotels = _rank_hotels(hotels, state.get("budget"))

    logger.info(f"accommodation_searcher: ✓ {len(hotels)} opciones de alojamiento")

    return {"accommodation_options": hotels}


def _rank_hotels(hotels: List[Dict], budget: Optional[str] = None) -> List[Dict]:
    """
    Rank hotels by a balanced score: rating × reviews, filtered by budget.
    
    Budget tiers:
      - low: < $50/night
      - medium: $50–$150/night
      - high: > $100/night (no upper cap)
    """
    if not hotels:
        return []

    # Budget filter
    if budget == "low":
        hotels = [h for h in hotels if h.get("price_per_night", 0) < 50] or hotels[:4]
    elif budget == "medium":
        hotels = [h for h in hotels if 30 <= h.get("price_per_night", 0) <= 150] or hotels
    elif budget == "high":
        hotels = [h for h in hotels if h.get("price_per_night", 0) >= 80] or hotels

    # Score: rating * log(reviews + 1) for balanced quality ranking
    import math
    for h in hotels:
        rating = h.get("rating", 0)
        reviews = h.get("reviews_count", 0)
        h["_score"] = rating * math.log(reviews + 1, 10) if reviews > 0 else rating

    hotels.sort(key=lambda h: h.get("_score", 0), reverse=True)

    # Clean up internal score
    for h in hotels:
        h.pop("_score", None)

    return hotels
