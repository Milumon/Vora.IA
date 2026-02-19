"""
serpapi_client.py
-----------------
Unified flight + hotel search via SerpApi.
  - Google Flights engine: captures all carriers including low-cost (Sky, JetSMART)
  - Google Hotels engine: real-time pricing, availability, booking links

SerpApi docs:
  - https://serpapi.com/google-flights-api
  - https://serpapi.com/google-hotels-api
"""
import httpx
from typing import List, Dict, Optional

from app.config.settings import get_settings
from app.config.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

SERPAPI_URL = "https://serpapi.com/search.json"

# ── IATA code mapping for Peruvian cities ─────────────────────────────────────
CITY_IATA: Dict[str, str] = {
    "lima": "LIM",
    "cusco": "CUZ",
    "arequipa": "AQP",
    "iquitos": "IQT",
    "piura": "PIU",
    "trujillo": "TRU",
    "chiclayo": "CIX",
    "puno": "JUL",
    "juliaca": "JUL",
    "tacna": "TCQ",
    "tarapoto": "TPP",
    "ayacucho": "AYP",
    "cajamarca": "CJA",
    "huancayo": "JAU",
    "jauja": "JAU",
    "puerto maldonado": "PEM",
    "tumbes": "TBP",
    "pucallpa": "PCL",
    "huanuco": "HUU",
    "nazca": "",
    "huaraz": "",
}


def resolve_iata(city: str) -> str:
    """Resolve a city name to its IATA code. Returns '' if unknown."""
    return CITY_IATA.get(city.strip().lower(), "")


# ═══════════════════════════════════════════════════════════════════════════════
#  GOOGLE FLIGHTS
# ═══════════════════════════════════════════════════════════════════════════════

async def search_google_flights(
    origin_city: str,
    destination_city: str,
    departure_date: str,
    adults: int = 1,
    max_results: int = 8,
) -> List[Dict]:
    """
    Search flights via SerpApi Google Flights engine.

    Returns:
        List of normalized flight dicts, or [] on error/missing key.
    """
    api_key = settings.SERPAPI_API_KEY
    if not api_key:
        logger.info("serpapi: SERPAPI_API_KEY not set, skipping flights")
        return []

    origin_iata = resolve_iata(origin_city)
    dest_iata = resolve_iata(destination_city)

    if not origin_iata or not dest_iata:
        logger.info(f"serpapi: No IATA codes for {origin_city} → {destination_city}")
        return []

    logger.info(f"serpapi/flights: {origin_iata} → {dest_iata} on {departure_date}")

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
            logger.warning(f"serpapi/flights: HTTP {response.status_code}")
            return []

        data = response.json()

        best_flights = data.get("best_flights", [])
        other_flights = data.get("other_flights", [])
        all_groups = best_flights + other_flights

        normalized = []
        for group in all_groups[:max_results]:
            segments = group.get("flights", [])
            if not segments:
                continue
            result = _normalize_flight(group, segments, origin_city, destination_city, origin_iata, dest_iata)
            if result:
                normalized.append(result)

        logger.info(f"serpapi/flights: Found {len(normalized)} results")
        return normalized

    except Exception as e:
        logger.warning(f"serpapi/flights: {type(e).__name__}: {e}")
        return []


