from fastapi import APIRouter, Depends, HTTPException, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import datetime, date as date_type
import uuid
from supabase import Client
from app.core.dependencies import get_current_active_user
from app.api.v1.schemas.chat import ChatRequest, ChatResponse
from app.agents.graph import create_travel_agent_graph
from app.services.supabase_client import get_supabase, get_supabase_client
from app.config.logging import get_logger

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
logger = get_logger(__name__)


@router.post("", response_model=ChatResponse)
async def chat(
    request: Request,
    chat_request: ChatRequest,
    current_user: dict = Depends(get_current_active_user),
    supabase: Client = Depends(get_supabase),
    supabase_client = Depends(get_supabase_client)
):
    """
    Process chat message with LangGraph travel agent.
    
    The agent maintains conversation context using thread_id and can:
    - Create new travel itineraries
    - Refine existing itineraries
    - Answer questions about destinations
    - Handle clarifications
    
    Automatically saves messages to conversations table for persistence.
    """
    try:
        # Crear el grafo del agente
        graph = create_travel_agent_graph()
        
        # Generar o usar thread_id existente (conversation_id)
        conversation_id = chat_request.thread_id or str(uuid.uuid4())
        
        # Recuperar conversación previa si existe
        previous_state = {}
        conversation_raw = None
        conversation_exists = False
        
        if chat_request.thread_id:
            try:
                conversation = supabase.table("conversations")\
                    .select("*")\
                    .eq("id", conversation_id)\
                    .eq("user_id", current_user["id"])\
                    .single()\
                    .execute()
                    
                if conversation.data:
                    conversation_raw = conversation.data
                    previous_state = conversation.data.get("state", {})
                    conversation_exists = True
                    logger.info(f"Conversación recuperada para conversation_id: {conversation_id}")
            except Exception as e:
                logger.warning(f"No se pudo recuperar conversación previa: {e}")
        
        # Restaurar mensajes previos completos de la conversación
        previous_messages = []
        if conversation_exists and conversation_raw:
            previous_messages = conversation_raw.get("messages", [])
        
        # Crear nuevo mensaje del usuario
        new_user_message = {
            "role": "user",
            "content": chat_request.message,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Construir resumen compacto del estado acumulado para el contexto del LLM
        accumulated_summary = _build_state_summary(previous_state)
        
        # Parsear fechas del widget (check_in/check_out → start_date/end_date)
        widget_start_date = _parse_widget_date(chat_request.check_in)
        widget_end_date = _parse_widget_date(chat_request.check_out)
        widget_budget = chat_request.budget_total
        
        # Resolver valores finales: widget > estado previo
        resolved_start_date = widget_start_date or _parse_widget_date(previous_state.get("start_date"))
        resolved_end_date = widget_end_date or _parse_widget_date(previous_state.get("end_date"))
        resolved_budget_total = widget_budget or previous_state.get("budget_total")
        
        # Limpiar flags si el widget proporcionó los datos faltantes
        has_widget_dates = bool(widget_start_date or widget_end_date)
        has_widget_budget = bool(widget_budget)
        
        # Enriquecer mensaje del usuario si viene con datos de widget
        if has_widget_dates or has_widget_budget:
            new_user_message = _enrich_widget_message(
                new_user_message, widget_start_date, widget_end_date,
                widget_budget, chat_request.currency or "PEN"
            )
        
        input_state = {
            "messages": previous_messages + [new_user_message],
            "max_iterations": 10,
            "searched_places": previous_state.get("searched_places", []),
            "day_plans": previous_state.get("day_plans", []),
            "needs_clarification": False,
            "clarification_questions": [],
            "iteration_count": previous_state.get("iteration_count", 0),
            "accumulated_summary": accumulated_summary,
            "destination": previous_state.get("destination"),
            "destinations": previous_state.get("destinations"),
            "days": previous_state.get("days"),
            "budget": previous_state.get("budget"),
            "budget_total": resolved_budget_total,
            "travel_style": previous_state.get("travel_style"),
            "travelers": previous_state.get("travelers"),
            "start_date": resolved_start_date,
            "end_date": resolved_end_date,
            "itinerary": previous_state.get("itinerary"),
            "mobility_options": previous_state.get("mobility_options", []),
            "accommodation_options": previous_state.get("accommodation_options", []),
            "currency": chat_request.currency or previous_state.get("currency", "PEN"),
            "missing_dates": False if (resolved_start_date or resolved_end_date) else previous_state.get("missing_dates", False),
            "missing_budget": False if resolved_budget_total else previous_state.get("missing_budget", False),
            "refinement_scope": None,
            "previous_itinerary": None,
        }
        
        # Ejecutar el grafo
        logger.info(f"Ejecutando grafo para conversation_id: {conversation_id}")
        result = await graph.ainvoke(input_state)
        
        # Extraer respuesta
        assistant_messages = [
            msg for msg in result.get("messages", [])
            if msg.get("role") == "assistant"
        ]
        
        response_message = assistant_messages[-1]["content"] if assistant_messages else "Lo siento, no pude procesar tu mensaje."
        
        # Crear mensaje del asistente
        new_assistant_message = {
            "role": "assistant",
            "content": response_message,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": {
                "needs_clarification": result.get("needs_clarification", False),
                "clarification_questions": result.get("clarification_questions", []),
            }
        }
        
        # Guardar o actualizar conversación en Supabase
        try:
            conversation_data = {
                "id": conversation_id,
                "user_id": current_user["id"],
                "messages": result.get("messages", []),
                "state": {
                    "destination": result.get("destination"),
                    "destinations": result.get("destinations"),
                    "days": result.get("days"),
                    "budget": result.get("budget"),
                    "budget_total": result.get("budget_total"),
                    "travel_style": result.get("travel_style"),
                    "travelers": result.get("travelers"),
                    "start_date": str(result.get("start_date", "")) if result.get("start_date") else None,
                    "end_date": str(result.get("end_date", "")) if result.get("end_date") else None,
                    "searched_places": result.get("searched_places", []),
                    "day_plans": result.get("day_plans", []),
                    "iteration_count": result.get("iteration_count", 0),
                    "itinerary": result.get("itinerary"),
                    "mobility_options": result.get("mobility_options", []),
                    "accommodation_options": result.get("accommodation_options", []),
                    "currency": result.get("currency", "PEN"),
                    "missing_dates": result.get("missing_dates", False),
                    "missing_budget": result.get("missing_budget", False),
                },
                "is_active": True,
                "last_message_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Si es nueva conversación, deactivar otras primero
            if not conversation_exists:
                supabase.table("conversations")\
                    .update({"is_active": False})\
                    .eq("user_id", current_user["id"])\
                    .eq("is_active", True)\
                    .execute()
            
            # Upsert (insert o update)
            supabase.table("conversations").upsert(conversation_data).execute()
            logger.info(f"Conversación guardada para conversation_id: {conversation_id}")
        except Exception as e:
            logger.error(f"Error guardando conversación: {e}", exc_info=True)
        except Exception as e:
            logger.error(f"Error guardando estado de conversación: {e}")
        
        # Guardar itinerario completo en Supabase si es necesario
        if chat_request.save_conversation and result.get("itinerary"):
            await _save_itinerary(
                supabase,
                current_user["id"],
                current_user.get("email", ""),
                result,
                conversation_id
            )
        
        # Enriquecer itinerario con destino y metadatos del estado
        itinerary_response = result.get("itinerary")
        if itinerary_response:
            itinerary_response = {
                **itinerary_response,
                "destination": result.get("destination") or itinerary_response.get("destination", "Perú"),
                "days": result.get("days") or len(itinerary_response.get("day_plans", [])),
                "budget": result.get("budget"),
                "travel_style": result.get("travel_style"),
                "travelers": result.get("travelers", 1),
            }
        
        return ChatResponse(
            message=response_message,
            thread_id=conversation_id,
            itinerary=itinerary_response,
            needs_clarification=result.get("needs_clarification", False),
            clarification_questions=result.get("clarification_questions", []),
            missing_dates=result.get("missing_dates", False),
            missing_budget=result.get("missing_budget", False)
        )
        
    except Exception as e:
        logger.error(f"Error procesando mensaje: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error procesando mensaje: {str(e)}"
        )


async def _save_itinerary(
    supabase: Client,
    user_id: str,
    user_email: str,
    result: dict,
    conversation_id: str
):
    """Guarda el itinerario en Supabase vinculado a la conversación."""
    try:
        itinerary = result.get("itinerary")
        if not itinerary:
            return
        
        # Asegurar que el perfil exista (para usuarios que no tienen trigger)
        try:
            supabase.table("profiles").upsert({
                "id": user_id,
                "email": user_email or "user@example.com",
                "updated_at": datetime.utcnow().isoformat()
            }, on_conflict="id").execute()
        except Exception:
            pass  # El perfil puede ya existir
        
        # Guardar itinerario vinculado a la conversación
        itinerary_data = {
            "user_id": user_id,
            "conversation_id": conversation_id,  # Vinculado a conversación
            "title": itinerary.get("title", "Mi Viaje a Perú"),
            "description": itinerary.get("description"),
            "destination": result.get("destination") or "Perú",
            "start_date": result.get("start_date"),
            "end_date": result.get("end_date"),
            "days": result.get("days"),
            "budget": result.get("budget"),
            "travel_style": ", ".join(result.get("travel_style", [])) if isinstance(result.get("travel_style"), list) else result.get("travel_style"),
            "travelers": result.get("travelers", 1),
            "data": itinerary,
            "status": "draft"
        }
        
        response = supabase.table("itineraries").insert(itinerary_data).execute()
        logger.info(f"Itinerario guardado para usuario {user_id} en conversación {conversation_id}")
        
    except Exception as e:
        logger.error(f"Error guardando itinerario: {e}", exc_info=True)


def _parse_widget_date(raw) -> date_type | None:
    """Parsea una fecha del widget o del estado previo a un objeto date."""
    if raw is None:
        return None
    if isinstance(raw, date_type):
        return raw
    if isinstance(raw, str) and raw.strip():
        try:
            return date_type.fromisoformat(raw.strip())
        except ValueError:
            return None
    return None


def _enrich_widget_message(
    message: dict, start_date, end_date, budget_total, currency: str
) -> dict:
    """Enriquece el contenido del mensaje con datos estructurados del widget."""
    parts = [message["content"]]
    if start_date:
        parts.append(f"Fecha de inicio: {start_date}")
    if end_date:
        parts.append(f"Fecha de fin: {end_date}")
    if budget_total:
        parts.append(f"Presupuesto total: {budget_total} {currency}")
    return {**message, "content": " | ".join(parts)}


def _build_state_summary(state: dict) -> str:
    """Construye un resumen compacto del estado acumulado para inyectar en los prompts."""
    if not state:
        return ""
    
    parts = []
    if state.get("destination"):
        parts.append(f"Destino: {state['destination']}")
    if state.get("days"):
        parts.append(f"Días: {state['days']}")
    if state.get("budget"):
        parts.append(f"Presupuesto: {state['budget']}")
    if state.get("travel_style"):
        style = state["travel_style"]
        if isinstance(style, list):
            style = ", ".join(style)
        parts.append(f"Estilo: {style}")
    if state.get("travelers"):
        parts.append(f"Viajeros: {state['travelers']}")
    if state.get("start_date"):
        parts.append(f"Fecha inicio: {state['start_date']}")
    if state.get("end_date"):
        parts.append(f"Fecha fin: {state['end_date']}")
    if state.get("itinerary"):
        itinerary = state["itinerary"]
        title = itinerary.get("title", "Sin título") if isinstance(itinerary, dict) else "Generado"
        num_days = len(itinerary.get("day_plans", [])) if isinstance(itinerary, dict) else "?"
        parts.append(f"Itinerario: {title} ({num_days} días)")
    if state.get("accommodation_options"):
        parts.append(f"Hoteles encontrados: {len(state['accommodation_options'])}")
    if state.get("mobility_options"):
        parts.append(f"Opciones de transporte: {len(state['mobility_options'])} segmentos")
    
    if not parts:
        return ""
    
    return "ESTADO CONFIRMADO POR EL USUARIO: " + " | ".join(parts)
