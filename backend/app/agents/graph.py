"""Grafo principal del agente de viajes usando LangGraph."""
from langgraph.graph import StateGraph, END
from typing import Literal
from app.agents.state import TravelState
from app.agents.nodes.intent_classifier import classify_intent
from app.agents.nodes.preference_extractor import extract_preferences
from app.agents.nodes.conversation_manager import generate_response
from app.agents.nodes.place_searcher import search_places
from app.agents.nodes.mobility_searcher import search_mobility
from app.agents.nodes.accommodation_searcher import search_accommodation
from app.agents.nodes.itinerary_builder import build_itinerary
from app.agents.nodes.refinement_handler import handle_refinement
from app.config.logging import get_logger

logger = get_logger(__name__)


def create_travel_agent_graph():
    """Crea el grafo principal del agente de viajes."""
    
    workflow = StateGraph(TravelState)
    
    # Agregar nodos
    workflow.add_node("classify_intent", classify_intent)
    workflow.add_node("extract_preferences", extract_preferences)
    workflow.add_node("generate_response", generate_response)
    workflow.add_node("search_places", search_places)
    workflow.add_node("search_mobility", search_mobility)
    workflow.add_node("search_accommodation", search_accommodation)
    workflow.add_node("build_itinerary", build_itinerary)
    workflow.add_node("handle_refinement", handle_refinement)
    
    # Definir flujo
    workflow.set_entry_point("classify_intent")
    
    # Edges condicionales basados en intent
    workflow.add_conditional_edges(
        "classify_intent",
        route_by_intent,
        {
            "new_trip": "extract_preferences",
            "refine": "handle_refinement",
            "question": "generate_response",
            "clarify": "extract_preferences"
        }
    )
    
    # Edge condicional después de extraer preferencias
    workflow.add_conditional_edges(
        "extract_preferences",
        check_if_ready,
        {
            "ready": "search_places",
            "needs_clarification": "generate_response"
        }
    )
    
    workflow.add_edge("generate_response", END)
    # Pipeline: places → mobility → accommodation → build_itinerary
    workflow.add_edge("search_places", "search_mobility")
    workflow.add_edge("search_mobility", "search_accommodation")
    workflow.add_edge("search_accommodation", "build_itinerary")
    workflow.add_edge("build_itinerary", END)
    workflow.add_edge("handle_refinement", END)
    
    # Compilar el grafo
    return workflow.compile()


def route_by_intent(state: TravelState) -> Literal["new_trip", "refine", "question", "clarify"]:
    """Rutea según la intención clasificada."""
    intent = state.get("intent", "new_trip")
    
    # Validar si necesita clarificación
    if state.get("needs_clarification", False):
        return "clarify"
    
    # Límite de iteraciones para evitar loops infinitos
    if state.get("iteration_count", 0) > state.get("max_iterations", 10):
        logger.warning("Máximo de iteraciones alcanzado, reiniciando")
        return "new_trip"
    
    return intent


def check_if_ready(state: TravelState) -> Literal["ready", "needs_clarification"]:
    """Verifica si tenemos suficiente información para buscar lugares."""
    
    # Si explícitamente necesita clarificación
    if state.get("needs_clarification", False):
        return "needs_clarification"
    
    # Verificar información mínima necesaria
    has_destination = bool(state.get("destination"))
    has_days = bool(state.get("days"))
    
    if has_destination and has_days:
        return "ready"
    
    return "needs_clarification"
