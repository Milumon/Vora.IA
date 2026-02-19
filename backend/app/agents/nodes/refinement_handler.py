"""
refinement_handler.py
---------------------
Nodo que aplica el delta extraído al estado existente y prepara el itinerario
para rebuild.  Ya NO genera JSON con LLM — preserva datos reales de
Google Places, SerpApi, etc.
"""
from typing import Dict, List
from app.agents.state import TravelState
from app.config.logging import get_logger

logger = get_logger(__name__)


async def handle_refinement(state: TravelState) -> dict:
    """
    Aplica el refinamiento al estado existente.
    
    Este nodo se ejecuta DESPUÉS de extract_refinement_delta, que ya actualizó
    el estado con los nuevos valores (days, budget, etc.) y determinó el scope.
    
    Lo que hace:
    1. Si scope es 'metadata_only': limpia el itinerario viejo para forzar rebuild
       pero preserva searched_places, mobility_options, accommodation_options
    2. Si scope es 'dates_changed': limpia mobility + accommodation (se re-buscarán)
    3. Si scope es 'destination_changed': limpia todo (se re-buscará)
    4. Si scope es 'style_changed': limpia places (se re-buscarán)
    """
    scope = state.get("refinement_scope", "metadata_only")
    previous = state.get("previous_itinerary")
    
    logger.info(f"handle_refinement: scope={scope}")

    update: dict = {
        # Siempre limpiar el itinerario anterior para forzar rebuild
        "itinerary": None,
        "day_plans": [],
    }

    if scope == "destination_changed":
        # Destino cambió → limpiar todo para re-buscar
        update["searched_places"] = []
        update["mobility_options"] = []
        update["accommodation_options"] = []
        logger.info("handle_refinement: limpiando todo — destino cambió")

    elif scope == "style_changed":
        # Estilo cambió → re-buscar lugares pero mantener transporte/hotel
        update["searched_places"] = []
        # mobility_options y accommodation_options se preservan
        logger.info("handle_refinement: limpiando lugares — estilo cambió")

    elif scope == "dates_changed":
        # Fechas cambiaron → re-buscar vuelos y hoteles
        update["mobility_options"] = []
        update["accommodation_options"] = []
        # searched_places se preservan
        logger.info("handle_refinement: limpiando mobility+accommodation — fechas cambiaron")

    elif scope == "metadata_only":
        # Solo metadatos (days, budget, travelers) → preservar todo
        # El itinerary_builder recibirá los mismos places, flights, hotels
        # pero reconstruirá el plan con los nuevos parámetros
        logger.info("handle_refinement: preservando todo — solo metadata cambió")

    return update
