from fastapi import APIRouter, Depends, HTTPException, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import datetime
import uuid
from app.core.dependencies import get_current_active_user
from app.api.v1.schemas.chat import ChatRequest, ChatResponse
from app.agents.graph import create_travel_agent_graph
from app.services.supabase_client import get_supabase_client
from app.config.logging import get_logger

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
logger = get_logger(__name__)


@router.post("", response_model=ChatResponse)
async def chat(
    request: Request,
    chat_request: ChatRequest,
    current_user: dict = Depends(get_current_active_user),
    supabase = Depends(get_supabase_client)
):
    """
    Process chat message with LangGraph travel agent.
    
    The agent maintains conversation context using thread_id and can:
    - Create new travel itineraries
    - Refine existing itineraries
    - Answer questions about destinations
    - Handle clarifications
    """
    try:
        # Crear el grafo del agente
        graph = create_travel_agent_graph()
        
        # Generar o usar thread_id existente
        thread_id = chat_request.thread_id or str(uuid.uuid4())
        
        # Recuperar conversación previa si existe
        previous_state = {}
        conversation_raw = None
        if chat_request.thread_id:
            try:
                conversation = supabase.table("conversations").select("*").eq("id", thread_id).single().execute()
                if conversation.data:
                    conversation_raw = conversation.data
                    previous_state = conversation.data.get("state", {})
                    logger.info(f"Conversación recuperada para thread_id: {thread_id} con {len(conversation.data.get('messages', []))} mensajes previos")
            except Exception as e:
                logger.warning(f"No se pudo recuperar conversación previa: {e}")
        
        # Restaurar mensajes previos completos de la conversación
        previous_messages = []
        if chat_request.thread_id and conversation_raw:
            previous_messages = conversation_raw.get("messages", [])
        
        new_user_message = {
            "role": "user",
            "content": chat_request.message,
            "timestamp": datetime.now().isoformat()
        }
        
        # Construir resumen compacto del estado acumulado para el contexto del LLM
        accumulated_summary = _build_state_summary(previous_state)
        
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
            "days": previous_state.get("days"),
            "budget": previous_state.get("budget"),
            "travel_style": previous_state.get("travel_style"),
            "travelers": previous_state.get("travelers"),
            "itinerary": previous_state.get("itinerary"),
        }
        
        # Ejecutar el grafo
        logger.info(f"Ejecutando grafo para thread_id: {thread_id}")
        result = await graph.ainvoke(input_state)
        
        # Extraer respuesta
        assistant_messages = [
            msg for msg in result.get("messages", [])
            if msg.get("role") == "assistant"
        ]
        
        response_message = assistant_messages[-1]["content"] if assistant_messages else "Lo siento, no pude procesar tu mensaje."
        
        # Guardar estado de la conversación en Supabase
        try:
            conversation_data = {
                "id": thread_id,
                "user_id": current_user["id"],
                "messages": result.get("messages", []),
                "state": {
                    "destination": result.get("destination"),
                    "days": result.get("days"),
                    "budget": result.get("budget"),
                    "travel_style": result.get("travel_style"),
                    "travelers": result.get("travelers"),
                    "searched_places": result.get("searched_places", []),
                    "day_plans": result.get("day_plans", []),
                    "iteration_count": result.get("iteration_count", 0),
                    "itinerary": result.get("itinerary"),
                },
                "updated_at": datetime.now().isoformat()
            }
            
            # Upsert (insert o update)
            supabase.table("conversations").upsert(conversation_data).execute()
            logger.info(f"Estado de conversación guardado para thread_id: {thread_id}")
        except Exception as e:
            logger.error(f"Error guardando estado de conversación: {e}")
        
        # Guardar itinerario completo en Supabase si es necesario
        if chat_request.save_conversation and result.get("itinerary"):
            await _save_conversation(
                supabase,
                current_user["id"],
                current_user.get("email", ""),
                result,
                thread_id
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
            thread_id=thread_id,
            itinerary=itinerary_response,
            needs_clarification=result.get("needs_clarification", False),
            clarification_questions=result.get("clarification_questions", [])
        )
        
    except Exception as e:
        logger.error(f"Error procesando mensaje: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error procesando mensaje: {str(e)}"
        )


async def _save_conversation(
    supabase,
    user_id: str,
    user_email: str,
    result: dict,
    thread_id: str
):
    """Guarda la conversación y el itinerario en Supabase."""
    try:
        itinerary = result.get("itinerary")
        if not itinerary:
            return
        
        # Asegurar que el perfil exista (para usuarios que no tienen trigger)
        try:
            supabase.table("profiles").upsert({
                "id": user_id,
                "email": user_email or "user@example.com",
                "updated_at": datetime.now().isoformat()
            }, on_conflict="id").execute()
        except Exception:
            pass  # El perfil puede ya existir
        
        # Guardar itinerario
        itinerary_data = {
            "user_id": user_id,
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
            "thread_id": thread_id,
            "status": "draft"
        }
        
        response = supabase.table("itineraries").insert(itinerary_data).execute()
        logger.info(f"Itinerario guardado para usuario {user_id}")
        
    except Exception as e:
        logger.error(f"Error guardando conversación: {e}")


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
    if state.get("itinerary"):
        parts.append("Itinerario: Ya generado previamente")
    
    if not parts:
        return ""
    
    return "ESTADO CONFIRMADO POR EL USUARIO: " + " | ".join(parts)
