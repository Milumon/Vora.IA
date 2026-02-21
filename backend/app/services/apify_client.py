"""
apify_client.py
---------------
HTTP client for Apify "[New] Fast Airbnb Scraper" actor.

Replaces SerpApi Google Hotels as the accommodation data source.
Always uses locale "es-PE" and formats locations as "{city}, Perú".
"""
import re
import httpx
from typing import List, Dict, Optional

from app.config.settings import get_settings
from app.config.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

APIFY_RUN_SYNC_URL = (
    "https://api.apify.com/v2/acts/tri_angle~new-fast-airbnb-scraper/run-sync-get-dataset-items"
)

# ── Price parsing ─────────────────────────────────────────────────────────────

_PRICE_RE = re.compile(r"[\d,]+(?:\.\d+)?")


def _parse_price_str(text: Optional[str]) -> float:
    """Extract numeric value from strings like '$136', 'S/ 679 total'."""
    if not text:
        return 0.0
    match = _PRICE_RE.search(text.replace(",", ""))
    return float(match.group()) if match else 0.0


_RATING_LABEL_RE = re.compile(r"(\d[,.]\d+)")
_REVIEWS_LABEL_RE = re.compile(r"(\d[\d.,]*)\s*(?:evaluaciones|reviews|reseñas|\))")


def _parse_rating_label(label: Optional[str]) -> tuple[float, int]:
    """Extract (average, reviewsCount) from Apify rating.label or localizedLabel.
    
    Examples:
        'Valoración media de 4,93 sobre 5, 67 evaluaciones' -> (4.93, 67)
        '4,93 (67)' -> (4.93, 67)
    """
    if not label:
        return 0.0, 0
    avg_match = _RATING_LABEL_RE.search(label)
    avg = float(avg_match.group(1).replace(",", ".")) if avg_match else 0.0
    rev_match = _REVIEWS_LABEL_RE.search(label)
    reviews = int(rev_match.group(1).replace(",", "").replace(".", "")) if rev_match else 0
    return avg, reviews


# ── Public API ────────────────────────────────────────────────────────────────

async def search_airbnb_listings(
    location: str,
    check_in: str,
    check_out: str,
    adults: int = 2,
    currency: str = "PEN",
    price_min: int = 0,
    price_max: int = 600,
    max_results: int = 8,
) -> List[Dict]:
    """
    Search Airbnb listings via Apify Fast Airbnb Scraper.

    Parameters
    ----------
    location : str
        City or region name (will be formatted as "{location}, Perú").
    check_in / check_out : str
        Dates in YYYY-MM-DD format.
    adults : int
        Number of adult guests.
    currency : str
        "PEN" or "USD".
    price_min / price_max : int
        Budget range in the selected currency.
    max_results : int
        Cap on returned listings.

    Returns
    -------
    list[dict]
        Normalized AccommodationOption-compatible dicts.
    """
    # Always append ", Perú" if not already present
    location_query = location.strip()
    if not location_query.lower().endswith("perú") and not location_query.lower().endswith("peru"):
        location_query = f"{location_query}, Perú"

    payload: dict = {
        "adults": adults,
        "checkIn": check_in,
        "checkOut": check_out,
        "currency": currency,
        "locale": "es-PE",
        "locationQueries": [location_query],
    }
    # Only add price filters when non-zero — 0 means "no constraint" in Apify
    if price_min > 0:
        payload["priceMin"] = price_min
    if price_max > 0:
        payload["priceMax"] = price_max

    # Remove 'options' block — passed as query params to run-sync-get-dataset-items instead

    logger.info(
        "apify_client: searching Airbnb → %s | %s→%s | %s %d–%d | %d adults",
        location_query, check_in, check_out, currency, price_min, price_max, adults,
    )

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                APIFY_RUN_SYNC_URL,
                params={
                    "token": settings.APIFY_API_TOKEN,
                    "format": "json",
                    "maxItems": max_results,
                },
                json=payload,
                headers={"Content-Type": "application/json"},
            )

            logger.info(
                "apify_client: HTTP %d | Content-Type: %s | Body preview: %s",
                resp.status_code,
                resp.headers.get("content-type", "?"),
                resp.text[:300] if resp.text else "<empty>",
            )

            resp.raise_for_status()

            raw_body = resp.text
            if not raw_body or not raw_body.strip():
                logger.error("apify_client: empty response body from Apify")
                return []

            data = resp.json()
            listings: List[dict] = data if isinstance(data, list) else []

        logger.info("apify_client: received %d raw listings", len(listings))

        # Normalize to AccommodationOption shape
        normalized = [_normalize_listing(item, currency) for item in listings[:max_results]]
        normalized = [n for n in normalized if n is not None]

        logger.info("apify_client: ✓ %d normalized listings", len(normalized))
        return normalized

    except httpx.HTTPStatusError as e:
        logger.error(
            "apify_client: HTTP %d — %s",
            e.response.status_code,
            e.response.text[:500],
        )
        return []
    except Exception as e:
        logger.error("apify_client: unexpected error — %s", e, exc_info=True)
        return []


# ── Normalization ─────────────────────────────────────────────────────────────

def _normalize_listing(raw: dict, fallback_currency: str) -> Optional[Dict]:
    """
    Map Apify's Airbnb listing JSON to our AccommodationOption schema.
    Returns None if critical fields are missing.
    """
    if not raw or not raw.get("name"):
        return None

    pricing = raw.get("pricing") or {}
    rating_obj = raw.get("rating") or {}
    coords = raw.get("coordinates") or {}

    # Parse rating — prefer numeric fields, fall back to label parsing
    avg = rating_obj.get("average") if isinstance(rating_obj, dict) else None
    rev = rating_obj.get("reviewsCount") if isinstance(rating_obj, dict) else None
    if avg is None or rev is None:
        label = (rating_obj.get("localizedLabel") or rating_obj.get("label")) if isinstance(rating_obj, dict) else None
        parsed_avg, parsed_rev = _parse_rating_label(label)
        avg = avg if avg is not None else parsed_avg
        rev = rev if rev is not None else parsed_rev

    # Pricing — qualifier tells us if price is "en total" or "por noche"
    qualifier = pricing.get("qualifier", "") or ""
    total_price = _parse_price_str(pricing.get("total")) or _parse_price_str(pricing.get("price"))
    price_value = _parse_price_str(pricing.get("price"))
    is_total = "total" in qualifier.lower()

    # Extract images — Apify returns [{url, captions}]
    raw_images = raw.get("images") or []
    images: List[str] = []
    for img in raw_images:
        if isinstance(img, dict) and img.get("url"):
            images.append(img["url"])
        elif isinstance(img, str):
            images.append(img)

    return {
        "name": raw.get("name", ""),
        "type": raw.get("title", ""),           # e.g. "Apartment in Cusco"
        "room_type": raw.get("roomType", ""),    # e.g. "entire_home"
        "price_per_night": price_value if not is_total else 0,
        "total_price": total_price,
        "pricing_qualifier": qualifier,          # "en total", "por noche", etc.
        "currency": fallback_currency,
        "rating": avg or 0.0,
        "reviews_count": rev or 0,
        "images": images,
        "badges": raw.get("badges") or [],
        "subtitles": raw.get("subtitles") or [],
        "booking_url": raw.get("url", ""),
        "coordinates": {
            "latitude": coords.get("latitude", 0.0),
            "longitude": coords.get("longitude", 0.0),
        } if coords else None,
        "check_in": raw.get("checkIn", ""),
        "check_out": raw.get("checkOut", ""),
    }
