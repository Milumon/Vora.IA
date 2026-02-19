"""Nodo de extracción de preferencias del usuario."""
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


class ExtractedPreferences(BaseModel):
    """Preferencias extraídas del mensaje del usuario."""
    destination: Optional[str] = Field(None, description="Ciudad o región de Perú mencionada")
    destinations: Optional[List[str]] = Field(None, description="Lista de ciudades para viaje multi-destino")
    days: Optional[int] = Field(None, description="Número de días del viaje")
    budget: Optional[Literal["low", "medium", "high"]] = Field(None, description="Nivel de presupuesto")
    travel_style: Optional[List[str]] = Field(None, description="Estilos de viaje: cultural, adventure, relaxed, gastronomy, nightlife")
    travelers: Optional[int] = Field(None, description="Número de viajeros")
    # Date fields — ISO-8601 strings (YYYY-MM-DD) so the LLM can produce them reliably
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


async def extract_preferences(state: TravelState) -> dict:
    """Extrae preferencias de viaje del mensaje del usuario con validación progresiva."""
    
    llm = ChatOpenAI(
        model=settings.OPENAI_MODEL,
        temperature=0.3,
        api_key=settings.OPENAI_API_KEY
    )
    
    parser = PydanticOutputParser(pydantic_object=ExtractedPreferences)
    
    messages = state.get("messages", [])
    conversation_context = "\n".join([
        f"{msg['role']}: {msg['content']}" 
        for msg in messages[-15:]
    ])
    
    current_destination = state.get("destination")
    current_days = state.get("days")
    current_budget = state.get("budget")
    current_style = state.get("travel_style")
    current_travelers = state.get("travelers")
    accumulated = state.get("accumulated_summary", "")
    
    current_start_date = state.get("start_date")
    current_end_date = state.get("end_date")

    confirmed_fields = []
    missing_fields = []
    
    if current_destination:
        confirmed_fields.append(f"✅ Destino: {current_destination}")
    else:
        missing_fields.append("❌ Destino: NO definido")
    
    if current_days:
        confirmed_fields.append(f"✅ Días: {current_days}")
    else:
        missing_fields.append("❌ Días: NO definido")
    
    if current_budget:
        confirmed_fields.append(f"✅ Presupuesto: {current_budget}")
    else:
        missing_fields.append("❌ Presupuesto: NO definido (opcional)")
    
    if current_style:
        style_str = ", ".join(current_style) if isinstance(current_style, list) else current_style
        confirmed_fields.append(f"✅ Estilo: {style_str}")
    else:
        missing_fields.append("❌ Estilo: NO definido (opcional)")
    
    if current_travelers:
        confirmed_fields.append(f"✅ Viajeros: {current_travelers}")
    else:
        missing_fields.append("❌ Viajeros: NO definido (opcional)")

    if current_start_date:
        confirmed_fields.append(f"✅ Fecha inicio: {current_start_date}")
    else:
        missing_fields.append("❌ Fecha de inicio: NO definida (opcional)")

    if current_end_date:
        confirmed_fields.append(f"✅ Fecha fin: {current_end_date}")
    
    confirmed_str = "\n".join(confirmed_fields) if confirmed_fields else "Ninguno"
    missing_str = "\n".join(missing_fields) if missing_fields else "Ninguno"
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Eres Vora, una experta en viajes por Perú con un estilo conversacional amigable y entusiasta.

Tu objetivo es extraer información NUEVA del último mensaje del usuario y determinar qué falta.

=== INFORMACIÓN YA CONFIRMADA (NO vuelvas a preguntar esto) ===
{confirmed_fields}

=== INFORMACIÓN QUE FALTA ===
{missing_fields}

=== RESUMEN ACUMULADO ===
{accumulated_summary}

REGLAS CRÍTICAS:
1. NUNCA re-preguntes algo que ya está en "INFORMACIÓN YA CONFIRMADA"
2. Si el usuario ya dijo el destino, NO preguntes el destino otra vez
3. Si el usuario ya dijo los días, NO preguntes los días otra vez
4. Extrae CUALQUIER información nueva del mensaje actual
5. Solo pregunta por lo que está en "INFORMACIÓN QUE FALTA"
6. Si el usuario se queja de repetición, discúlpate brevemente y avanza con lo que falta
7. Los campos obligatorios son: destino y días. El resto es opcional.
8. Si destino Y días están confirmados, pon needs_clarification=False para proceder

FLUJO DE PREGUNTAS (solo para campos faltantes):
1. DESTINO (obligatorio): Si no está confirmado, pregunta qué lugar de Perú.    
2. DÍAS (obligatorio): Si no está confirmado, pregunta cuántos días.
3. ESTILO (opcional): Pregunta qué tipo de experiencia busca.
4. PRESUPUESTO (opcional): Pregunta su presupuesto aproximado.
5. FECHA (obligatorio): Si el usuario menciona una fecha de salida en cualquier formato, extráela.
   - Ejemplos válidos: "el 15 de marzo", "20/04", "del 1 al 5 de mayo", "la próxima semana"
   - Convierte siempre a YYYY-MM-DD usando el año actual si no se especifica.
   - Preguntar por fecha si no la menciona el usuario.

DESTINOS VÁLIDOS EN PERÚ:
Lima, Cusco, Arequipa, Puno, Iquitos, Trujillo, Chiclayo, Piura, Paracas, Nazca, Huaraz, Ayacucho, Cajamarca, Tarapoto, Puerto Maldonado, Machu Picchu, Chachapoyas (Amazonas), Abancay (Apurímac), Callao (Provincia Constitucional), Huancavelica (Huancavelica), Huánuco (Huánuco), Ica (Ica), Huancayo (Junín), Huacho (Lima Provincias), Moquegua (Moquegua), Cerro de Pasco (Pasco), Moyobamba (San Martín), Tacna (Tacna), Tumbes (Tumbes), Pucallpa (Ucayali).

{format_instructions}

Conversación completa:
{conversation}
"""),
        ("user", "Extrae información nueva del último mensaje. Solo pregunta por lo que FALTA.")
    ])
    
    chain = prompt | llm | parser
    
    result = await chain.ainvoke({
        "conversation": conversation_context,
        "confirmed_fields": confirmed_str,
        "missing_fields": missing_str,
        "accumulated_summary": accumulated or "Primera interacción",
        "format_instructions": parser.get_format_instructions()
    })
    
    # Actualizar estado con preferencias extraídas
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

    # Parse date strings produced by the LLM → Python date objects
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

    update["needs_clarification"] = result.needs_clarification
    update["clarification_questions"] = result.clarification_questions
    
    return update


# ── Helpers ────────────────────────────────────────────────────────────────────

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
