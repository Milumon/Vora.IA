"""
refinement_delta.py
-------------------
Nodo LangGraph que extrae un delta estructurado del pedido de refinamiento
del usuario.  Compara contra el estado actual y determina qué cambió para
decidir qué nodos del pipeline deben re-ejecutarse.
"""
from __future__ import annotations

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

from app.agents.state import TravelState
from app.config.settings import get_settings
from app.config.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)


# ── Pydantic model for structured delta ──────────────────────────────────────

class RefinementDelta(BaseModel):
    """Cambios que el usuario quiere aplicar al itinerario existente."""

    destination: Optional[str] = Field(
        None, description="Nuevo destino si el usuario quiere cambiar el destino"
    )
    days: Optional[int] = Field(
        None, description="Nuevo número de días si el usuario quiere cambiar la duración"
    )
    budget: Optional[Literal["low", "medium", "high"]] = Field(
        None, description="Nuevo nivel de presupuesto"
    )
    travel_style: Optional[List[str]] = Field(
        None, description="Nuevos estilos de viaje"
    )
    travelers: Optional[int] = Field(
        None, description="Nuevo número de viajeros"
    )
    start_date: Optional[str] = Field(
        None, description="Nueva fecha de inicio YYYY-MM-DD"
    )
    end_date: Optional[str] = Field(
        None, description="Nueva fecha de fin YYYY-MM-DD"
    )
    specific_instructions: Optional[str] = Field(
        None, description="Instrucciones específicas que no encajan en los campos anteriores (e.g. 'agrega más actividades culturales al día 2')"
    )
    summary_of_changes: str = Field(
        ..., description="Resumen breve de los cambios solicitados por el usuario"
    )


# ── Scope detection ─────────────────────────────────────────────────────────

def _determine_scope(delta: RefinementDelta, state: TravelState) -> str:
    """
    Decide qué nodos del pipeline deben re-ejecutarse según lo que cambió.

    Devuelve uno de:
      - "destination_changed" → re-run everything
      - "style_changed"      → re-run places + build
      - "dates_changed"      → re-run mobility + accommodation + build
      - "metadata_only"      → just rebuild itinerary
    """
    # Destination changed → full pipeline
    if delta.destination and delta.destination.lower() != (state.get("destination") or "").lower():
        return "destination_changed"

    # Travel style changed → new places
    if delta.travel_style and delta.travel_style != state.get("travel_style"):
        return "style_changed"

    # Dates changed → new flights + hotels
    if delta.start_date or delta.end_date:
        return "dates_changed"

    # Everything else (days, budget, travelers, specific_instructions)
    return "metadata_only"


# ── Main node ────────────────────────────────────────────────────────────────

async def extract_refinement_delta(state: TravelState) -> dict:
    """
    Extrae un delta estructurado del pedido de refinamiento del usuario.
    Compara contra el estado actual y decide el scope del refinamiento.
    """
    llm = ChatOpenAI(
        model=settings.OPENAI_MODEL,
        temperature=0,
        api_key=settings.OPENAI_API_KEY,
    )

    parser = PydanticOutputParser(pydantic_object=RefinementDelta)

    messages = state.get("messages", [])
    last_message = messages[-1]["content"] if messages else ""

    # Build context of current state for the LLM
    current_state_summary = []
    if state.get("destination"):
        current_state_summary.append(f"Destino actual: {state['destination']}")
    if state.get("days"):
        current_state_summary.append(f"Días actuales: {state['days']}")
    if state.get("budget"):
        current_state_summary.append(f"Presupuesto actual: {state['budget']}")
    if state.get("travel_style"):
        styles = ", ".join(state["travel_style"]) if isinstance(state["travel_style"], list) else state["travel_style"]
        current_state_summary.append(f"Estilo actual: {styles}")
    if state.get("travelers"):
        current_state_summary.append(f"Viajeros actuales: {state['travelers']}")
    if state.get("start_date"):
        current_state_summary.append(f"Fecha inicio: {state['start_date']}")
    if state.get("end_date"):
        current_state_summary.append(f"Fecha fin: {state['end_date']}")

    itinerary = state.get("itinerary")
    itinerary_summary = ""
    if itinerary:
        day_plans = itinerary.get("day_plans", [])
        itinerary_summary = f"Itinerario actual: {itinerary.get('title', 'Sin título')} — {len(day_plans)} días"
        for dp in day_plans[:5]:  # Limit context size
            places = [p.get("name", "?") for p in dp.get("morning", []) + dp.get("afternoon", []) + dp.get("evening", [])]
            if places:
                itinerary_summary += f"\n  Día {dp.get('day_number', '?')}: {', '.join(places[:5])}"

    prompt = ChatPromptTemplate.from_messages([
        ("system", """Eres un analizador de cambios para un agente de viajes.

ESTADO ACTUAL DEL VIAJE:
{current_state}

ITINERARIO ACTUAL:
{itinerary_summary}

SOLICITUD DEL USUARIO:
{user_request}

INSTRUCCIONES:
1. Analiza qué quiere cambiar el usuario comparado con el estado actual
2. Solo incluye campos que el usuario quiere CAMBIAR (deja null los demás)
3. Si el usuario pide "reducir a 3 días" → days=3
4. Si el usuario pide "cambiar a presupuesto alto" → budget="high"
5. Si el usuario pide "agregar más cultura" → travel_style=["cultural", ...]
6. Si el usuario pide "cambiar destino a Arequipa" → destination="Arequipa"
7. Si el usuario pide algo específico como "quiero más restaurantes el día 2" → specific_instructions
8. Siempre incluye un summary_of_changes breve

{format_instructions}"""),
        ("user", "Extrae los cambios solicitados por el usuario.")
    ])

    chain = prompt | llm | parser

    try:
        delta = await chain.ainvoke({
            "current_state": "\n".join(current_state_summary) or "Sin información previa",
            "itinerary_summary": itinerary_summary or "Sin itinerario previo",
            "user_request": last_message,
            "format_instructions": parser.get_format_instructions(),
        })

        # Determine refinement scope
        scope = _determine_scope(delta, state)

        logger.info(
            f"refinement_delta: scope={scope} | "
            f"changes={delta.summary_of_changes}"
        )

        # Build state update — only include changed fields
        update: dict = {
            "refinement_scope": scope,
            "previous_itinerary": state.get("itinerary"),
        }

        if delta.destination:
            update["destination"] = delta.destination
        if delta.days is not None:
            update["days"] = delta.days
        if delta.budget:
            update["budget"] = delta.budget
        if delta.travel_style:
            update["travel_style"] = delta.travel_style
        if delta.travelers is not None:
            update["travelers"] = delta.travelers
        if delta.start_date:
            update["start_date"] = delta.start_date
        if delta.end_date:
            update["end_date"] = delta.end_date

        return update

    except Exception as e:
        logger.error(f"refinement_delta error: {e}", exc_info=True)
        # Fallback: metadata_only scope, preserve everything
        return {
            "refinement_scope": "metadata_only",
            "previous_itinerary": state.get("itinerary"),
        }
