"""
Nodo para manejar respuestas conversacionales.

Genera la respuesta del asistente (Vora) basándose en el estado actual de la
conversación. Incluye:
  - Filtrado programático de preguntas redundantes (campos ya confirmados)
  - Detección de frustración del usuario
  - Dos modos de respuesta:
    a) Clarificación: pide info faltante con una sola pregunta a la vez
    b) Confirmación: resume la info y procede al pipeline
"""
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from app.agents.state import TravelState
from app.config.settings import get_settings
from app.config.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)


# ── Keywords de campos confirmados (reutilizado para filtrado) ────────────────

_FIELD_KEYWORDS: dict[str, list[str]] = {
    "destination": ["destino", "lugar", "ciudad", "zona", "región", "dónde", "donde", "qué parte", "que parte"],
    "days": ["días", "duración", "cuánto tiempo", "cuanto tiempo", "cuántos días", "cuantos dias"],
    "budget": ["presupuesto", "budget", "gastar", "costo", "económico"],
    "budget_total": ["presupuesto total", "presupuesto", "budget", "cuánto", "cuanto", "dinero", "soles", "dólares", "dolares"],
    "travel_style": ["estilo", "tipo de viaje", "experiencia", "aventura", "cultural", "relajado"],
    "travelers": ["viajeros", "personas", "cuántos van", "cuantos van", "grupo", "acompañante"],
    "start_date": ["fecha", "cuándo", "cuando", "salida", "partida", "inicio", "fecha de inicio"],
    "end_date": ["regreso", "vuelta", "fin del viaje", "fecha de fin", "fecha final"],
}

# Frases que indican frustración del usuario
_FRUSTRATION_PHRASES = [
    "ya te dije", "ya lo dije", "te lo dije", "repet", "otra vez",
    "ya mencion", "ya te lo", "constantmente", "de nuevo"
]


async def generate_response(state: TravelState) -> dict:
    """
    Genera una respuesta conversacional basada en el estado actual.

    Dos modos:
      1. needs_clarification=True → pregunta por campos faltantes (filtrados)
      2. needs_clarification=False → resume info y confirma antes del pipeline
    """

    llm = ChatOpenAI(
        model=settings.OPENAI_MODEL,
        temperature=0.7,
        api_key=settings.OPENAI_API_KEY
    )

    # ── Leer estado ───────────────────────────────────────────────────────
    destination = state.get("destination")
    days = state.get("days")
    budget = state.get("budget")
    budget_total = state.get("budget_total")
    travel_style = state.get("travel_style")
    travelers = state.get("travelers")
    start_date = state.get("start_date")
    end_date = state.get("end_date")
    needs_clarification = state.get("needs_clarification", False)
    clarification_questions = state.get("clarification_questions", [])
    accumulated = state.get("accumulated_summary", "")

    messages = state.get("messages", [])
    conversation_context = "\n".join([
        f"{msg['role']}: {msg['content']}" 
        for msg in messages[-15:]
    ])

    # ── Detectar frustración ──────────────────────────────────────────────
    frustration_instruction = _detect_frustration(messages)

    # ── Filtrar preguntas redundantes (segunda barrera programática) ──────
    filtered_questions = _filter_confirmed_questions(
        clarification_questions,
        destination=destination,
        days=days,
        budget=budget,
        budget_total=budget_total,
        travel_style=travel_style,
        travelers=travelers,
        start_date=start_date,
        end_date=end_date,
    )

    # Si después de filtrar no quedan preguntas, no necesita clarificación
    if needs_clarification and not filtered_questions:
        logger.info(
            "conversation_manager: todas las preguntas fueron filtradas. "
            "Cambiando a modo confirmación."
        )
        needs_clarification = False

    # ── Generar respuesta ─────────────────────────────────────────────────
    if needs_clarification and filtered_questions:
        response_message = await _generate_clarification_response(
            llm=llm,
            destination=destination,
            days=days,
            budget=budget,
            budget_total=budget_total,
            travel_style=travel_style,
            travelers=travelers,
            start_date=start_date,
            end_date=end_date,
            accumulated=accumulated,
            frustration_instruction=frustration_instruction,
            questions=filtered_questions,
            conversation_context=conversation_context,
        )
    else:
        response_message = await _generate_confirmation_response(
            llm=llm,
            destination=destination,
            days=days,
            budget=budget,
            budget_total=budget_total,
            travel_style=travel_style,
            travelers=travelers,
            start_date=start_date,
            end_date=end_date,
        )

    return {
        "messages": [{
            "role": "assistant",
            "content": response_message,
            "timestamp": ""
        }]
    }


