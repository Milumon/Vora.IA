"""Nodo de extracción de preferencias del usuario."""
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
from app.agents.state import TravelState
from app.config.settings import get_settings

settings = get_settings()


class ExtractedPreferences(BaseModel):
    """Preferencias extraídas del mensaje del usuario."""
    destination: Optional[str] = Field(None, description="Ciudad o región de Perú mencionada")
    destinations: Optional[List[str]] = Field(None, description="Lista de ciudades para viaje multi-destino")
    days: Optional[int] = Field(None, description="Número de días del viaje")
    budget: Optional[Literal["low", "medium", "high"]] = Field(None, description="Nivel de presupuesto")
    travel_style: Optional[List[str]] = Field(None, description="Estilos de viaje: cultural, adventure, relaxed, gastronomy, nightlife")
    travelers: Optional[int] = Field(None, description="Número de viajeros")
    needs_clarification: bool = Field(False, description="Si se necesita más información")
    clarification_questions: List[str] = Field(default_factory=list, description="Preguntas para el usuario")


async def extract_preferences(state: TravelState) -> dict:
    """Extrae preferencias de viaje del mensaje del usuario."""
    
    llm = ChatOpenAI(
        model=settings.OPENAI_MODEL,
        temperature=0,
        api_key=settings.OPENAI_API_KEY
    )
    
    parser = PydanticOutputParser(pydantic_object=ExtractedPreferences)
    
    # Contexto de mensajes previos
    conversation_context = "\n".join([
        f"{msg['role']}: {msg['content']}" 
        for msg in state.get("messages", [])[-5:]  # Últimos 5 mensajes
    ])
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Eres un experto en extraer información de viajes para Perú.

Analiza la conversación y extrae las preferencias del usuario. Si falta información crítica, 
marca needs_clarification=True y genera preguntas específicas.

INFORMACIÓN CRÍTICA NECESARIA:
1. Destino (ciudad/región de Perú)
2. Duración del viaje (días)
3. Presupuesto aproximado (low/medium/high)

INFORMACIÓN OPCIONAL:
- Estilo de viaje (cultural, adventure, relaxed, gastronomy, nightlife)
- Número de viajeros
- Fechas específicas

DESTINOS VÁLIDOS EN PERÚ:
- Lima, Cusco, Arequipa, Puno, Iquitos, Trujillo, Chiclayo, Piura, Paracas, Nazca, Huaraz, Ayacucho, Cajamarca, Tarapoto, Puerto Maldonado

{format_instructions}

Conversación:
{conversation}
"""),
        ("user", "Extrae las preferencias de esta conversación.")
    ])
    
    chain = prompt | llm | parser
    
    result = await chain.ainvoke({
        "conversation": conversation_context,
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
    
    update["needs_clarification"] = result.needs_clarification
    update["clarification_questions"] = result.clarification_questions
    
    return update
