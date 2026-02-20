"""
Nodo de extracción de preferencias del usuario.

Extrae metadatos del viaje (destino, días, fechas, etc.) del mensaje del usuario
usando un LLM. Implementa guardias programáticas post-LLM para evitar que el
agente re-pregunte información ya confirmada.

Flujo:
  1. Construir snapshot de campos confirmados vs. faltantes (obligatorios).
  2. Invocar LLM para extraer información NUEVA del último mensaje.
  3. Merge: combinar nuevos datos con estado previo.
  4. Guardia programática: si los campos obligatorios están completos,
     forzar needs_clarification=False independientemente de lo que diga el LLM.
  5. Actualizar accumulated_summary con TODA la info confirmada.
"""
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, date
from app.agents.state import TravelState
from app.config.settings import get_settings
from app.config.logging import get_logger

logger = get_logger(__name__)

settings = get_settings()


# ── Schema de extracción ──────────────────────────────────────────────────────

class ExtractedPreferences(BaseModel):
    """Preferencias extraídas del mensaje del usuario."""
    destination: Optional[str] = Field(None, description="Ciudad o región de Perú mencionada")
    destinations: Optional[List[str]] = Field(None, description="Lista de ciudades para viaje multi-destino")
    days: Optional[int] = Field(None, description="Número de días del viaje")
    budget: Optional[Literal["low", "medium", "high"]] = Field(None, description="Nivel de presupuesto")
    travel_style: Optional[List[str]] = Field(None, description="Estilos de viaje: cultural, adventure, relaxed, gastronomy, nightlife")
    travelers: Optional[int] = Field(None, description="Número de viajeros")
    start_date: Optional[str] = Field(
        None,
        description=(
            "Fecha de inicio del viaje en formato YYYY-MM-DD. "
            "Extrae si el usuario menciona algo como 'viajo el 15 de marzo', "
            "'salgo el 20-04', 'a partir del 1 de mayo', etc. "
            f"El año de referencia es {date.today().year} si no se especifica."
        )
    )
    end_date: Optional[str] = Field(
        None,
        description=(
            "Fecha de fin del viaje en formato YYYY-MM-DD. "
            "Extrae si el usuario menciona 'hasta el 25 de marzo', 'del 20 al 25', etc. "
            "Si solo menciona días de duración (y ya tenemos start_date) no calcules tú la end_date."
        )
    )
    needs_clarification: bool = Field(False, description="Si se necesita más información")
    clarification_questions: List[str] = Field(default_factory=list, description="Preguntas para el usuario")


# ── Campos obligatorios vs opcionales ─────────────────────────────────────────
# Solo destination y days son obligatorios para lanzar el pipeline.
# El resto se puede inferir o usar defaults.

REQUIRED_FIELDS = {"destination", "days"}

OPTIONAL_FIELDS = {"budget", "travel_style", "travelers", "start_date", "end_date"}


# ── Node principal ────────────────────────────────────────────────────────────