# ── Funciones internas ────────────────────────────────────────────────────────

def _detect_frustration(messages: list) -> str:
    """
    Detecta si el último mensaje del usuario indica frustración por repetición.
    Retorna instrucción especial para el prompt, o string vacío.
    """
    last_user_msg = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            last_user_msg = msg["content"].lower()
            break

    if any(phrase in last_user_msg for phrase in _FRUSTRATION_PHRASES):
        return """
⚠️ EL USUARIO ESTÁ FRUSTRADO PORQUE SIENTE QUE REPITES PREGUNTAS.
- Discúlpate BREVEMENTE (1 línea máximo)
- Confirma la información que ya tienes
- Avanza directamente con lo que FALTA, sin repetir nada
"""
    return ""


def _filter_confirmed_questions(
    questions: list[str],
    *,
    destination,
    days,
    budget,
    budget_total,
    travel_style,
    travelers,
    start_date,
    end_date,
) -> list[str]:
    """
    Segunda barrera de filtrado: elimina preguntas que mencionan
    campos ya confirmados usando keyword matching.
    """
    confirmed_keywords: list[str] = []

    field_values = {
        "destination": destination,
        "days": days,
        "budget": budget,
        "budget_total": budget_total,
        "travel_style": travel_style,
        "travelers": travelers,
        "start_date": start_date,
        "end_date": end_date,
    }

    for field_name, value in field_values.items():
        if value and field_name in _FIELD_KEYWORDS:
            confirmed_keywords.extend(_FIELD_KEYWORDS[field_name])

    if not confirmed_keywords:
        return questions

    filtered = []
    for q in questions:
        q_lower = q.lower()
        if any(kw in q_lower for kw in confirmed_keywords):
            logger.debug("conversation_manager filtró pregunta: %s", q)
        else:
            filtered.append(q)

    return filtered


