"""
amadeus_client.py
-----------------
Thin async wrapper around the Amadeus Python SDK for flight search.
Uses the free sandbox (test) environment by default.
"""
import asyncio
from functools import lru_cache
from typing import List, Dict, Optional

from app.config.settings import get_settings
from app.config.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

# ── IATA code mapping for Peruvian cities ─────────────────────────────────────
CITY_IATA: Dict[str, str] = {
    "lima": "LIM",
    "cusco": "CUZ",
    "arequipa": "AQP",
    "iquitos": "IQT",
    "piura": "PIU",
    "trujillo": "TRU",
    "chiclayo": "CIX",
    "puno": "JUL",       # Juliaca is the nearest airport
    "juliaca": "JUL",
    "tacna": "TCQ",
    "tarapoto": "TPP",
    "ayacucho": "AYP",
    "cajamarca": "CJA",
    "huancayo": "JAU",    # Jauja airport
    "jauja": "JAU",
    "puerto maldonado": "PEM",
    "tumbes": "TBP",
    "pucallpa": "PCL",
    "huanuco": "HUU",
    "nazca": "",          # No commercial airport
    "huaraz": "",         # No commercial airport
}


def resolve_iata(city: str) -> str:
    """Resolve a city name to its IATA code. Returns '' if unknown."""
    return CITY_IATA.get(city.strip().lower(), "")


def _get_amadeus_client():
    """Create and return an Amadeus client (lazy singleton)."""
    from amadeus import Client
    return Client(
        client_id=settings.AMADEUS_CLIENT_ID,
        client_secret=settings.AMADEUS_CLIENT_SECRET,
        # Sandbox = test environment (free)
        hostname="test",
    )


async def search_flights(
    origin_city: str,
    destination_city: str,
    departure_date: str,
    adults: int = 1,
    max_results: int = 5,
) -> List[Dict]:
    """
    Search flights using Amadeus Flight Offers Search API (sandbox).

    Args:
        origin_city: City name (e.g. "Lima")
        destination_city: City name (e.g. "Cusco")
        departure_date: Date string YYYY-MM-DD
        adults: Number of adult passengers
        max_results: Max number of offers to return

    Returns:
        List of normalized flight option dicts, or [] on error.
    """
    origin_iata = resolve_iata(origin_city)
    dest_iata = resolve_iata(destination_city)

    if not origin_iata or not dest_iata:
        logger.info(
            f"amadeus: No IATA codes for {origin_city}({origin_iata}) → "
            f"{destination_city}({dest_iata}), skipping flight search"
        )
        return []

    logger.info(f"amadeus: Searching flights {origin_iata} → {dest_iata} on {departure_date}")

    try:
        client = _get_amadeus_client()
        from amadeus import ResponseError

        # Run the synchronous SDK call in a thread to avoid blocking
        response = await asyncio.to_thread(
            client.shopping.flight_offers_search.get,
            originLocationCode=origin_iata,
            destinationLocationCode=dest_iata,
            departureDate=departure_date,
            adults=adults,
            max=max_results,
        )

        offers = response.data or []
        logger.info(f"amadeus: Found {len(offers)} flight offers")

        return [_normalize_offer(offer, origin_city, destination_city) for offer in offers]

    except Exception as e:
        logger.warning(f"amadeus: Error searching flights — {type(e).__name__}: {e}")
        return []


def _normalize_offer(offer: dict, origin_city: str, dest_city: str) -> Dict:
    """Normalize a raw Amadeus flight offer into our MobilityOption format."""
    try:
        # First itinerary (outbound)
        itinerary = offer.get("itineraries", [{}])[0]
        segments = itinerary.get("segments", [])

        first_seg = segments[0] if segments else {}
        last_seg = segments[-1] if segments else {}

        # Price
        price_info = offer.get("price", {})
        price = float(price_info.get("grandTotal", 0))
        currency = price_info.get("currency", "EUR")

        # Carrier
        carrier_code = first_seg.get("carrierCode", "")
        airline_name = offer.get("dictionaries", {}).get(
            "carriers", {}
        ).get(carrier_code, carrier_code)

        # Times
        departure_time = first_seg.get("departure", {}).get("at", "")
        arrival_time = last_seg.get("arrival", {}).get("at", "")

        # Duration (ISO 8601 → human readable)
        duration_iso = itinerary.get("duration", "")
        duration_text = _iso_duration_to_text(duration_iso)

        # Stops
        stops = max(0, len(segments) - 1)

        return {
            "airline": airline_name or carrier_code,
            "carrier_code": carrier_code,
            "departure_time": departure_time,
            "arrival_time": arrival_time,
            "duration_text": duration_text,
            "duration_iso": duration_iso,
            "price": price,
            "currency": currency,
            "stops": stops,
            "origin": origin_city,
            "destination": dest_city,
            "origin_iata": first_seg.get("departure", {}).get("iataCode", ""),
            "destination_iata": last_seg.get("arrival", {}).get("iataCode", ""),
        }
    except Exception as e:
        logger.warning(f"amadeus: Error normalizing offer — {e}")
        return {
            "airline": "Unknown",
            "price": 0,
            "currency": "USD",
            "duration_text": "--",
            "stops": 0,
            "origin": origin_city,
            "destination": dest_city,
        }


def _iso_duration_to_text(iso: str) -> str:
    """Convert ISO 8601 duration (PT2H30M) to human-readable (2h 30m)."""
    if not iso:
        return "--"
    import re
    match = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?", iso)
    if not match:
        return iso
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    parts = []
    if hours:
        parts.append(f"{hours}h")
    if minutes:
        parts.append(f"{minutes:02d}m")
    return " ".join(parts) or "--"
