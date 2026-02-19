"""
serpapi_client.py
-----------------
Google Flights search via SerpApi.
Captures low-cost carriers (Sky, JetSMART) that Amadeus Self-Service doesn't include.

SerpApi docs: https://serpapi.com/google-flights-api
"""
import httpx
from typing import List, Dict, Optional

from app.config.settings import get_settings
from app.config.logging import get_logger
from app.services.amadeus_client import resolve_iata

logger = get_logger(__name__)
settings = get_settings()

SERPAPI_URL = "https://serpapi.com/search.json"


async def search_google_flights(
    origin_city: str,
    destination_city: str,
    departure_date: str,
    adults: int = 1,
    max_results: int = 8,
) -> List[Dict]:
    """
    Search flights via SerpApi Google Flights engine.

    Args:
        origin_city: City name (e.g. "Lima")
        destination_city: City name (e.g. "Cusco")
        departure_date: Date string YYYY-MM-DD
        adults: Number of adult passengers
        max_results: Max results to return

    Returns:
        List of normalized flight dicts, or [] on error/missing key.
    """
    api_key = settings.SERPAPI_API_KEY
    if not api_key:
        logger.info("serpapi: SERPAPI_API_KEY not set, skipping Google Flights search")
        return []

    origin_iata = resolve_iata(origin_city)
    dest_iata = resolve_iata(destination_city)

    if not origin_iata or not dest_iata:
        logger.info(f"serpapi: No IATA codes for {origin_city} → {destination_city}")
        return []

    logger.info(f"serpapi: Searching Google Flights {origin_iata} → {dest_iata} on {departure_date}")

    params = {
        "engine": "google_flights",
        "departure_id": origin_iata,
        "arrival_id": dest_iata,
        "outbound_date": departure_date,
        "adults": adults,
        "currency": "USD",
        "hl": "es",
        "type": "2",  # One-way
        "api_key": api_key,
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(SERPAPI_URL, params=params)

        if response.status_code != 200:
            logger.warning(f"serpapi: HTTP {response.status_code}: {response.text[:300]}")
            return []

        data = response.json()

        # SerpApi returns results in different structures
        best_flights = data.get("best_flights", [])
        other_flights = data.get("other_flights", [])

        all_flights = best_flights + other_flights
        normalized = []

        for flight_group in all_flights[:max_results]:
            flights_in_group = flight_group.get("flights", [])
            if not flights_in_group:
                continue

            normalized_flight = _normalize_serpapi_flight(
                flight_group, flights_in_group, origin_city, destination_city,
                origin_iata, dest_iata
            )
            if normalized_flight:
                normalized.append(normalized_flight)

        logger.info(f"serpapi: Found {len(normalized)} Google Flights results")
        return normalized

    except Exception as e:
        logger.warning(f"serpapi: Error — {type(e).__name__}: {e}")
        return []


def _normalize_serpapi_flight(
    flight_group: dict,
    segments: list,
    origin_city: str,
    dest_city: str,
    origin_iata: str,
    dest_iata: str,
) -> Optional[Dict]:
    """Normalize a SerpApi flight group into our standard format."""
    try:
        first_seg = segments[0]
        last_seg = segments[-1]

        # Carrier info
        airline = first_seg.get("airline", "")
        airline_logo = first_seg.get("airline_logo", "")

        # Extract carrier code from airline_logo or use flight_number prefix
        flight_number = first_seg.get("flight_number", "")
        carrier_code = ""
        if flight_number and len(flight_number) >= 2:
            carrier_code = flight_number[:2]

        # Times
        departure_time = first_seg.get("departure_airport", {}).get("time", "")
        arrival_time = last_seg.get("arrival_airport", {}).get("time", "")

        # Duration — from the group total_duration (in minutes)
        total_minutes = flight_group.get("total_duration", 0)
        hours = total_minutes // 60
        mins = total_minutes % 60
        duration_text = ""
        if hours:
            duration_text += f"{hours}h"
        if mins:
            duration_text += f" {mins:02d}m"
        duration_text = duration_text.strip() or "--"

        # Price
        price = flight_group.get("price", 0)

        # Stops
        stops = max(0, len(segments) - 1)

        return {
            "airline": airline,
            "carrier_code": carrier_code,
            "departure_time": departure_time,
            "arrival_time": arrival_time,
            "duration_text": duration_text,
            "price": float(price),
            "currency": "USD",
            "stops": stops,
            "origin": origin_city,
            "destination": dest_city,
            "origin_iata": origin_iata,
            "destination_iata": dest_iata,
            "airline_logo": airline_logo,
            "source": "google_flights",
        }

    except Exception as e:
        logger.warning(f"serpapi: Error normalizing flight — {e}")
        return None
