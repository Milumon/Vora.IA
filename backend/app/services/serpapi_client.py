"""
serper_client.py  (formerly serpapi_client.py)
----------------------------------------------
Flight + hotel search via Serper.dev Google Search API.

Serper.dev docs: https://serper.dev/
Endpoints:
  POST https://google.serper.dev/search   -> organic search (flights, hotels)
  POST https://google.serper.dev/images   -> image results (hotel photos)

Why Serper.dev instead of SerpApi:
  - This project's API key (SERPAPI_API_KEY env var) is a Serper.dev key
  - Serper.dev uses X-API-KEY header and POST requests
  - SerpApi uses a different key format and GET requests
"""
from __future__ import annotations

import re
import json
import asyncio
from typing import List, Dict, Optional

import httpx

from app.config.settings import get_settings
from app.config.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

SERPER_SEARCH_URL = "https://google.serper.dev/search"
SERPER_IMAGES_URL = "https://google.serper.dev/images"

# ── IATA codes for Peruvian cities ────────────────────────────────────────────
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
    return CITY_IATA.get(city.strip().lower(), "")


def _headers() -> Dict[str, str]:
    return {
        "X-API-KEY": settings.SERPAPI_API_KEY,
        "Content-Type": "application/json",
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  FLIGHTS
# ═══════════════════════════════════════════════════════════════════════════════

async def search_google_flights(
    origin_city: str,
    destination_city: str,
    departure_date: str,
    adults: int = 1,
    max_results: int = 8,
) -> List[Dict]:
    """Search flights via Serper.dev Google organic search."""
    if not settings.SERPAPI_API_KEY:
        logger.info("serper: SERPAPI_API_KEY not set, skipping flights")
        return []

    try:
        from datetime import datetime
        dt = datetime.strptime(departure_date, "%Y-%m-%d")
        date_label = dt.strftime("%d de %B de %Y")
    except Exception:
        date_label = departure_date

    query = f"vuelo {origin_city} {destination_city} precio {date_label} aerolineas"
    logger.info(f"serper/flights: query='{query}'")

    payload = json.dumps({"q": query, "gl": "pe", "hl": "es", "num": 10})

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(SERPER_SEARCH_URL, headers=_headers(), content=payload)

        if response.status_code != 200:
            logger.warning(f"serper/flights: HTTP {response.status_code} — {response.text[:200]}")
            return []

        data = response.json()
        normalized: List[Dict] = []

        for item in data.get("organic", [])[:max_results]:
            f = _parse_flight_from_organic(item, origin_city, destination_city, departure_date)
            if f:
                normalized.append(f)

        for item in data.get("shopping", [])[:max_results]:
            f = _parse_flight_from_shopping(item, origin_city, destination_city, departure_date)
            if f:
                normalized.append(f)

        # Deduplicate by airline
        seen: set = set()
        deduped: List[Dict] = []
        for f in normalized:
            key = f.get("airline", "").lower()
            if key and key not in seen:
                seen.add(key)
                deduped.append(f)

        # Sort cheapest first, put $0 at the end
        has_price = [f for f in deduped if f.get("price", 0) > 0]
        no_price = [f for f in deduped if f.get("price", 0) == 0]
        has_price.sort(key=lambda f: f.get("price", float("inf")))
        deduped = has_price + no_price

        logger.info(f"serper/flights: Found {len(deduped)} results for {origin_city}→{destination_city}")
        return deduped[:max_results]

    except Exception as e:
        logger.warning(f"serper/flights: {type(e).__name__}: {e}")
        return []


def _parse_price_from_text(text: str) -> float:
    """Extract a numeric price from text like 'USD 53.90', '$99', 'S/ 320'."""
    if not text:
        return 0.0
    # USD explicit
    m = re.search(r"USD\s*([\d,]+\.?\d*)", text, re.IGNORECASE)
    if m:
        return _safe_float(m.group(1))
    # Dollar sign
    m = re.search(r"\$\s*([\d,]+\.?\d*)", text)
    if m:
        return _safe_float(m.group(1))
    # PEN sol (convert at 0.27)
    m = re.search(r"S[/\\.]\s*([\d,]+\.?\d*)", text, re.IGNORECASE)
    if m:
        val = _safe_float(m.group(1))
        return round(val * 0.27, 2) if val else 0.0
    # Last resort: standalone number 20–5000
    for n in re.findall(r"\b(\d{2,4}(?:\.\d{1,2})?)\b", text):
        val = _safe_float(n)
        if 20 <= val <= 5000:
            return val
    return 0.0


def _safe_float(s: str) -> float:
    try:
        return float(str(s).replace(",", ""))
    except Exception:
        return 0.0


def _detect_airline(text: str) -> str:
    text_lower = text.lower()
    for name in ["LATAM", "Sky", "JetSMART", "Avianca", "American", "Copa", "Iberia"]:
        if name.lower() in text_lower:
            return name
    return ""


def _airline_booking_url(airline: str, origin: str, dest: str, date: str) -> str:
    al = airline.lower()
    oi, di = resolve_iata(origin), resolve_iata(dest)
    if "latam" in al:
        return f"https://www.latamairlines.com/pe/es/oferta-vuelos?origin={oi}&destination={di}&outbound={date}&adt=1&inf=0&chd=0&cabin=Y&redemption=false&sort=RECOMMENDED"
    if "sky" in al:
        return f"https://www.skyairline.com/es-pe/vuelos?from={oi}&to={di}&date={date}&adults=1"
    if "jetsmart" in al:
        return f"https://jetsmart.com/pe/es/vuelos?departure={oi}&arrival={di}&departureDate={date}&adults=1"
    if "avianca" in al:
        return f"https://www.avianca.com/pe/es/vuelos-baratos/?origen={oi}&destino={di}&fecha-salida={date}"
    return f"https://www.google.com/travel/flights/search?tfs=CBwQAho_{oi}_{di}_{date}"


def _parse_flight_from_organic(item: dict, origin: str, dest: str, date: str) -> Optional[Dict]:
    title = item.get("title", "")
    snippet = item.get("snippet", "")
    link = item.get("link", "")
    combined = f"{title} {snippet}"
    airline = _detect_airline(combined)
    if not airline:
        return None
    price = _parse_price_from_text(combined)
    return {
        "airline": airline,
        "carrier_code": airline[:2].upper(),
        "flight_number": "",
        "departure_time": "",
        "arrival_time": "",
        "duration_text": "--",
        "price": price,
        "currency": "USD",
        "stops": 0,
        "origin": origin,
        "destination": dest,
        "origin_iata": resolve_iata(origin),
        "destination_iata": resolve_iata(dest),
        "airline_logo": f"https://www.gstatic.com/flights/airline_logos/70px/{airline[:2].upper()}.png",
        "booking_url": link or _airline_booking_url(airline, origin, dest, date),
        "source": "serper_organic",
    }


def _parse_flight_from_shopping(item: dict, origin: str, dest: str, date: str) -> Optional[Dict]:
    title = item.get("title", "")
    price_str = item.get("price", "")
    link = item.get("link", "")
    source = item.get("source", "")
    airline = _detect_airline(f"{title} {source}")
    if not airline:
        airline = source or (title.split()[0] if title else "")
    price = _parse_price_from_text(price_str) or _parse_price_from_text(title)
    return {
        "airline": airline,
        "carrier_code": airline[:2].upper() if len(airline) >= 2 else "",
        "flight_number": "",
        "departure_time": "",
        "arrival_time": "",
        "duration_text": "--",
        "price": price,
        "currency": "USD",
        "stops": 0,
        "origin": origin,
        "destination": dest,
        "origin_iata": resolve_iata(origin),
        "destination_iata": resolve_iata(dest),
        "airline_logo": f"https://www.gstatic.com/flights/airline_logos/70px/{airline[:2].upper()}.png" if len(airline) >= 2 else "",
        "booking_url": link or _airline_booking_url(airline, origin, dest, date),
        "source": "serper_shopping",
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  HOTELS
# ═══════════════════════════════════════════════════════════════════════════════

# Hotel-ish keywords — any of these in title+snippet qualifies the result
_HOTEL_SIGNALS = [
    "hotel", "hostal", "hostel", "lodge", "suites", "inn", "resort",
    "posada", "hacienda", "boutique", "inka", "apart", "albergue",
]

# Skip results that are obvious list/aggregator pages
_LIST_TITLE_RE = re.compile(
    r"^(los \d+|las \d+|top \d+|\d+ mejores|\d+ best|mejores hoteles|hoteles en |"
    r"best hotels|hoteles baratos|hoteles con)",
    re.IGNORECASE,
)

def _looks_like_hotel_result(title: str, snippet: str, link: str) -> bool:
    """Return True if this organic result is likely an individual hotel."""
    combined = (title + " " + snippet).lower()
    if not any(s in combined for s in _HOTEL_SIGNALS):
        return False
    # Skip list pages by title pattern
    if _LIST_TITLE_RE.match(title.strip()):
        return False
    return True


async def search_google_hotels(
    destination: str,
    check_in_date: str,
    check_out_date: str,
    adults: int = 1,
    max_results: int = 8,
) -> List[Dict]:
    """
    Search hotels via Serper.dev.
    Runs two complementary queries and image search in parallel.
    Returns normalized AccommodationOption list.
    """
    if not settings.SERPAPI_API_KEY:
        logger.info("serper: SERPAPI_API_KEY not set, skipping hotels")
        return []

    nights = _nights_between(check_in_date, check_out_date)
    logger.info(f"serper/hotels: {destination} | {check_in_date} -> {check_out_date} ({nights}n)")

    # Three parallel calls: two complementary searches + images
    async def _search(q: str) -> dict:
        payload = json.dumps({"q": q, "gl": "pe", "hl": "es", "num": 10})
        try:
            async with httpx.AsyncClient(timeout=20.0) as c:
                r = await c.post(SERPER_SEARCH_URL, headers=_headers(), content=payload)
                return r.json() if r.status_code == 200 else {}
        except Exception:
            return {}

    async def _fetch_images() -> list:
        payload = json.dumps({
            "q": f"hotel {destination} Peru habitacion interior",
            "gl": "pe", "hl": "es", "num": 20
        })
        try:
            async with httpx.AsyncClient(timeout=20.0) as c:
                r = await c.post(SERPER_IMAGES_URL, headers=_headers(), content=payload)
                if r.status_code != 200:
                    return []
                data = r.json()
                imgs: List[str] = []
                for img in data.get("images", []):
                    url = img.get("imageUrl") or img.get("thumbnailUrl") or ""
                    if url:
                        imgs.append(url)
                return imgs
        except Exception:
            return []

    q1 = f"hotel {destination} Peru precio noche {check_in_date}"
    q2 = f"alojamiento {destination} Peru hostal precio USD"

    data1, data2, all_images = await asyncio.gather(
        _search(q1), _search(q2), _fetch_images()
    )

    # Merge organic + shopping from both searches, deduplicate by link
    seen_links: set = set()
    all_results: List[dict] = []
    for result in (
        data1.get("organic", [])
        + data2.get("organic", [])
        + data1.get("shopping", [])
        + data2.get("shopping", [])
    ):
        link = result.get("link", "") or result.get("source", "")
        if link not in seen_links:
            seen_links.add(link)
            all_results.append(result)

    # Parse hotel entries
    hotels: List[Dict] = []
    img_idx = 0
    for item in all_results:
        title = item.get("title", "")
        snippet = item.get("snippet", "")
        link = item.get("link", "") or item.get("source", "")

        if not _looks_like_hotel_result(title, snippet, link):
            continue

        # Clean name — strip review-site domains after dash/pipe
        name = re.sub(
            r"\s*[-|–]\s*(Booking\.com|TripAdvisor|Expedia|Hotels\.com|Agoda|"
            r"Web Oficial|Official Site|Official Website|Sitio Oficial).*$",
            "", title, flags=re.IGNORECASE,
        ).strip()

        if not name or name.lower() == destination.lower():
            continue

        combined = f"{title} {snippet}"
        price_str = item.get("price", "")
        price = (
            _parse_price_from_text(price_str)
            or _parse_price_from_text(snippet)
            or _parse_price_from_text(title)
        )

        # Assign a slice of images, rotating through pool
        images = all_images[img_idx: img_idx + 4] if all_images else []
        img_idx = (img_idx + 4) % max(len(all_images), 1) if all_images else 0

        hotels.append({
            "name": name,
            "type": _detect_hotel_type(combined.lower()),
            "price_per_night": price,
            "total_price": round(price * nights, 2) if price else 0.0,
            "currency": "USD",
            "rating": _extract_rating(snippet),
            "reviews_count": 0,
            "stars": _detect_stars(combined.lower()),
            "images": images,
            "amenities": _extract_amenities(snippet),
            "booking_url": link,
            "address": destination,
            "description": snippet[:200] if snippet else "",
            "check_in": check_in_date,
            "check_out": check_out_date,
            "check_in_time": "14:00",
            "check_out_time": "11:00",
        })

    # Deduplicate by name-prefix
    seen_names: set = set()
    deduped: List[Dict] = []
    for h in hotels:
        first_word = h["name"].lower().split()[0] if h["name"].split() else ""
        if first_word and first_word not in seen_names:
            seen_names.add(first_word)
            deduped.append(h)

    logger.info(f"serper/hotels: Found {len(deduped)} properties in {destination}")
    return deduped[:max_results]


# ── Hotel parsing helpers ─────────────────────────────────────────────────────

def _extract_rating(text: str) -> float:
    m = re.search(r"(\d[.,]\d)\s*(?:/\s*5|stars?|estrellas?)?", text, re.IGNORECASE)
    if m:
        try:
            return min(5.0, float(m.group(1).replace(",", ".")))
        except Exception:
            pass
    return 0.0


def _detect_stars(text: str) -> int:
    m = re.search(r"(\d)\s*estrellas?", text, re.IGNORECASE)
    if m:
        return int(m.group(1))
    m = re.search(r"(\d)\s*stars?", text, re.IGNORECASE)
    if m:
        return int(m.group(1))
    if "luxury" in text or "lujo" in text or "5*" in text:
        return 5
    if "boutique" in text or "4*" in text:
        return 4
    return 0


def _detect_hotel_type(text: str) -> str:
    if "hostel" in text or "hostal" in text:
        return "Hostal"
    if "apart" in text:
        return "Aparthotel"
    if "lodge" in text or "eco" in text:
        return "Lodge"
    if "resort" in text:
        return "Resort"
    if "hacienda" in text:
        return "Hacienda"
    if "posada" in text or "casa" in text:
        return "Casa de Huespedes"
    return "Hotel"


def _extract_amenities(text: str) -> List[str]:
    AMENITY_MAP = {
        "wifi": "WiFi", "wi-fi": "WiFi",
        "desayuno": "Desayuno incluido", "breakfast": "Desayuno incluido",
        "piscina": "Piscina", "pool": "Piscina",
        "estacionamiento": "Estacionamiento", "parking": "Estacionamiento",
        "spa": "Spa",
        "restaurante": "Restaurante", "restaurant": "Restaurante",
        "bar": "Bar",
        "gym": "Gimnasio", "gimnasio": "Gimnasio",
        "aire acondicionado": "Aire acondicionado", "air conditioning": "Aire acondicionado",
        "traslado": "Traslado al aeropuerto", "transfer": "Traslado al aeropuerto",
    }
    text_lower = text.lower()
    found: List[str] = []
    for key, label in AMENITY_MAP.items():
        if key in text_lower and label not in found:
            found.append(label)
    return found[:6]


def _nights_between(check_in: str, check_out: str) -> int:
    try:
        from datetime import datetime
        d1 = datetime.strptime(check_in, "%Y-%m-%d")
        d2 = datetime.strptime(check_out, "%Y-%m-%d")
        return max(1, (d2 - d1).days)
    except Exception:
        return 1


def _parse_price(price_str: str) -> float:
    """Kept for backward compatibility."""
    return _parse_price_from_text(price_str)