async def extract_preferences(state: TravelState) -> dict:
    """
    Extrae preferencias de viaje del mensaje del usuario con validación progresiva.

    Garantías programáticas (no dependen del LLM):
      - Si destination + days ya están confirmados → needs_clarification = False
      - Las clarification_questions se filtran contra campos ya confirmados
      - El accumulated_summary se actualiza con toda la info confirmada
    """

    llm = ChatOpenAI(
        model=settings.OPENAI_MODEL,
        temperature=0.3,
        api_key=settings.OPENAI_API_KEY
    )

    parser = PydanticOutputParser(pydantic_object=ExtractedPreferences)

    # ── 1. Leer estado actual ─────────────────────────────────────────────
    messages = state.get("messages", [])
    conversation_context = "\n".join([
        f"{msg['role']}: {msg['content']}" 
        for msg in messages[-15:]
    ])

    current = _read_current_fields(state)
    accumulated = state.get("accumulated_summary", "")

    # ── 2. Construir snapshot para el prompt ──────────────────────────────
    confirmed_str, missing_required_str = _build_field_snapshot(current)

    # ── 3. Invocar LLM ───────────────────────────────────────────────────
    prompt = _build_extraction_prompt()
    chain = prompt | llm | parser

    result = await chain.ainvoke({
        "conversation": conversation_context,
        "confirmed_fields": confirmed_str,
        "missing_required_fields": missing_required_str,
        "accumulated_summary": accumulated or "Primera interacción",
        "format_instructions": parser.get_format_instructions()
    })

    # ── 4. Merge: solo actualizar campos que el LLM extrajo ──────────────
    update = _merge_extracted(result)

    # ── 5. Guardia programática post-LLM ─────────────────────────────────
    #    Si los campos obligatorios están completos (ya sea por estado previo
    #    o por lo que acaba de extraer el LLM), forzar needs_clarification=False.
    final_destination = update.get("destination") or current["destination"]
    final_days = update.get("days") or current["days"]

    if final_destination and final_days:
        # Campos obligatorios completos → proceder al pipeline
        update["needs_clarification"] = False
        update["clarification_questions"] = []
        logger.info(
            "Guardia programática: campos obligatorios completos "
            f"(destination={final_destination}, days={final_days}). "
            "Forzando needs_clarification=False."
        )
    else:
        # Solo mantener preguntas sobre campos OBLIGATORIOS faltantes
        update["needs_clarification"] = result.needs_clarification
        update["clarification_questions"] = _filter_questions(
            result.clarification_questions,
            current
        )
        # Si después de filtrar no quedan preguntas, generar las necesarias
        if update["needs_clarification"] and not update["clarification_questions"]:
            update["clarification_questions"] = _generate_missing_questions(
                current, update
            )

    # ── 6. Actualizar accumulated_summary ─────────────────────────────────
    update["accumulated_summary"] = _build_accumulated_summary(current, update)

    logger.info(
        f"extract_preferences completado: "
        f"destination={update.get('destination', current['destination'])}, "
        f"days={update.get('days', current['days'])}, "
        f"needs_clarification={update['needs_clarification']}"
    )

    return update


# ── Helpers internos ──────────────────────────────────────────────────────────

def _read_current_fields(state: TravelState) -> dict:
    """Lee todos los campos de preferencias del estado actual."""
    return {
        "destination": state.get("destination"),
        "destinations": state.get("destinations"),
        "days": state.get("days"),
        "budget": state.get("budget"),
        "travel_style": state.get("travel_style"),
        "travelers": state.get("travelers"),
        "start_date": state.get("start_date"),
        "end_date": state.get("end_date"),
    }


def _build_field_snapshot(current: dict) -> tuple[str, str]:
    """
    Construye dos strings para el prompt:
      - confirmed_str: campos ya confirmados (el LLM NO debe re-preguntar)
      - missing_required_str: campos OBLIGATORIOS que faltan

    Los campos opcionales NO aparecen como 'faltantes' para evitar
    que el LLM los trate como urgentes.
    """
    confirmed = []
    missing_required = []

    # -- Campos obligatorios --
    if current["destination"]:
        confirmed.append(f"✅ Destino: {current['destination']}")
    else:
        missing_required.append("❌ Destino: NO definido (OBLIGATORIO)")

    if current["days"]:
        confirmed.append(f"✅ Días: {current['days']}")
    else:
        missing_required.append("❌ Días: NO definido (OBLIGATORIO)")

    # -- Campos opcionales: solo se listan como confirmados si existen,
    #    pero NUNCA como faltantes.
    if current["budget"]:
        confirmed.append(f"✅ Presupuesto: {current['budget']}")

    if current["travel_style"]:
        style_str = ", ".join(current["travel_style"]) if isinstance(current["travel_style"], list) else current["travel_style"]
        confirmed.append(f"✅ Estilo: {style_str}")

    if current["travelers"]:
        confirmed.append(f"✅ Viajeros: {current['travelers']}")

    if current["start_date"]:
        confirmed.append(f"✅ Fecha inicio: {current['start_date']}")

    if current["end_date"]:
        confirmed.append(f"✅ Fecha fin: {current['end_date']}")

    confirmed_str = "\n".join(confirmed) if confirmed else "Ninguno"
    missing_str = "\n".join(missing_required) if missing_required else "Ninguno — ¡listos para proceder!"

    return confirmed_str, missing_str