async def _generate_clarification_response(
    *,
    llm,
    destination,
    days,
    budget,
    budget_total,
    travel_style,
    travelers,
    start_date,
    end_date,
    accumulated,
    frustration_instruction,
    questions,
    conversation_context,
) -> str:
    """Genera respuesta pidiendo clarificación sobre campos faltantes."""

    prompt = ChatPromptTemplate.from_messages([
        ("system", """Eres Vora, una experta en viajes por Perú. Eres cálida, entusiasta, y conoces cada rincón del país.

═══ LO QUE YA SABES (PROHIBIDO volver a preguntar) ═══
{accumulated_summary}

═══ INFORMACIÓN CONFIRMADA ═══
- Destino: {destination}
- Días: {days}
- Fecha inicio: {start_date}
- Fecha fin: {end_date}
- Presupuesto total: {budget_total}
- Nivel de presupuesto: {budget}
- Estilo: {travel_style}
- Viajeros: {travelers}

{frustration_instruction}

═══ FORMATO DE RESPUESTA (sigue este formato EXACTO) ═══

Tu respuesta DEBE seguir esta estructura:

1. PÁRRAFO INICIAL: Un comentario entusiasta sobre lo que el usuario mencionó.
   - Si mencionó un destino, haz un comentario específico sobre ese lugar.
   - Si mencionó un estilo (romántico, aventura, etc.), haz referencia a ello.
   - Usa emojis con moderación (1-2 máximo).
   - Máximo 3 líneas.

2. LÍNEA EN BLANCO

3. TEXTO INTRODUCTORIO: Una frase como "Para armar el plan perfecto, cuéntame:" o similar.

4. LÍNEA EN BLANCO

5. PREGUNTAS: Cada pregunta en su propia línea, envuelta en **negritas**.
   - Ejemplo: **¿Cuántos días tienes disponibles?**
   - Solo incluye preguntas de la lista PENDIENTES, NO inventes otras.
   - Máximo 2-3 preguntas.

6. Si quieres, añade una frase final de cierre entusiasta.

═══ REGLAS CRÍTICAS ═══
- PROHIBIDO preguntar sobre campos que ya están en INFORMACIÓN CONFIRMADA
- Si destino está confirmado, NO preguntes zona, región, ni lugar
- Si días está confirmado, NO preguntes duración
- Si fechas están confirmadas, NO preguntes cuándo viaja
- Si presupuesto total está confirmado, NO preguntes cuánto quiere gastar
- Solo haz preguntas sobre lo que REALMENTE falta
- No uses bullet points ni listas, usa texto con saltos de línea
- PROHIBIDO incluir nombres de variables técnicas como (start_date), (end_date), (budget_total) en la respuesta
- PROHIBIDO incluir formatos de fecha técnicos como YYYY-MM-DD, DD-MM-YYYY o similares en la respuesta
- Pide las fechas de forma natural: "¿Cuándo planeas viajar?" o "¿En qué fechas?", NUNCA con formato técnico
- Pide el presupuesto de forma natural: "¿Cuánto presupuesto tienes?" o "¿Cuánto quieres gastar?", sin variables

PREGUNTAS PENDIENTES (solo estas, NO inventes otras):
{questions}

Conversación previa:
{conversation}
"""),
        ("user", "Genera la respuesta siguiendo el formato exacto. NO repitas preguntas ya respondidas.")
    ])

    chain = prompt | llm

    result = await chain.ainvoke({
        "destination": destination or "No especificado aún",
        "days": days or "No especificado aún",
        "start_date": start_date or "No especificada",
        "end_date": end_date or "No especificada",
        "budget_total": budget_total or "No especificado aún",
        "budget": budget or "No especificado aún",
        "travel_style": travel_style or "No especificado aún",
        "travelers": travelers or "No especificado aún",
        "accumulated_summary": accumulated or "Sin información previa",
        "frustration_instruction": frustration_instruction,
        "questions": "\n".join(f"- {q}" for q in questions),
        "conversation": conversation_context
    })

    return result.content


async def _generate_confirmation_response(
    *,
    llm,
    destination,
    days,
    budget,
    budget_total,
    travel_style,
    travelers,
    start_date,
    end_date,
) -> str:
    """Genera respuesta de confirmación cuando toda la info obligatoria está lista."""

    prompt = ChatPromptTemplate.from_messages([
        ("system", """Eres Vora, una experta en viajes por Perú.

El usuario ha proporcionado la información necesaria. Genera un mensaje BREVE y entusiasta
confirmando que vas a generar su itinerario.

INFORMACIÓN DEL VIAJE:
- Destino: {destination}
- Días: {days}
- Fecha inicio: {start_date}
- Fecha fin: {end_date}
- Presupuesto total: {budget_total}
- Nivel: {budget}
- Estilo: {travel_style}
- Viajeros: {travelers}

Genera una respuesta que:
1. Resuma la información de forma compacta (máximo 3 líneas)
2. Muestre entusiasmo por el viaje
3. Indica que vas a preparar el itinerario

IMPORTANTE: Máximo 4 líneas de respuesta total.
"""),
        ("user", "Genera el resumen y confirmación.")
    ])

    chain = prompt | llm

    result = await chain.ainvoke({
        "destination": destination,
        "days": days,
        "start_date": start_date or "No especificada",
        "end_date": end_date or "No especificada",
        "budget_total": budget_total or "No especificado",
        "budget": budget or "Flexible",
        "travel_style": travel_style or "Variado",
        "travelers": travelers or "No especificado",
    })

    return result.content
