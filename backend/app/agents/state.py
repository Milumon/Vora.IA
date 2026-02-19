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
    provider: str            # airline name, bus company, or "Google Maps"
    departure_time: str      # ISO datetime or HH:MM
    arrival_time: str        # ISO datetime or HH:MM
    duration_text: str       # e.g. "2h 30m"
    price: float             # 0 if unknown
    currency: str            # "PEN", "USD", "EUR"
    service_type: str        # "Directo", "1 escala", "Bus Cama", etc.
    stops: int               # 0 = direct
    booking_url: str         # deep link to buy/book


class MobilitySegment(TypedDict):
    """
    A complete transport segment between two cities.
    Contains the best option + all alternatives for each mode.
    Replaces the old BusTransfer type.
    """
    origin: str
    destination: str
    departure_date: str

    # Best option per mode
    best_flight: Optional[Dict]     # MobilityOption or None
    best_transit: Optional[Dict]    # MobilityOption or None
    best_drive: Optional[Dict]      # drive info dict or None

    # Route metadata
    drive_distance_km: Optional[float]
    drive_duration_text: Optional[str]
    drive_duration_seconds: Optional[int]
    transit_distance_km: Optional[float]
    transit_duration_text: Optional[str]
    transit_duration_seconds: Optional[int]

    # All alternatives
    flight_options: List[Dict]      # List[MobilityOption]
    transit_options: List[Dict]     # List of transit step details
    
    # Recommended mode
    recommended_mode: Literal["flight", "bus", "drive"]


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
    travel_style: Optional[List[str]]
    travelers: Optional[int]
    
    # Datos de lugares
    searched_places: List[PlaceInfo]
    
    # Datos de transporte (mobility — replaces bus_transfers)
    mobility_options: List[MobilitySegment]
    
    # Itinerario generado
    itinerary: Optional[Dict]
    day_plans: List[DayPlan]
    
    # Contexto acumulado
    accumulated_summary: Optional[str]
    
    # Control de flujo
    needs_clarification: bool
    clarification_questions: List[str]
    iteration_count: int
    max_iterations: int