def _build_extraction_prompt() -> ChatPromptTemplate:
    """Construye el prompt de extracción con reglas claras de prioridad."""
    return ChatPromptTemplate.from_messages([
        ("system", """Eres Vora, una experta en viajes por Perú con un estilo conversacional amigable y entusiasta.

Tu objetivo es extraer información NUEVA del último mensaje del usuario.

═══════════════════════════════════════════════════
  INFORMACIÓN YA CONFIRMADA — PROHIBIDO RE-PREGUNTAR
═══════════════════════════════════════════════════
{confirmed_fields}

═══════════════════════════════════════════════════
  CAMPOS OBLIGATORIOS QUE FALTAN
═══════════════════════════════════════════════════
{missing_required_fields}

═══════════════════════════════════════════════════
  RESUMEN ACUMULADO
═══════════════════════════════════════════════════
{accumulated_summary}

════════════════════════════════════════════
  REGLA DE ORO
════════════════════════════════════════════
Si DESTINO y DÍAS ya están en "INFORMACIÓN YA CONFIRMADA",
entonces SIEMPRE pon needs_clarification = false y clarification_questions = [].
No importa si faltan datos opcionales: el sistema los resolverá automáticamente.

REGLAS CRÍTICAS:
1. NUNCA re-preguntes algo que ya está en "INFORMACIÓN YA CONFIRMADA".
2. Solo pregunta por lo que está en "CAMPOS OBLIGATORIOS QUE FALTAN".
3. NO preguntes por presupuesto, estilo, viajeros ni fechas como obligatorios.
4. Si el usuario ya dijo el destino (ej: "Arequipa"), NO preguntes zona ni región.
5. Si el usuario da destino + días en el mismo mensaje, pon needs_clarification=false.
6. Si el usuario menciona una fecha, extráela en formato YYYY-MM-DD.
7. Extrae CUALQUIER información nueva del mensaje actual, incluso opcional.

DESTINOS VÁLIDOS EN PERÚ:
Lima, Cusco, Arequipa, Puno, Iquitos, Trujillo, Chiclayo, Piura, Paracas, Nazca,
Huaraz, Ayacucho, Cajamarca, Tarapoto, Puerto Maldonado, Machu Picchu, Chachapoyas,
Abancay, Callao, Huancavelica, Huánuco, Ica, Huancayo, Huacho, Moquegua, Cerro de Pasco,
Moyobamba, Tacna, Tumbes, Pucallpa.

{format_instructions}

Conversación completa:
{conversation}
"""),
        ("user", "Extrae información nueva del último mensaje. Solo pregunta por campos OBLIGATORIOS que faltan.")
    ])


def _merge_extracted(result: ExtractedPreferences) -> dict:
    """Crea el dict de actualización solo con campos que el LLM efectivamente extrajo."""
    update = {}

    if result.destination:
        update["destination"] = result.destination
    if result.destinations:
        update["destinations"] = result.destinations
    if result.days:
        update["days"] = result.days
    if result.budget:
        update["budget"] = result.budget
    if result.travel_style:
        update["travel_style"] = result.travel_style
    if result.travelers:
        update["travelers"] = result.travelers

    # Parse date strings → Python date objects
    if result.start_date:
        parsed = _parse_date_safe(result.start_date)
        if parsed:
            update["start_date"] = parsed
        else:
            logger.warning("Could not parse start_date from LLM: %s", result.start_date)

    if result.end_date:
        parsed = _parse_date_safe(result.end_date)
        if parsed:
            update["end_date"] = parsed
        else:
            logger.warning("Could not parse end_date from LLM: %s", result.end_date)

    return update


