"""Nodo constructor de itinerarios completos."""
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from typing import List, Dict
import json
from app.agents.state import TravelState, DayPlan
from app.config.settings import get_settings
from app.config.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)


async def build_itinerary(state: TravelState) -> dict:
    """Construye un itinerario completo usando GPT-4."""
    
    # Validar que tengamos la información necesaria
    if not state.get("destination") or not state.get("days"):
        logger.warning("Faltan datos para construir itinerario")
        return {
            "messages": [{
                "role": "assistant",
                "content": "Necesito más información para crear tu itinerario. ¿Podrías decirme a dónde quieres viajar y por cuántos días?",
                "timestamp": ""
            }]
        }
    
    llm = ChatOpenAI(
        model=settings.OPENAI_MODEL,
        temperature=0.7,
        api_key=settings.OPENAI_API_KEY
    )
    
    parser = JsonOutputParser()
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Eres un experto planificador de viajes especializado en Perú con años de experiencia.

Crea un itinerario detallado día a día considerando:
- Destino: {destination}
- Días: {days}
- Presupuesto: {budget}
- Estilo de viaje: {travel_style}
- Número de viajeros: {travelers}

LUGARES DISPONIBLES:
{places_json}

INSTRUCCIONES IMPORTANTES:
1. Distribuye los lugares lógicamente por días (mañana, tarde, noche)
2. Agrupa lugares cercanos en el mismo día para minimizar desplazamientos
3. Balancea actividades: no sobrecargues días (máximo 3-4 lugares por día)
4. Considera horarios realistas:
   - Mañana: 8:00-13:00
   - Tarde: 14:00-19:00
   - Noche: 19:00-23:00
5. Incluye tiempo para comidas (1-2 horas)
6. Sugiere restaurantes típicos para cada día
7. Añade consejos prácticos específicos de Perú
8. Considera el clima y la altitud (especialmente en Cusco, Puno, Arequipa)

FORMATO DE RESPUESTA (JSON):
{{
  "title": "Título atractivo del itinerario",
  "description": "Descripción general del viaje (2-3 líneas)",
  "day_plans": [
    {{
      "day_number": 1,
      "date": null,
      "morning": [
        {{
          "place_id": "...",
          "name": "...",
          "address": "...",
          "rating": 4.5,
          "price_level": 2,
          "types": ["museum"],
          "photos": [],
          "location": {{"lat": -12.0, "lng": -77.0}},
          "visit_duration": "2 horas",
          "why_visit": "Razón para visitar este lugar"
        }}
      ],
      "afternoon": [...],
      "evening": [...],
      "notes": "Consejos específicos para este día"
    }}
  ],
  "tips": [
    "Consejo general 1",
    "Consejo general 2"
  ],
  "estimated_budget": "Estimación de presupuesto total en USD"
}}

Responde SOLO con el JSON, sin texto adicional.
"""),
        ("user", "Crea el mejor itinerario posible con esta información.")
    ])
    
    places_json = _format_places_for_llm(state.get("searched_places", []))
    
    chain = prompt | llm | parser
    
    try:
        result = await chain.ainvoke({
            "destination": state["destination"],
            "days": state["days"],
            "budget": state.get("budget", "medium"),
            "travel_style": ", ".join(state.get("travel_style", ["variado"])),
            "travelers": state.get("travelers", 1),
            "places_json": places_json
        })
        
        # Construir mensaje de respuesta
        response_message = _build_response_message(result, state)
        
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
        logger.error(f"Error construyendo itinerario: {e}")
        return {
            "messages": [{
                "role": "assistant",
                "content": f"Hubo un error al crear tu itinerario. Por favor, intenta de nuevo. Error: {str(e)}",
                "timestamp": ""
            }]
        }


def _format_places_for_llm(places: List[Dict]) -> str:
    """Formatea lugares para el prompt del LLM."""
    if not places:
        return "No se encontraron lugares específicos. Usa tu conocimiento de Perú."
    
    formatted = []
    for i, place in enumerate(places[:20], 1):  # Máximo 20 lugares
        formatted.append(
            f"{i}. {place.get('name', 'Sin nombre')}\n"
            f"   - Dirección: {place.get('address', 'N/A')}\n"
            f"   - Rating: {place.get('rating', 'N/A')}/5\n"
            f"   - Precio: {'$' * (place.get('price_level', 2))}\n"
            f"   - Tipos: {', '.join(place.get('types', [])[:3])}\n"
            f"   - ID: {place.get('place_id', '')}"
        )
    
    return "\n\n".join(formatted)


def _build_response_message(itinerary: Dict, state: TravelState) -> str:
    """Construye un mensaje amigable con el itinerario."""
    
    title = itinerary.get("title", "Tu Itinerario en Perú")
    description = itinerary.get("description", "")
    day_plans = itinerary.get("day_plans", [])
    tips = itinerary.get("tips", [])
    budget = itinerary.get("estimated_budget", "")
    
    message = f"🎉 ¡He creado tu itinerario perfecto!\n\n"
    message += f"**{title}**\n\n"
    message += f"{description}\n\n"
    
    # Resumen por días
    message += f"📅 **Resumen de {len(day_plans)} días:**\n\n"
    
    for day in day_plans:
        day_num = day.get("day_number", 0)
        morning = day.get("morning", [])
        afternoon = day.get("afternoon", [])
        evening = day.get("evening", [])
        
        message += f"**Día {day_num}:**\n"
        
        if morning:
            message += f"  🌅 Mañana: {', '.join([p.get('name', '') for p in morning])}\n"
        if afternoon:
            message += f"  ☀️ Tarde: {', '.join([p.get('name', '') for p in afternoon])}\n"
        if evening:
            message += f"  🌙 Noche: {', '.join([p.get('name', '') for p in evening])}\n"
        
        if day.get("notes"):
            message += f"  💡 {day['notes']}\n"
        
        message += "\n"
    
    # Tips generales
    if tips:
        message += "💡 **Consejos importantes:**\n"
        for tip in tips:
            message += f"- {tip}\n"
        message += "\n"
    
    # Presupuesto estimado
    if budget:
        message += f"💰 **Presupuesto estimado:** {budget}\n\n"
    
    message += "¿Te gustaría que ajuste algo del itinerario? Puedo modificar días específicos, cambiar lugares o ajustar el ritmo del viaje."
    
    return message
