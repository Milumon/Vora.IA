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