# ── Keywords para filtrado de preguntas redundantes ───────────────────────────
# Mapeo de campo → palabras clave que indican que una pregunta se refiere a ese campo.

_FIELD_KEYWORDS: dict[str, list[str]] = {
    "destination": ["destino", "lugar", "ciudad", "zona", "región", "dónde", "donde", "qué parte", "que parte"],
    "days": ["días", "duración", "cuánto tiempo", "cuanto tiempo", "cuántos días", "cuantos dias"],
    "budget": ["presupuesto", "budget", "gastar", "costo", "económico"],
    "travel_style": ["estilo", "tipo de viaje", "experiencia", "aventura", "cultural", "relajado"],
    "travelers": ["viajeros", "personas", "cuántos van", "cuantos van", "grupo", "acompañante"],
    "start_date": ["fecha", "cuándo", "cuando", "salida", "partida", "inicio"],
    "end_date": ["regreso", "vuelta", "fin del viaje"],
}


def _filter_questions(
    questions: list[str],
    current: dict,
) -> list[str]:
    """
    Filtra preguntas de clarificación que se refieren a campos ya confirmados.

    Si un campo ya tiene valor en el estado, cualquier pregunta cuyo texto
    contenga keywords de ese campo es descartada.
    """
    # Recopilar keywords de campos ya confirmados
    confirmed_keywords: list[str] = []
    for field_name, keywords in _FIELD_KEYWORDS.items():
        if current.get(field_name):
            confirmed_keywords.extend(keywords)

    if not confirmed_keywords:
        return questions

    filtered = []
    for question in questions:
        q_lower = question.lower()
        is_redundant = any(kw in q_lower for kw in confirmed_keywords)
        if is_redundant:
            logger.debug("Pregunta filtrada (campo ya confirmado): %s", question)
        else:
            filtered.append(question)

    return filtered


def _generate_missing_questions(current: dict, update: dict) -> list[str]:
    """
    Genera preguntas solo para campos OBLIGATORIOS que aún faltan.
    Esto se usa como fallback si el LLM no generó preguntas útiles.
    """
    questions = []
    final_destination = update.get("destination") or current.get("destination")
    final_days = update.get("days") or current.get("days")

    if not final_destination:
        questions.append("¿A qué ciudad o región de Perú te gustaría viajar?")
    if not final_days:
        questions.append("¿Cuántos días durará tu viaje?")

    return questions


def _build_accumulated_summary(current: dict, update: dict) -> str:
    """
    Construye un resumen compacto con TODA la info confirmada
    (estado previo + lo que se acaba de extraer).
    """
    merged = {**current}
    for key, value in update.items():
        if value is not None and key in merged:
            merged[key] = value

    parts = []
    if merged.get("destination"):
        parts.append(f"Destino: {merged['destination']}")
    if merged.get("days"):
        parts.append(f"Días: {merged['days']}")
    if merged.get("budget"):
        parts.append(f"Presupuesto: {merged['budget']}")
    if merged.get("travel_style"):
        style = merged["travel_style"]
        if isinstance(style, list):
            style = ", ".join(style)
        parts.append(f"Estilo: {style}")
    if merged.get("travelers"):
        parts.append(f"Viajeros: {merged['travelers']}")
    if merged.get("start_date"):
        parts.append(f"Fecha inicio: {merged['start_date']}")
    if merged.get("end_date"):
        parts.append(f"Fecha fin: {merged['end_date']}")

    if not parts:
        return ""

    return "ESTADO CONFIRMADO: " + " | ".join(parts)


# ── Date parsing ──────────────────────────────────────────────────────────────

DATEFMT_CANDIDATES = [
    "%Y-%m-%d",  # ISO-8601 (primary target for LLM)
    "%d/%m/%Y",
    "%d-%m-%Y",
    "%d/%m/%y",
]


def _parse_date_safe(raw: str) -> Optional[date]:
    """Try multiple date formats and return a date object, or None on failure."""
    raw = raw.strip()
    for fmt in DATEFMT_CANDIDATES:
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    return None
