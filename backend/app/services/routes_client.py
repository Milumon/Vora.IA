"""
routes_client.py
----------------
Google Routes API client for computing driving and transit routes
between two locations. Uses the Routes API v2 (computeRoutes).

Docs: https://developers.google.com/maps/documentation/routes/compute_route_directions
"""
import httpx
from typing import Dict, Optional, Literal

from app.config.settings import get_settings
from app.config.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

ROUTES_API_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"


async def compute_route(
    origin: str,
    destination: str,
    mode: Literal["DRIVE", "TRANSIT"] = "TRANSIT",
) -> Optional[Dict]:
    """
    Compute a route between two locations using Google Routes API.

    Args:
        origin: City name or "lat,lng" string
        destination: City name or "lat,lng" string
        mode: "DRIVE" for personal vehicle, "TRANSIT" for bus/train

    Returns:
        Dict with route info or None on error:
        {
            "distance_km": float,
            "duration_text": str,
            "duration_seconds": int,
            "summary": str,
            "steps": list[dict],    # for transit: transit line details
        }
    """
    api_key = settings.GOOGLE_MAPS_API_KEY
    if not api_key:
        logger.warning("routes_client: GOOGLE_MAPS_API_KEY not set")
        return None

    logger.info(f"routes_client: Computing {mode} route {origin} → {destination}")

    # Build the request body
    body = _build_request_body(origin, destination, mode)

    # Field mask — request only what we need
    field_mask = "routes.duration,routes.distanceMeters,routes.polyline,routes.legs.steps.transitDetails"
    if mode == "DRIVE":
        field_mask = "routes.duration,routes.distanceMeters,routes.polyline"

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": field_mask,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(ROUTES_API_URL, json=body, headers=headers)

        if response.status_code != 200:
            logger.warning(
                f"routes_client: API returned {response.status_code}: {response.text[:300]}"
            )
            return None

        data = response.json()
        routes = data.get("routes", [])
        if not routes:
            logger.info(f"routes_client: No routes found for {mode} {origin} → {destination}")
            return None

        route = routes[0]
        return _parse_route(route, mode, origin, destination)

    except Exception as e:
        logger.warning(f"routes_client: Error — {type(e).__name__}: {e}")
        return None


def _build_request_body(origin: str, destination: str, mode: str) -> dict:
    """Build the Routes API request body."""
    body: dict = {
        "origin": _build_waypoint(origin),
        "destination": _build_waypoint(destination),
        "travelMode": mode,
        "computeAlternativeRoutes": False,
        "languageCode": "es",
        "units": "METRIC",
    }

    if mode == "TRANSIT":
        body["transitPreferences"] = {
            "routingPreference": "FEWER_TRANSFERS",
        }

    return body


def _build_waypoint(location: str) -> dict:
    """Build a waypoint from a city name or lat,lng string."""
    # Check if it's a lat,lng format
    parts = location.split(",")
    if len(parts) == 2:
        try:
            lat = float(parts[0].strip())
            lng = float(parts[1].strip())
            return {
                "location": {
                    "latLng": {
                        "latitude": lat,
                        "longitude": lng,
                    }
                }
            }
        except ValueError:
            pass

    # Fall back to address string
    return {"address": location}


def _parse_route(route: dict, mode: str, origin: str, destination: str) -> Dict:
    """Parse a Routes API route response into our format."""
    # Duration: comes as "Xs" string (e.g. "28800s")
    duration_str = route.get("duration", "0s")
    duration_seconds = int(duration_str.replace("s", "")) if duration_str else 0
    duration_text = _seconds_to_text(duration_seconds)

    # Distance
    distance_meters = route.get("distanceMeters", 0)
    distance_km = round(distance_meters / 1000, 1)

    result: Dict = {
        "origin": origin,
        "destination": destination,
        "distance_km": distance_km,
        "duration_text": duration_text,
        "duration_seconds": duration_seconds,
        "summary": f"{origin} → {destination} ({duration_text}, {distance_km} km)",
    }

    # Extract transit details if available
    if mode == "TRANSIT":
        transit_steps = _extract_transit_steps(route)
        result["transit_details"] = transit_steps

    return result


def _extract_transit_steps(route: dict) -> list:
    """Extract transit line details from route legs."""
    steps = []
    for leg in route.get("legs", []):
        for step in leg.get("steps", []):
            transit = step.get("transitDetails")
            if transit:
                stop_details = transit.get("stopDetails", {})
                transit_line = transit.get("transitLine", {})
                steps.append({
                    "line_name": transit_line.get("nameShort", "")
                               or transit_line.get("name", "Transit"),
                    "vehicle_type": transit_line.get("vehicle", {}).get("type", "BUS"),
                    "agency": (transit_line.get("agencies") or [{}])[0].get("name", ""),
                    "departure_stop": stop_details.get("departureStop", {}).get("name", ""),
                    "arrival_stop": stop_details.get("arrivalStop", {}).get("name", ""),
                    "num_stops": transit.get("stopCount", 0),
                })
    return steps


def _seconds_to_text(seconds: int) -> str:
    """Convert seconds to human-readable duration."""
    if seconds <= 0:
        return "--"
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    parts = []
    if hours:
        parts.append(f"{hours}h")
    if minutes:
        parts.append(f"{minutes:02d}m")
    return " ".join(parts) or "< 1m"
