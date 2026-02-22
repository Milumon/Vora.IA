"""
accommodation_searcher.py
--------------------------
Nodo LangGraph que busca opciones de alojamiento (Airbnb) usando Apify
"[New] Fast Airbnb Scraper".

Calcula automáticamente check-in / check-out basado en las fechas del viaje
y retorna una lista normalizada de AccommodationOption.
"""
from datetime import date, timedelta, datetime
from typing import List, Dict, Optional
import math

from app.agents.state import TravelState
from app.services.apify_client import search_airbnb_listings
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
    Busca opciones de alojamiento Airbnb en el destino del viaje via Apify.

    Calcula check-in y check-out automáticamente:
    - check_in = start_date del viaje (o state.check_in si viene del frontend)
    - check_out = start_date + days (o state.check_out / end_date)
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
        # Default: 30 days from now (future trip)
        start_date = date.today() + timedelta(days=30)

    if end_date:
        check_out = end_date
    else:
        check_out = start_date + timedelta(days=days)

    check_in_str = start_date.strftime("%Y-%m-%d")
    check_out_str = check_out.strftime("%Y-%m-%d")
    adults = state.get("travelers") or 2

    # ── Currency & budget from state ────────────────────────────────────────
    currency = state.get("currency") or "PEN"
    budget_min = 0  # Siempre 0 como solicitado
    budget_max = state.get("budget_max") or 0

    # Si hay budget_total, usar el 90% para alojamiento
    budget_total = state.get("budget_total")
    if budget_total:
        # 90% del presupuesto total para alojamiento
        accommodation_budget = int(budget_total * 0.9)
        # Dividir por número de noches para obtener precio máximo por noche
        nights = (check_out - start_date).days
        if nights > 0:
            budget_max = accommodation_budget // nights
            logger.info(
                "accommodation_searcher: usando 90%% del presupuesto total (%d %s) = %d %s para alojamiento → %d %s/noche",
                budget_total, currency, accommodation_budget, currency, budget_max, currency
            )

    # If using the old string-based budget, map to price ranges (fallback)
    if not budget_total:
        budget_str = state.get("budget")
        if budget_str and not state.get("budget_max"):
            if currency == "PEN":
                budget_ranges = {
                    "low": (0, 200),
                    "medium": (150, 500),
                    "high": (400, 2000),
                }
            else:  # USD
                budget_ranges = {
                    "low": (0, 60),
                    "medium": (40, 150),
                    "high": (100, 600),
                }
            budget_min, budget_max = budget_ranges.get(budget_str, (0, 600))

    logger.info(
        "accommodation_searcher: %s | %s → %s | %d adulto(s) | %s %d–%d",
        destination, check_in_str, check_out_str, adults,
        currency, budget_min, budget_max,
    )

    # ── Búsqueda en Apify ───────────────────────────────────────────────────
    listings = await search_airbnb_listings(
        location=destination,
        check_in=check_in_str,
        check_out=check_out_str,
        adults=adults,
        currency=currency,
        price_min=budget_min,
        price_max=budget_max,
        max_results=12,
    )

    # ── Filtrar y ordenar por calidad ───────────────────────────────────────
    listings = _rank_listings(listings)

    logger.info("accommodation_searcher: ✓ %d opciones de alojamiento", len(listings))

    return {"accommodation_options": listings}


def _rank_listings(listings: List[Dict]) -> List[Dict]:
    """
    Rank listings by a balanced score: rating × log(reviews + 1).
    """
    if not listings:
        return []

    for h in listings:
        rating = h.get("rating") or 0
        reviews = h.get("reviews_count") or 0
        h["_score"] = rating * math.log(reviews + 1, 10) if reviews > 0 else rating

    listings.sort(key=lambda h: h.get("_score", 0), reverse=True)

    # Clean up internal score
    for h in listings:
        h.pop("_score", None)

    return listings
