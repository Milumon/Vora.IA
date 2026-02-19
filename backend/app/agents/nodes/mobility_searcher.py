"""
mobility_searcher.py
--------------------
Nodo LangGraph que busca opciones de movilidad entre ciudades:
  1. Vuelos vía Amadeus SDK (aerolíneas GDS como LATAM)
  2. Vuelos vía SerpApi Google Flights (low-cost: Sky, JetSMART)
  3. Transporte público / buses (Google Routes API — TRANSIT)
  4. Vehículo personal (Google Routes API — DRIVE)

Resultados de Amadeus y SerpApi se fusionan, deduplican por carrier_code,
y se enriquecen con deep links de reserva por aerolínea.
"""
import asyncio
from datetime import date, timedelta, datetime
from typing import List, Dict, Optional

from app.agents.state import TravelState
from app.services.amadeus_client import search_flights
from app.services.serpapi_client import search_google_flights
from app.services.routes_client import compute_route
from app.services.airline_deeplinks import enrich_flight_with_deeplink
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


def _merge_flights(amadeus_flights: List[Dict], serpapi_flights: List[Dict]) -> List[Dict]:
    """
    Merge and deduplicate flights from Amadeus and SerpApi.
    
    Strategy:
    - Use carrier_code as dedup key
    - If both sources have the same carrier, prefer SerpApi (more accurate pricing)
    - SerpApi captures low-cost (Sky, JetSMART) that Amadeus misses
    - Amadeus captures GDS-only fares and schedule details
    """
    # Index SerpApi flights by carrier_code for quick lookup
    serpapi_by_carrier: Dict[str, Dict] = {}
    for f in serpapi_flights:
        cc = f.get("carrier_code", "")
        if cc and cc not in serpapi_by_carrier:
            serpapi_by_carrier[cc] = f

    merged: List[Dict] = []
    seen_carriers: set = set()

    # Add SerpApi flights first (they have real prices for low-cost)
    for f in serpapi_flights:
        cc = f.get("carrier_code", "")
        key = f"{cc}-{f.get('departure_time', '')}"
        if key not in seen_carriers:
            seen_carriers.add(key)
            merged.append(f)

    # Add Amadeus flights that aren't already covered
    for f in amadeus_flights:
        cc = f.get("carrier_code", "")
        dep = f.get("departure_time", "")
        key = f"{cc}-{dep}"
        if key not in seen_carriers:
            seen_carriers.add(key)
            merged.append(f)

    # Sort by price
    merged.sort(key=lambda f: f.get("price", float("inf")))
    return merged


async def search_mobility(state: TravelState) -> dict:
    """
    Busca opciones de movilidad entre el origen y destino del viaje.
    Ejecuta Amadeus + SerpApi (vuelos) y Google Routes API (transit/driving) en paralelo.
    """
    destination = state.get("destination")
    if not destination:
        logger.info("mobility_searcher: sin destino, omitiendo")
        return {"mobility_options": []}

    origin = DEFAULT_ORIGIN

    if destination.lower().strip() == origin.lower().strip():
        logger.info("mobility_searcher: origen == destino, omitiendo")
        return {"mobility_options": []}

    # ── Fechas ──────────────────────────────────────────────────────────────
    start_date = _parse_date(state.get("start_date"))
    if not start_date:
        start_date = date.today() + timedelta(days=30)

    departure_str = start_date.strftime("%Y-%m-%d")
    adults = state.get("travelers") or 1

    logger.info(f"mobility_searcher: {origin} → {destination} | {departure_str}")

    # ── Run ALL searches in parallel ────────────────────────────────────────
    amadeus_task = search_flights(
        origin_city=origin,
        destination_city=destination,
        departure_date=departure_str,
        adults=adults,
        max_results=5,
    )
    serpapi_task = search_google_flights(
        origin_city=origin,
        destination_city=destination,
        departure_date=departure_str,
        adults=adults,
        max_results=8,
    )
    transit_task = compute_route(origin, destination, mode="TRANSIT")
    drive_task = compute_route(origin, destination, mode="DRIVE")

    amadeus_flights, serpapi_flights, transit_route, drive_route = await asyncio.gather(
        amadeus_task, serpapi_task, transit_task, drive_task,
        return_exceptions=True,
    )

    # Handle exceptions gracefully
    if isinstance(amadeus_flights, Exception):
        logger.warning(f"mobility_searcher: Amadeus error — {amadeus_flights}")
        amadeus_flights = []
    if isinstance(serpapi_flights, Exception):
        logger.warning(f"mobility_searcher: SerpApi error — {serpapi_flights}")
        serpapi_flights = []
    if isinstance(transit_route, Exception):
        logger.warning(f"mobility_searcher: transit route error — {transit_route}")
        transit_route = None
    if isinstance(drive_route, Exception):
        logger.warning(f"mobility_searcher: drive route error — {drive_route}")
        drive_route = None

    # ── Merge + deduplicate flights from both sources ───────────────────────
    all_flights = _merge_flights(amadeus_flights, serpapi_flights)

    # ── Enrich every flight with deep link + airline logo ───────────────────
    for flight in all_flights:
        enrich_flight_with_deeplink(flight, departure_str, adults)

    logger.info(
        f"mobility_searcher: Merged {len(amadeus_flights)} Amadeus + "
        f"{len(serpapi_flights)} SerpApi = {len(all_flights)} total flights"
    )

    # ── Build unified MobilitySegment ───────────────────────────────────────
    best_flight = _pick_best_flight(all_flights) if all_flights else None
    best_transit = _build_transit_option(transit_route) if transit_route else None
    best_drive = _build_drive_option(drive_route) if drive_route else None

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
        # All flight options (merged, with deep links)
        "flight_options": all_flights,
        "transit_options": (transit_route.get("transit_details") or []) if transit_route else [],
        # Recommendation
        "recommended_mode": recommended,
    }

    logger.info(
        f"mobility_searcher: ✓ {len(all_flights)} flights | "
        f"transit={'✓' if transit_route else '✗'} | "
        f"drive={'✓' if drive_route else '✗'} | "
        f"recommended={recommended}"
    )

    return {"mobility_options": [segment]}


def _pick_best_flight(flights: List[Dict]) -> Optional[Dict]:
    """Pick the cheapest flight from the merged list."""
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
        "booking_url": best.get("booking_url", ""),
        "airline_logo": best.get("airline_logo", ""),
        "carrier_code": best.get("carrier_code", ""),
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
    Priority: flight (if available) > bus > drive.
    """
    if flight:
        return "flight"
    if transit:
        return "bus"
    if drive:
        return "drive"
    return "bus"
