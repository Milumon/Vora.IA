"""Nodo para manejar refinamientos de itinerarios existentes."""
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from typing import Dict
from app.agents.state import TravelState
from app.config.settings import get_settings
from app.config.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)


async def handle_refinement(state: TravelState) -> dict:
    """Maneja refinamientos del itinerario existente."""
    
    current_itinerary = state.get("itinerary")
    
    if not current_itinerary:
        logger.warning("No hay itinerario para refinar")
        return {
            "messages": [{
                "role": "assistant",
                "content": "No tengo un itinerario previo para modificar. ¿Quieres que cree uno nuevo?",
                "timestamp": ""
            }]
        }
    
    llm = ChatOpenAI(
        model=settings.OPENAI_MODEL,
        temperature=0.7,
        api_key=settings.OPENAI_API_KEY
    )
    
    parser = JsonOutputParser()
    
    # Obtener el último mensaje del usuario (la solicitud de cambio)
    last_message = state["messages"][-1]["content"]
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Eres un experto en ajustar itinerarios de viaje en Perú.

ITINERARIO ACTUAL:
{current_itinerary}

SOLICITUD DEL USUARIO:
{user_request}

INSTRUCCIONES:
1. Analiza qué quiere cambiar el usuario
2. Modifica SOLO lo necesario del itinerario
3. Mantén la coherencia del resto del plan
4. Si el cambio afecta otros días, ajústalos también
5. Explica brevemente qué cambiaste y por qué

Responde con el itinerario modificado en el mismo formato JSON que el original.
Incluye un campo adicional "changes_made" con la lista de cambios realizados.
"""),
        ("user", "Modifica el itinerario según mi solicitud.")
    ])
    
    chain = prompt | llm | parser
    
    try:
        result = await chain.ainvoke({
            "current_itinerary": str(current_itinerary),
            "user_request": last_message
        })
        
        changes = result.get("changes_made", [])
        changes_text = "\n".join([f"- {change}" for change in changes])
        
        response_message = (
            f"✅ He actualizado tu itinerario:\n\n"
            f"{changes_text}\n\n"
            f"¿Hay algo más que quieras ajustar?"
        )
        
        return {
            "itinerary": result,
            "day_plans": result.get("day_plans", []),
            "messages": [{
                "role": "assistant",
                "content": response_message,
                "timestamp": ""
            }]
        }
        
    except Exception as e:
        logger.error(f"Error refinando itinerario: {e}")
        return {
            "messages": [{
                "role": "assistant",
                "content": f"Hubo un error al modificar el itinerario. ¿Podrías ser más específico sobre qué quieres cambiar?",
                "timestamp": ""
            }]
        }
