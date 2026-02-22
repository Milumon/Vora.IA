"""Estado compartido del agente de viajes usando LangGraph."""
from typing import TypedDict, Annotated, Literal, List, Dict, Optional
import operator
from datetime import date


class Message(TypedDict):
    """Mensaje en la conversación."""
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: str


class PlaceInfo(TypedDict):
    """Información de un lugar turístico."""
    place_id: str
    name: str
    address: str
    rating: Optional[float]
    price_level: Optional[int]
    types: List[str]
    photos: List[str]
    location: Dict[str, float]  # {lat, lng}


# ── Mobility types (unified transport model) ────────────────────────────────

class MobilityOption(TypedDict):
    """A single transport alternative (one flight offer, one bus service, etc.)."""
    provider: str
    departure_time: str
    arrival_time: str
    duration_text: str
    price: float
    currency: str
    service_type: str
    stops: int
    booking_url: str


class MobilitySegment(TypedDict):
    """
    A complete transport segment between two cities.
    Contains the best option + all alternatives for each mode.
    """
    origin: str
    destination: str
    departure_date: str

    best_flight: Optional[Dict]
    best_transit: Optional[Dict]
    best_drive: Optional[Dict]

    drive_distance_km: Optional[float]
    drive_duration_text: Optional[str]
    drive_duration_seconds: Optional[int]
    transit_distance_km: Optional[float]
    transit_duration_text: Optional[str]
    transit_duration_seconds: Optional[int]

    flight_options: List[Dict]
    transit_options: List[Dict]

    recommended_mode: Literal["flight", "bus", "drive"]


# ── Accommodation types ─────────────────────────────────────────────────────

class AccommodationOption(TypedDict):
    """A single accommodation option (Airbnb listing via Apify)."""
    name: str
    type: str                  # "Apartment in Cusco", etc.
    room_type: str             # "entire_home", "private_room", etc.
    price_per_night: float
    total_price: float
    currency: str
    rating: float              # 0–5
    reviews_count: int
    images: List[str]
    badges: List[str]          # ["Guest favorite", ...]
    subtitles: List[str]       # ["Free cancellation", ...]
    booking_url: str
    coordinates: Optional[Dict[str, float]]  # {latitude, longitude}
    check_in: str              # YYYY-MM-DD
    check_out: str             # YYYY-MM-DD


class DayPlan(TypedDict):
    """Plan para un día específico del itinerario."""
    day_number: int
    date: Optional[str]
    morning: List[PlaceInfo]
    afternoon: List[PlaceInfo]
    evening: List[PlaceInfo]
    notes: str


class TravelState(TypedDict):
    """Estado completo del agente de viajes."""
    # Conversación
    messages: Annotated[List[Message], operator.add]

    # Intención actual
    intent: Literal["new_trip", "refine", "question", "clarify"]

    # Preferencias del usuario
    destination: Optional[str]
    destinations: Optional[List[str]]
    start_date: Optional[date]
    end_date: Optional[date]
    days: Optional[int]
    budget: Optional[Literal["low", "medium", "high"]]
    budget_total: Optional[int]      # Presupuesto total del viaje
    travel_style: Optional[List[str]]
    travelers: Optional[int]
    currency: Optional[str]          # "PEN" or "USD"
    budget_min: Optional[int]        # Min price filter for accommodation
    budget_max: Optional[int]        # Max price filter for accommodation

    # Flags para widgets condicionales
    missing_dates: bool              # Si faltan fechas en el primer mensaje
    missing_budget: bool             # Si falta presupuesto en el primer mensaje

    # Datos de lugares
    searched_places: List[PlaceInfo]

    # Datos de transporte
    mobility_options: List[MobilitySegment]

    # Datos de alojamiento
    accommodation_options: List[AccommodationOption]

    # Itinerario generado
    itinerary: Optional[Dict]
    day_plans: List[DayPlan]

    # Contexto acumulado
    accumulated_summary: Optional[str]

    # Control de refinamiento
    refinement_scope: Optional[Literal[
        "metadata_only",       # days/budget/travelers → rebuild itinerary only
        "dates_changed",       # start/end dates → re-run mobility + accommodation + build
        "destination_changed", # destination → re-run entire pipeline
        "style_changed",       # travel_style → re-run places + build
    ]]
    previous_itinerary: Optional[Dict]   # snapshot before refinement

    # Control de flujo
    needs_clarification: bool
    clarification_questions: List[str]
    iteration_count: int
    max_iterations: int
