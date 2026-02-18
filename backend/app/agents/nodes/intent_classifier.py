"""Nodo de clasificación de intención del usuario."""
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from app.agents.state import TravelState
from app.config.settings import get_settings

settings = get_settings()


async def classify_intent(state: TravelState) -> dict:
    """Clasifica la intención del último mensaje del usuario."""
    
    llm = ChatOpenAI(
        model=settings.OPENAI_MODEL,
        temperature=0,
        api_key=settings.OPENAI_API_KEY
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Eres un clasificador de intenciones para un agente de viajes especializado en Perú.

Analiza el último mensaje del usuario y clasifica su intención en una de estas categorías:
- new_trip: El usuario quiere planear un viaje nuevo desde cero
- refine: El usuario quiere ajustar/modificar un itinerario existente
- question: El usuario tiene una pregunta sobre destinos/viajes en Perú
- clarify: El usuario está respondiendo a una pregunta de clarificación

Responde SOLO con una palabra: new_trip, refine, question, o clarify

Ejemplos:
"Quiero viajar a Cusco" -> new_trip
"Cambia el día 2 por algo más relajado" -> refine
"¿Cuál es la mejor época para ir a Machu Picchu?" -> question
"Somos 4 personas" -> clarify
"""),
        ("user", "{message}")
    ])
    
    last_message = state["messages"][-1]["content"]
    
    chain = prompt | llm
    result = await chain.ainvoke({"message": last_message})
    
    intent = result.content.strip().lower()
    
    # Validar que sea una intención válida
    valid_intents = ["new_trip", "refine", "question", "clarify"]
    if intent not in valid_intents:
        intent = "new_trip"  # Default
    
    return {
        "intent": intent,
        "iteration_count": state.get("iteration_count", 0) + 1
    }
