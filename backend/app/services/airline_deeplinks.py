"""
airline_deeplinks.py
--------------------
Diccionario de aerolíneas con deep links de reserva.
Soporta las principales operadoras de vuelos domésticos en Perú.
"""
from typing import Dict, Optional
from app.config.logging import get_logger

logger = get_logger(__name__)

# ── Airline deep link templates ───────────────────────────────────────────────
# Placeholders: {origen}, {destino}, {fecha} (YYYY-MM-DD), {adultos}

AIRLINE_DEEPLINKS: Dict[str, Dict] = {
    "LA": {
        "nombre": "LATAM Airlines",
        "logo": "https://www.gstatic.com/flights/airline_logos/70px/LA.png",
        "url_busqueda": (
            "https://www.latamairlines.com/pe/es/oferta-vuelos"
            "?origin={origen}&destination={destino}"
            "&outbound={fecha}&adt={adultos}&inf=0&chd=0"
            "&cabin=Economy&redemption=false&trip=OW"
        ),
    },
    "H2": {
        "nombre": "Sky Airline",
        "logo": "https://www.gstatic.com/flights/airline_logos/70px/H2.png",
        "url_busqueda": (
            "https://www.skyairline.com/peru/buscar"
            "?origin={origen}&destination={destino}"
            "&departureDate={fecha}&adults={adultos}&children=0&infants=0"
        ),
    },
    "JA": {
        "nombre": "JetSMART",
        "logo": "https://www.gstatic.com/flights/airline_logos/70px/JA.png",
        "url_busqueda": (
            "https://jetsmart.com/pe/es/vuelos"
            "?from={origen}&to={destino}"
            "&departure={fecha}&adults={adultos}"
        ),
    },
    "LP": {
        "nombre": "LATAM Perú",
        "logo": "https://www.gstatic.com/flights/airline_logos/70px/LA.png",
        "url_busqueda": (
            "https://www.latamairlines.com/pe/es/oferta-vuelos"
            "?origin={origen}&destination={destino}"
            "&outbound={fecha}&adt={adultos}&inf=0&chd=0"
            "&cabin=Economy&redemption=false&trip=OW"
        ),
    },
    "IB": {
        "nombre": "Iberia",
        "logo": "https://www.gstatic.com/flights/airline_logos/70px/IB.png",
        "url_busqueda": (
            "https://www.iberia.com/pe/es/vuelos/"
        ),
    },
    "AV": {
        "nombre": "Avianca",
        "logo": "https://www.gstatic.com/flights/airline_logos/70px/AV.png",
        "url_busqueda": (
            "https://www.avianca.com/es/booking/select/"
            "?origin1={origen}&destination1={destino}"
            "&departure1={fecha}&adt1={adultos}"
        ),
    },
    "CM": {
        "nombre": "Copa Airlines",
        "logo": "https://www.gstatic.com/flights/airline_logos/70px/CM.png",
        "url_busqueda": (
            "https://www.copaair.com/en-gs/web/guest/reservations"
        ),
    },
}

# Fallback for Google Flights
GOOGLE_FLIGHTS_DEEPLINK = (
    "https://www.google.com/travel/flights"
    "?q=vuelos+de+{origen}+a+{destino}+el+{fecha}"
)


def get_airline_info(carrier_code: str) -> Optional[Dict]:
    """Get airline info from the deeplinks dictionary."""
    return AIRLINE_DEEPLINKS.get(carrier_code.upper())


def get_airline_logo(carrier_code: str) -> str:
    """Get airline logo URL. Falls back to Google's public airline logos."""
    info = AIRLINE_DEEPLINKS.get(carrier_code.upper())
    if info:
        return info["logo"]
    # Google provides public 70px airline logos by IATA code
    return f"https://www.gstatic.com/flights/airline_logos/70px/{carrier_code.upper()}.png"


def build_deeplink(
    carrier_code: str,
    origin_iata: str,
    destination_iata: str,
    departure_date: str,
    adults: int = 1,
) -> str:
    """
    Build a deep link to the airline's booking page.

    Args:
        carrier_code: IATA airline code (e.g. "LA", "H2", "JA")
        origin_iata: Origin airport IATA code (e.g. "LIM")
        destination_iata: Destination airport IATA code (e.g. "CUZ")
        departure_date: Date string YYYY-MM-DD
        adults: Number of adult passengers

    Returns:
        URL string for booking, or Google Flights fallback.
    """
    info = AIRLINE_DEEPLINKS.get(carrier_code.upper())

    if info:
        try:
            url = info["url_busqueda"].format(
                origen=origin_iata,
                destino=destination_iata,
                fecha=departure_date,
                adultos=adults,
            )
            return url
        except (KeyError, IndexError) as e:
            logger.warning(f"deeplink: Error building URL for {carrier_code} — {e}")

    # Fallback: Google Flights search
    return GOOGLE_FLIGHTS_DEEPLINK.format(
        origen=origin_iata,
        destino=destination_iata,
        fecha=departure_date,
    )


def enrich_flight_with_deeplink(
    flight: Dict,
    departure_date: str,
    adults: int = 1,
) -> Dict:
    """
    Enrich a flight option dict with booking_url, airline_logo, and airline_name.
    Mutates and returns the dict.
    """
    carrier = flight.get("carrier_code", "")
    origin_iata = flight.get("origin_iata", "")
    dest_iata = flight.get("destination_iata", "")

    flight["booking_url"] = build_deeplink(
        carrier, origin_iata, dest_iata, departure_date, adults
    )
    flight["airline_logo"] = get_airline_logo(carrier)

    # Override airline name if we have a better one
    info = get_airline_info(carrier)
    if info:
        flight["airline"] = info["nombre"]

    return flight
