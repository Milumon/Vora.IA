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
9. IMPORTANTE: Usa el place_id EXACTO de la lista de lugares disponibles para cada lugar que incluyas. Copia el ID tal cual aparece en "ID: ...".

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
      "notes": "Consejos específicos para este día",
      "day_summary": "Resumen breve y atractivo del día (ej: Llegada a Cusco y exploración del Centro Histórico)"
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
            "travel_style": ", ".join(state.get("travel_style") or ["variado"]),
            "travelers": state.get("travelers", 1),
            "places_json": places_json
        })
        
        # Enriquecer lugares del itinerario con fotos y datos reales de searched_places
        searched_places_by_id = {p.get("place_id"): p for p in state.get("searched_places", []) if p.get("place_id")}
        result = _enrich_itinerary_with_place_data(result, searched_places_by_id)
        
        # Enriquecer itinerario con datos de movilidad (vuelos, bus, auto)
        mobility_options = state.get("mobility_options", [])
        result = _embed_mobility(result, mobility_options)
        
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


def _normalize_name(name: str) -> str:
    """Normaliza nombre para comparación (minúsculas, sin espacios extra)."""
    if not name:
        return ""
    return " ".join((name or "").lower().strip().split())


def _enrich_itinerary_with_place_data(itinerary: Dict, searched_places_by_id: Dict[str, Dict]) -> Dict:
    """Enriquece los lugares del itinerario con fotos y datos reales de Google Places."""
    day_plans = itinerary.get("day_plans", [])
    searched_by_name = {_normalize_name(p.get("name", "")): p for p in searched_places_by_id.values()}
    
    for day in day_plans:
        for slot in ("morning", "afternoon", "evening"):
            places = day.get(slot, [])
            for place in places:
                place_id = place.get("place_id", "")
                real_data = searched_places_by_id.get(place_id)
                
                if not real_data:
                    name_key = _normalize_name(place.get("name", ""))
                    real_data = searched_by_name.get(name_key)
                    if not real_data and name_key:
                        for search_name, search_place in searched_by_name.items():
                            if name_key in search_name or search_name in name_key:
                                real_data = search_place
                                break
                
                if real_data:
                    place["photos"] = real_data.get("photos", [])
                    place["location"] = real_data.get("location", place.get("location", {"lat": 0, "lng": 0}))
                    if real_data.get("address"):
                        place["address"] = real_data["address"]
                    if real_data.get("rating") is not None:
                        place["rating"] = real_data["rating"]
                    if real_data.get("price_level") is not None:
                        place["price_level"] = real_data["price_level"]
                    if real_data.get("types"):
                        place["types"] = real_data["types"]
    
    return itinerary


def _embed_mobility(itinerary: Dict, mobility_options: List[Dict]) -> Dict:
    """
    Adjunta la información de movilidad (vuelos, bus, auto) al primer día del itinerario.
    El frontend puede leer day_plan.mobility para renderizar MobilityCard.
    """
    if not mobility_options:
        return itinerary

    day_plans = itinerary.get("day_plans", [])
    if not day_plans:
        return itinerary

    # Adjuntar el primer segmento de movilidad al primer día (tramo de llegada)
    day_plans[0]["mobility"] = mobility_options[0]

    # Si hay más segmentos (multi-destino), los adjuntamos a días subsiguientes
    for i, segment in enumerate(mobility_options[1:], 1):
        if i < len(day_plans):
            day_plans[i]["mobility"] = segment

    return itinerary


def _format_places_for_llm(places: List[Dict]) -> str:
    """Formatea lugares para el prompt del LLM."""
    if not places:
        return "No se encontraron lugares específicos. Usa tu conocimiento de Perú."
    
    formatted = []
    for i, place in enumerate(places[:20], 1):  # Máximo 20 lugares
        # Manejar price_level que puede ser None
        price_level = place.get('price_level')
        if price_level is not None and isinstance(price_level, int):
            price_str = '$' * price_level
        else:
            price_str = 'N/A'
        
        formatted.append(
            f"{i}. {place.get('name', 'Sin nombre')}\n"
            f"   - Dirección: {place.get('address', 'N/A')}\n"
            f"   - Rating: {place.get('rating', 'N/A')}/5\n"
            f"   - Precio: {price_str}\n"
            f"   - Tipos: {', '.join(place.get('types', [])[:3])}\n"
            f"   - ID: {place.get('place_id', '')}"
        )
    
    return "\n\n".join(formatted)


def _build_response_message(itinerary: Dict, state: TravelState) -> str:
    """Construye un mensaje amigable y CONCISO con el itinerario."""
    
    title = itinerary.get("title", "Tu Itinerario en Perú")
    description = itinerary.get("description", "")
    day_plans = itinerary.get("day_plans", [])
    tips = itinerary.get("tips", [])
    budget = itinerary.get("estimated_budget", "")
    
    # Mensaje CONCISO - solo resumen
    message = f"🎉 ¡Listo! He creado tu itinerario perfecto.\n\n"
    message += f"**{title}**\n\n"
    message += f"{description}\n\n"
    
    # Resumen compacto por días (solo nombres de lugares principales)
    message += f"📅 **{len(day_plans)} días de aventura:**\n\n"
    
    for day in day_plans[:3]:  # Solo mostrar primeros 3 días en el mensaje
        day_num = day.get("day_number", 0)
        all_places = day.get("morning", []) + day.get("afternoon", []) + day.get("evening", [])
        
        if all_places:
            place_names = [p.get('name', '') for p in all_places[:2]]  # Solo 2 lugares principales
            message += f"**Día {day_num}:** {', '.join(place_names)}"
            if len(all_places) > 2:
                message += f" y {len(all_places) - 2} más"
            message += "\n"
    
    if len(day_plans) > 3:
        message += f"\n_...y {len(day_plans) - 3} días más de aventura_\n"
    
    # Solo 2 tips principales
    if tips:
        message += f"\n💡 **Tips clave:**\n"
        for tip in tips[:2]:
            message += f"• {tip}\n"
        if len(tips) > 2:
            message += f"_...y {len(tips) - 2} consejos más_\n"
    
    # Presupuesto
    if budget:
        message += f"\n💰 **Presupuesto:** {budget}\n"
    
    message += "\n✨ _Mira el mapa para ver todos los detalles del itinerario completo._"
    
    return message
