"""Nodo de clasificación de intención del usuario."""
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from app.agents.state import TravelState
from app.config.settings import get_settings

settings = get_settings()


async def classify_intent(state: TravelState) -> dict:
    """Clasifica la intención del último mensaje del usuario usando contexto conversacional."""
    
    llm = ChatOpenAI(
        model=settings.OPENAI_MODEL,
        temperature=0,
        api_key=settings.OPENAI_API_KEY
    )
    
    messages = state.get("messages", [])
    last_message = messages[-1]["content"] if messages else ""
    
    recent_context = "\n".join([
        f"{msg['role']}: {msg['content']}"
        for msg in messages[-6:]
    ])
    
    has_destination = bool(state.get("destination"))
    has_days = bool(state.get("days"))
    has_itinerary = bool(state.get("itinerary"))
    accumulated = state.get("accumulated_summary", "")
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Eres un clasificador de intenciones para un agente de viajes especializado en Perú.

CONTEXTO DE LA CONVERSACIÓN:
{recent_context}

ESTADO ACTUAL DEL VIAJE:
{accumulated_summary}
- Tiene destino definido: {has_destination}
- Tiene días definidos: {has_days}
- Tiene itinerario generado: {has_itinerary}

Analiza el ÚLTIMO MENSAJE del usuario considerando TODO el contexto previo.
Clasifica su intención en UNA de estas categorías:

- new_trip: El usuario quiere planear un viaje COMPLETAMENTE NUEVO desde cero (primera vez que habla de un viaje, o explícitamente pide uno nuevo)
- clarify: El usuario está RESPONDIENDO a una pregunta previa del asistente, dando información adicional sobre un viaje que ya se está planeando (número de días, presupuesto, estilo, etc.)
- refine: El usuario quiere MODIFICAR un itinerario que ya fue generado
- question: El usuario tiene una pregunta general sobre destinos/viajes en Perú

REGLAS CRÍTICAS:
- Si ya hay un viaje en curso (destino o días definidos) y el usuario da más detalles → "clarify"
- Si el usuario dice cosas como "7 días", "prefiero relajado", "somos 4", "sí, eso está bien" → "clarify"
- Solo usa "new_trip" si es la PRIMERA interacción o el usuario EXPLÍCITAMENTE dice "quiero otro viaje" / "empecemos de nuevo"
- Si el usuario se queja de que repites preguntas, es "clarify" (está dando contexto previo)

Responde SOLO con una palabra: new_trip, refine, question, o clarify"""),
        ("user", "{message}")
    ])
    
    chain = prompt | llm
    result = await chain.ainvoke({
        "message": last_message,
        "recent_context": recent_context,
        "accumulated_summary": accumulated or "Sin información previa",
        "has_destination": str(has_destination),
        "has_days": str(has_days),
        "has_itinerary": str(has_itinerary),
    })
    
    intent = result.content.strip().lower()
    
    valid_intents = ["new_trip", "refine", "question", "clarify"]
    if intent not in valid_intents:
        intent = "clarify" if (has_destination or has_days) else "new_trip"
    
    return {
        "intent": intent,
        "iteration_count": state.get("iteration_count", 0) + 1
    }
