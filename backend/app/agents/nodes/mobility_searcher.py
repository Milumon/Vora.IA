"""
mobility_searcher.py
--------------------
Nodo LangGraph que busca opciones de movilidad entre ciudades:
  1. Vuelos (Amadeus SDK — sandbox gratuito)
  2. Transporte público / buses (Google Routes API — TRANSIT)
  3. Vehículo personal (Google Routes API — DRIVE)

Se ejecuta DESPUÉS de search_places y ANTES de build_itinerary.
Si falla, retorna mobility_options=[] sin bloquear el pipeline.
"""
import asyncio
from datetime import date, timedelta, datetime
from typing import List, Dict, Optional

from app.agents.state import TravelState
from app.services.amadeus_client import search_flights
from app.services.routes_client import compute_route
from app.config.logging import get_logger

logger = get_logger(__name__)

DEFAULT_ORIGIN = "Lima"


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


async def search_mobility(state: TravelState) -> dict:
    """
    Busca opciones de movilidad entre el origen y destino del viaje
    usando Amadeus (vuelos) y Google Routes API (transit/driving).
    """
    destination = state.get("destination")
    if not destination:
        logger.info("mobility_searcher: sin destino, omitiendo")
        return {"mobility_options": []}

    origin = DEFAULT_ORIGIN

    # Si origen==destino, no hay traslado
    if destination.lower().strip() == origin.lower().strip():
        logger.info("mobility_searcher: origen == destino, omitiendo")
        return {"mobility_options": []}

    # ── Fechas ──────────────────────────────────────────────────────────────
    start_date = _parse_date(state.get("start_date"))
    if not start_date:
        start_date = date.today() + timedelta(days=30)

    departure_str = start_date.strftime("%Y-%m-%d")

    logger.info(f"mobility_searcher: {origin} → {destination} | {departure_str}")

    # ── Run all searches in parallel ────────────────────────────────────────
    flight_task = search_flights(
        origin_city=origin,
        destination_city=destination,
        departure_date=departure_str,
        adults=state.get("travelers") or 1,
        max_results=5,
    )
    transit_task = compute_route(origin, destination, mode="TRANSIT")
    drive_task = compute_route(origin, destination, mode="DRIVE")

    flights, transit_route, drive_route = await asyncio.gather(
        flight_task, transit_task, drive_task,
        return_exceptions=True,
    )

    # Handle exceptions gracefully
    if isinstance(flights, Exception):
        logger.warning(f"mobility_searcher: flight search error — {flights}")
        flights = []
    if isinstance(transit_route, Exception):
        logger.warning(f"mobility_searcher: transit route error — {transit_route}")
        transit_route = None
    if isinstance(drive_route, Exception):
        logger.warning(f"mobility_searcher: drive route error — {drive_route}")
        drive_route = None

    # ── Build unified MobilitySegment ───────────────────────────────────────
    best_flight = _pick_best_flight(flights) if flights else None
    best_transit = _build_transit_option(transit_route) if transit_route else None
    best_drive = _build_drive_option(drive_route) if drive_route else None

    # Determine recommended mode
    recommended = _recommend_mode(best_flight, transit_route, drive_route)

    segment = {
        "origin": origin,
        "destination": destination,
        "departure_date": departure_str,
        # Best options
        "best_flight": best_flight,
        "best_transit": best_transit,
        "best_drive": best_drive,
        # Drive metadata
        "drive_distance_km": drive_route.get("distance_km") if drive_route else None,
        "drive_duration_text": drive_route.get("duration_text") if drive_route else None,
        "drive_duration_seconds": drive_route.get("duration_seconds") if drive_route else None,
        # Transit metadata
        "transit_distance_km": transit_route.get("distance_km") if transit_route else None,
        "transit_duration_text": transit_route.get("duration_text") if transit_route else None,
        "transit_duration_seconds": transit_route.get("duration_seconds") if transit_route else None,
        # All options
        "flight_options": flights or [],
        "transit_options": (transit_route.get("transit_details") or []) if transit_route else [],
        # Recommendation
        "recommended_mode": recommended,
    }

    logger.info(
        f"mobility_searcher: ✓ {len(flights)} flights | "
        f"transit={'✓' if transit_route else '✗'} | "
        f"drive={'✓' if drive_route else '✗'} | "
        f"recommended={recommended}"
    )

    return {"mobility_options": [segment]}


def _pick_best_flight(flights: List[Dict]) -> Optional[Dict]:
    """Pick the cheapest flight from the list."""
    if not flights:
        return None
    sorted_flights = sorted(flights, key=lambda f: f.get("price", float("inf")))
    best = sorted_flights[0]
    stops_count = best.get("stops", 0)
    service_label = "Directo" if stops_count == 0 else f"{stops_count} escala(s)"
    return {
        "provider": best.get("airline", ""),
        "departure_time": best.get("departure_time", ""),
        "arrival_time": best.get("arrival_time", ""),
        "duration_text": best.get("duration_text", "--"),
        "price": best.get("price", 0),
        "currency": best.get("currency", "USD"),
        "service_type": service_label,
        "stops": stops_count,
        "booking_url": "",
    }


def _build_transit_option(route: Dict) -> Optional[Dict]:
    """Build a MobilityOption from a transit route."""
    if not route:
        return None
    details = route.get("transit_details", [])
    summary_parts = []
    for d in details[:3]:
        summary_parts.append(f"{d.get('agency', '')} {d.get('line_name', '')}")
    summary = " → ".join(summary_parts) if summary_parts else "Bus / Transporte público"

    return {
        "provider": summary,
        "departure_time": "",
        "arrival_time": "",
        "duration_text": route.get("duration_text", "--"),
        "price": 0,
        "currency": "PEN",
        "service_type": "Transporte público",
        "stops": 0,
        "booking_url": "",
    }


def _build_drive_option(route: Dict) -> Optional[Dict]:
    """Build a drive info dict from a driving route."""
    if not route:
        return None
    return {
        "provider": "Vehículo personal",
        "departure_time": "",
        "arrival_time": "",
        "duration_text": route.get("duration_text", "--"),
        "price": 0,
        "currency": "PEN",
        "service_type": "Auto / Vehículo",
        "stops": 0,
        "booking_url": "",
        "distance_km": route.get("distance_km", 0),
    }


def _recommend_mode(
    flight: Optional[Dict],
    transit: Optional[Dict],
    drive: Optional[Dict],
) -> str:
    """
    Recommend the best mode based on availability and travel time.
    Priority: flight (if available and saves significant time) > bus > drive.
    """
    if flight:
        return "flight"
    if transit:
        return "bus"
    if drive:
        return "drive"
    return "bus"
