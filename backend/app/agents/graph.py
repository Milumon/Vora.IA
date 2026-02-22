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
from app.agents.nodes.refinement_delta import extract_refinement_delta
from app.agents.nodes.refinement_handler import handle_refinement
from app.agents.nodes.restaurant_searcher import search_restaurants
from app.config.logging import get_logger

logger = get_logger(__name__)


def create_travel_agent_graph():
    """Crea el grafo principal del agente de viajes."""
    
    workflow = StateGraph(TravelState)
    
    # ── Nodos ─────────────────────────────────────────────────────────────
    workflow.add_node("classify_intent", classify_intent)
    workflow.add_node("extract_preferences", extract_preferences)
    workflow.add_node("generate_response", generate_response)
    workflow.add_node("search_places", search_places)
    workflow.add_node("search_mobility", search_mobility)
    workflow.add_node("search_accommodation", search_accommodation)
    workflow.add_node("build_itinerary", build_itinerary)
    workflow.add_node("search_restaurants", search_restaurants)
    
    # Refinement pipeline
    workflow.add_node("extract_refinement_delta", extract_refinement_delta)
    workflow.add_node("handle_refinement", handle_refinement)
    
    # ── Entry point ───────────────────────────────────────────────────────
    workflow.set_entry_point("classify_intent")
    
    # ── Routing desde classify_intent ─────────────────────────────────────
    workflow.add_conditional_edges(
        "classify_intent",
        route_by_intent,
        {
            "new_trip": "extract_preferences",
            "refine": "extract_refinement_delta",
            "question": "generate_response",
            "clarify": "extract_preferences"
        }
    )
    
    # ── New trip pipeline ─────────────────────────────────────────────────
    workflow.add_conditional_edges(
        "extract_preferences",
        check_if_ready,
        {
            "ready": "search_places",
            "needs_clarification": "generate_response"
        }
    )
    
    workflow.add_edge("generate_response", END)
    workflow.add_edge("search_places", "search_mobility")
    workflow.add_edge("search_mobility", "search_accommodation")
    workflow.add_edge("search_accommodation", "build_itinerary")
    workflow.add_edge("build_itinerary", "search_restaurants")
    workflow.add_edge("search_restaurants", END)
    
    # ── Refinement pipeline ───────────────────────────────────────────────
    # extract_refinement_delta → handle_refinement → route_refinement
    workflow.add_edge("extract_refinement_delta", "handle_refinement")
    
    workflow.add_conditional_edges(
        "handle_refinement",
        route_refinement,
        {
            "destination_changed": "search_places",
            "style_changed": "search_places",
            "dates_changed": "search_mobility",
            "metadata_only": "build_itinerary",
        }
    )
    
    # ── Compilar ──────────────────────────────────────────────────────────
    return workflow.compile()


# ── Routing functions ────────────────────────────────────────────────────────

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
    
    if state.get("needs_clarification", False):
        return "needs_clarification"
    
    has_destination = bool(state.get("destination"))
    has_days = bool(state.get("days"))
    
    if has_destination and has_days:
        return "ready"
    
    return "needs_clarification"


def route_refinement(state: TravelState) -> Literal[
    "destination_changed", "style_changed", "dates_changed", "metadata_only"
]:
    """
    Decide qué nodos del pipeline re-ejecutar basado en refinement_scope.
    
    - destination_changed → search_places (full pipeline)
    - style_changed       → search_places (new places, reuse transport/hotel)
    - dates_changed       → search_mobility (new flights+hotels, reuse places)
    - metadata_only       → build_itinerary (just rebuild with new params)
    """
    scope = state.get("refinement_scope", "metadata_only")
    logger.info(f"route_refinement: {scope}")
    return scope