def _normalize_flight(
    group: dict,
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

        airline = first_seg.get("airline", "")
        airline_logo = first_seg.get("airline_logo", "")

        # Extract carrier code from flight number (e.g. "LA2041" → "LA")
        flight_number = first_seg.get("flight_number", "")
        carrier_code = flight_number[:2] if len(flight_number) >= 2 else ""

        departure_time = first_seg.get("departure_airport", {}).get("time", "")
        arrival_time = last_seg.get("arrival_airport", {}).get("time", "")

        total_minutes = group.get("total_duration", 0)
        hours, mins = divmod(total_minutes, 60)
        duration_parts = []
        if hours:
            duration_parts.append(f"{hours}h")
        if mins:
            duration_parts.append(f"{mins:02d}m")
        duration_text = " ".join(duration_parts) or "--"

        price = float(group.get("price", 0))
        stops = max(0, len(segments) - 1)

        return {
            "airline": airline,
            "carrier_code": carrier_code,
            "flight_number": flight_number,
            "departure_time": departure_time,
            "arrival_time": arrival_time,
            "duration_text": duration_text,
            "price": price,
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
        logger.warning(f"serpapi/flights: normalize error — {e}")
        return None


# ═══════════════════════════════════════════════════════════════════════════════
#  GOOGLE HOTELS
# ═══════════════════════════════════════════════════════════════════════════════

async def search_google_hotels(
    destination: str,
    check_in_date: str,
    check_out_date: str,
    adults: int = 1,
    max_results: int = 8,
) -> List[Dict]:
    """
    Search hotels via SerpApi Google Hotels engine.

    Args:
        destination: City or area name (e.g. "Cusco", "Miraflores Lima")
        check_in_date: YYYY-MM-DD
        check_out_date: YYYY-MM-DD
        adults: Number of adult guests
        max_results: Max results to return

    Returns:
        List of normalized hotel dicts, or [] on error.
    """
    api_key = settings.SERPAPI_API_KEY
    if not api_key:
        logger.info("serpapi: SERPAPI_API_KEY not set, skipping hotels")
        return []

    logger.info(f"serpapi/hotels: {destination} | {check_in_date} → {check_out_date}")

    params = {
        "engine": "google_hotels",
        "q": f"hoteles en {destination}",
        "check_in_date": check_in_date,
        "check_out_date": check_out_date,
        "adults": adults,
        "currency": "USD",
        "hl": "es",
        "gl": "pe",
        "api_key": api_key,
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(SERPAPI_URL, params=params)

        if response.status_code != 200:
            logger.warning(f"serpapi/hotels: HTTP {response.status_code}")
            return []

        data = response.json()
        properties = data.get("properties", [])

        normalized = []
        for prop in properties[:max_results]:
            hotel = _normalize_hotel(prop, destination, check_in_date, check_out_date)
            if hotel:
                normalized.append(hotel)

        logger.info(f"serpapi/hotels: Found {len(normalized)} properties")
        return normalized

    except Exception as e:
        logger.warning(f"serpapi/hotels: {type(e).__name__}: {e}")
        return []


def _normalize_hotel(
    prop: dict,
    destination: str,
    check_in: str,
    check_out: str,
) -> Optional[Dict]:
    """Normalize a SerpApi hotel property into our AccommodationOption format."""
    try:
        name = prop.get("name", "Hotel desconocido")

        # Type / category
        hotel_type = prop.get("type", "Hotel")
        if not hotel_type:
            hotel_type = "Hotel"

        # Price
        rate_per_night = prop.get("rate_per_night", {})
        price_str = rate_per_night.get("lowest", "$0")
        # Parse "$123" → 123.0
        price_per_night = _parse_price(price_str)
        total_price = prop.get("total_rate", {}).get("lowest", "")
        total_price_val = _parse_price(total_price) if total_price else price_per_night

        # Rating
        overall_rating = float(prop.get("overall_rating", 0) or 0)
        reviews = int(prop.get("reviews", 0) or 0)
        stars = int(prop.get("hotel_class", 0) or 0)

        # Images
        images = []
        for img in prop.get("images", [])[:6]:
            if isinstance(img, dict):
                url = img.get("original_image") or img.get("thumbnail", "")
                if url:
                    images.append(url)
            elif isinstance(img, str):
                images.append(img)

        # Amenities
        amenities = prop.get("amenities", []) or []
        if isinstance(amenities, list):
            amenities = [str(a) for a in amenities[:8]]
        else:
            amenities = []

        # Booking link
        link = prop.get("link", "")

        # Location / description
        description = prop.get("description", "")
        neighborhood = prop.get("neighborhood", "")
        address = neighborhood or destination

        # Check-in/out from nearby info
        check_in_time = prop.get("check_in_time", "14:00")
        check_out_time = prop.get("check_out_time", "11:00")

        return {
            "name": name,
            "type": hotel_type,
            "price_per_night": price_per_night,
            "total_price": total_price_val,
            "currency": "USD",
            "rating": overall_rating,
            "reviews_count": reviews,
            "stars": stars,
            "images": images,
            "amenities": amenities,
            "booking_url": link,
            "address": address,
            "description": description,
            "check_in": check_in,
            "check_out": check_out,
            "check_in_time": check_in_time,
            "check_out_time": check_out_time,
        }

    except Exception as e:
        logger.warning(f"serpapi/hotels: normalize error — {e}")
        return None


def _parse_price(price_str: str) -> float:
    """Parse price string like '$123', 'USD 89.50', 'S/ 320' to float."""
    if not price_str:
        return 0.0
    import re
    # Remove currency symbols and commas
    cleaned = re.sub(r"[^\d.]", "", str(price_str))
    try:
        return float(cleaned) if cleaned else 0.0
    except ValueError:
        return 0.0
