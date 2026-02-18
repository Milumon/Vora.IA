from fastapi import APIRouter, Depends, HTTPException, status
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


@router.post("/", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat(
    request: ChatRequest,
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
        thread_id = request.thread_id or str(uuid.uuid4())
        
        # Preparar entrada
        input_state = {
            "messages": [{
                "role": "user",
                "content": request.message,
                "timestamp": datetime.now().isoformat()
            }],
            "max_iterations": 10,
            "searched_places": [],
            "day_plans": [],
            "needs_clarification": False,
            "clarification_questions": [],
            "iteration_count": 0
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
        
        # Guardar conversación en Supabase si es necesario
        if request.save_conversation and result.get("itinerary"):
            await _save_conversation(
                supabase,
                current_user["id"],
                result,
                thread_id
            )
        
        return ChatResponse(
            message=response_message,
            thread_id=thread_id,
            itinerary=result.get("itinerary"),
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
    result: dict,
    thread_id: str
):
    """Guarda la conversación y el itinerario en Supabase."""
    try:
        itinerary = result.get("itinerary")
        if not itinerary:
            return
        
        # Guardar itinerario
        itinerary_data = {
            "user_id": user_id,
            "title": itinerary.get("title", "Mi Viaje a Perú"),
            "destination": result.get("destination"),
            "start_date": result.get("start_date"),
            "end_date": result.get("end_date"),
            "days": result.get("days"),
            "budget": result.get("budget"),
            "travelers": result.get("travelers", 1),
            "itinerary_data": itinerary,
            "thread_id": thread_id,
            "status": "draft"
        }
        
        response = supabase.table("itineraries").insert(itinerary_data).execute()
        logger.info(f"Itinerario guardado para usuario {user_id}")
        
    except Exception as e:
        logger.error(f"Error guardando conversación: {e}")
