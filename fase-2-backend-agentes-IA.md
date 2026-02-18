## Fase 2: Backend y Agentes IA (Semana 3-5)

### 2.1 Implementación de Agentes con LangGraph

**Día 13-15: Definición de Estado y Nodos Base**

- [ ] Definir `TravelState` TypedDict con todos los campos necesarios
- [ ] Implementar nodo de clasificación de intención
- [ ] Implementar nodo de extracción de preferencias
- [ ] Crear prompts estructurados para cada nodo
- [ ] Setup de LangGraph checkpointer con PostgreSQL
- [ ] Implementar persistencia de estado en Supabase

**Definición del estado:**
```python
# app/agents/state.py
from typing import TypedDict, Annotated, Literal, List, Dict, Optional
import operator
from datetime import date

class Message(TypedDict):
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: str

class PlaceInfo(TypedDict):
    place_id: str
    name: str
    address: str
    rating: Optional[float]
    price_level: Optional[int]
    types: List[str]
    photos: List[str]
    location: Dict[str, float]  # {lat, lng}

class DayPlan(TypedDict):
    day_number: int
    date: Optional[str]
    morning: List[PlaceInfo]
    afternoon: List[PlaceInfo]
    evening: List[PlaceInfo]
    notes: str

class TravelState(TypedDict):
    # Conversación
    messages: Annotated[List[Message], operator.add]
    
    # Intención actual
    intent: Literal["new_trip", "refine", "question", "clarify"]
    
    # Preferencias del usuario
    destination: Optional[str]
    destinations: Optional[List[str]]  # Para multi-ciudad
    start_date: Optional[date]
    end_date: Optional[date]
    days: Optional[int]
    budget: Optional[Literal["low", "medium", "high"]]
    travel_style: Optional[List[str]]  # ["cultural", "adventure", "relaxed", etc.]
    travelers: Optional[int]
    
    # Datos de lugares
    searched_places: List[PlaceInfo]
    
    # Itinerario generado
    itinerary: Optional[Dict]  # Estructura completa del itinerario
    day_plans: List[DayPlan]
    
    # Control de flujo
    needs_clarification: bool
    clarification_questions: List[str]
    iteration_count: int
    max_iterations: int
```

**Nodo de clasificación de intención:**
```python
# app/agents/nodes/intent_classifier.py
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from app.agents.state import TravelState

async def classify_intent(state: TravelState) -> TravelState:
    """Clasifica la intención del último mensaje del usuario"""
    
    llm = ChatOpenAI(model="gpt-4o", temperature=0)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Eres un clasificador de intenciones para un agente de viajes.
        
Analiza el último mensaje del usuario y clasifica su intención en una de estas categorías:
- new_trip: El usuario quiere planear un viaje nuevo
- refine: El usuario quiere ajustar/modificar un itinerario existente
- question: El usuario tiene una pregunta sobre destinos/viajes
- clarify: El usuario está respondiendo a una pregunta de clarificación

Responde SOLO con una palabra: new_trip, refine, question, o clarify"""),
        ("user", "{message}")
    ])
    
    last_message = state["messages"][-1]["content"]
    
    chain = prompt | llm
    result = await chain.ainvoke({"message": last_message})
    
    intent = result.content.strip().lower()
    
    return {
        **state,
        "intent": intent,
        "iteration_count": state.get("iteration_count", 0) + 1
    }
```

**Día 16-18: Implementación de Búsqueda de Lugares**

- [ ] Crear herramienta de búsqueda de Google Places
- [ ] Implementar nodo que llama a Google Places API
- [ ] Agregar caché de resultados de búsqueda
- [ ] Implementar filtrado y ranking de resultados
- [ ] Manejar errores y rate limits de la API

```python
# app/agents/nodes/place_searcher.py
from typing import List
from app.agents.state import TravelState, PlaceInfo
from app.agents.tools.google_places import GooglePlacesClient

async def search_places(state: TravelState) -> TravelState:
    """Busca lugares relevantes según las preferencias del usuario"""
    
    if not state.get("destination"):
        return state
    
    places_client = GooglePlacesClient()
    
    # Definir categorías según travel_style
    search_queries = _build_search_queries(
        state.get("travel_style", []),
        state.get("budget", "medium")
    )
    
    all_places: List[PlaceInfo] = []
    
    for query in search_queries:
        try:
            results = await places_client.search_nearby(
                location=state["destination"],
                query=query,
                max_results=5
            )
            all_places.extend(_parse_places(results))
        except Exception as e:
            # Log error pero continúa con otras búsquedas
            print(f"Error searching {query}: {e}")
            continue
    
    # Eliminar duplicados y rankear
    unique_places = _deduplicate_places(all_places)
    ranked_places = _rank_places(unique_places, state)
    
    return {
        **state,
        "searched_places": ranked_places[:30]  # Top 30
    }

def _build_search_queries(travel_style: List[str], budget: str) -> List[str]:
    """Construye queries de búsqueda según preferencias"""
    queries = []
    
    base_queries = {
        "cultural": ["museos", "sitios históricos", "galerías de arte"],
        "adventure": ["trekking", "actividades al aire libre", "deportes extremos"],
        "relaxed": ["spas", "cafés", "parques", "miradores"],
        "gastronomy": ["restaurantes típicos", "mercados gastronómicos", "tours culinarios"],
        "nightlife": ["bares", "discotecas", "vida nocturna"]
    }
    
    for style in travel_style:
        if style in base_queries:
            queries.extend(base_queries[style])
    
    # Siempre agregar básicos
    queries.extend(["atracciones turísticas", "lugares imprescindibles"])
    
    return queries
```

**Día 19-21: Constructor de Itinerarios**

- [ ] Implementar nodo que construye itinerario completo
- [ ] Crear prompts para generación de itinerarios día a día
- [ ] Implementar validación de itinerarios
- [ ] Agregar optimización de rutas (orden lógico de visitas)
- [ ] Calcular tiempos de desplazamiento entre lugares

```python
# app/agents/nodes/itinerary_builder.py
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List
from app.agents.state import TravelState, DayPlan

class ItineraryOutput(BaseModel):
    title: str = Field(description="Título atractivo del itinerario")
    description: str = Field(description="Descripción general del viaje")
    day_plans: List[DayPlan] = Field(description="Plan para cada día")
    tips: List[str] = Field(description="Consejos generales para el viaje")

async def build_itinerary(state: TravelState) -> TravelState:
    """Construye un itinerario completo usando GPT-4o"""
    
    llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
    parser = PydanticOutputParser(pydantic_object=ItineraryOutput)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Eres un experto planificador de viajes especializado en Perú.

Crea un itinerario detallado día a día considerando:
- Destino: {destination}
- Días: {days}
- Presupuesto: {budget}
- Estilo de viaje: {travel_style}
- Número de viajeros: {travelers}

LUGARES DISPONIBLES:
{places_json}

INSTRUCCIONES:
1. Distribuye los lugares lógicamente por días
2. Agrupa lugares cercanos en el mismo día
3. Balancea actividades: no sobrecargues días
4. Considera horarios (museos cierran temprano, vida nocturna empieza tarde, etc.)
5. Incluye tiempo para comidas y descanso
6. Sugiere restaurantes típicos para cada día
7. Añade consejos prácticos (qué llevar, cómo moverse, etc.)

{format_instructions}
"""),
        ("user", "Crea el mejor itinerario posible con esta información.")
    ])
    
    places_json = _format_places_for_llm(state["searched_places"])
    
    chain = prompt | llm | parser
    
    result = await chain.ainvoke({
        "destination": state["destination"],
        "days": state["days"],
        "budget": state.get("budget", "medium"),
        "travel_style": ", ".join(state.get("travel_style", ["variado"])),
        "travelers": state.get("travelers", 1),
        "places_json": places_json,
        "format_instructions": parser.get_format_instructions()
    })
    
    # Enriquecer con datos de rutas
    enriched_day_plans = await _add_route_info(result.day_plans)
    
    itinerary = {
        "title": result.title,
        "description": result.description,
        "day_plans": enriched_day_plans,
        "tips": result.tips,
        "metadata": {
            "destination": state["destination"],
            "days": state["days"],
            "budget": state["budget"],
            "travel_style": state["travel_style"]
        }
    }
    
    return {
        **state,
        "itinerary": itinerary,
        "day_plans": enriched_day_plans
    }
```

### 2.2 Construcción del Grafo Principal

**Día 22-24: Ensamblaje de LangGraph**

- [ ] Crear grafo principal con todos los nodos
- [ ] Definir edges condicionales entre nodos
- [ ] Implementar lógica de ciclos y refinamiento
- [ ] Agregar manejo de errores y fallbacks
- [ ] Testear flujos completos end-to-end

```python
# app/agents/graph.py
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres import PostgresSaver
from app.agents.state import TravelState
from app.agents.nodes.intent_classifier import classify_intent
from app.agents.nodes.preference_extractor import extract_preferences
from app.agents.nodes.place_searcher import search_places
from app.agents.nodes.itinerary_builder import build_itinerary
from app.agents.nodes.refinement_handler import handle_refinement

def create_travel_agent_graph(checkpointer):
    """Crea el grafo principal del agente de viajes"""
    
    workflow = StateGraph(TravelState)
    
    # Agregar nodos
    workflow.add_node("classify_intent", classify_intent)
    workflow.add_node("extract_preferences", extract_preferences)
    workflow.add_node("search_places", search_places)
    workflow.add_node("build_itinerary", build_itinerary)
    workflow.add_node("handle_refinement", handle_refinement)
    
    # Definir flujo
    workflow.set_entry_point("classify_intent")
    
    # Edges condicionales basados en intent
    workflow.add_conditional_edges(
        "classify_intent",
        route_by_intent,
        {
            "new_trip": "extract_preferences",
            "refine": "handle_refinement",
            "question": "build_itinerary",  # Responde con conocimiento
            "clarify": "extract_preferences"
        }
    )
    
    workflow.add_edge("extract_preferences", "search_places")
    workflow.add_edge("search_places", "build_itinerary")
    workflow.add_edge("build_itinerary", END)
    workflow.add_edge("handle_refinement", "build_itinerary")
    
    # Compilar con checkpointer para persistencia
    return workflow.compile(checkpointer=checkpointer)

def route_by_intent(state: TravelState) -> str:
    """Rutea según la intención clasificada"""
    intent = state.get("intent", "new_trip")
    
    # Validar si necesita clarificación
    if state.get("needs_clarification", False):
        return "clarify"
    
    # Límite de iteraciones para evitar loops infinitos
    if state.get("iteration_count", 0) > state.get("max_iterations", 10):
        return "new_trip"  # Reinicia
    
    return intent
```

### 2.3 API Endpoints

**Día 25-27: Implementación de Endpoints REST**

- [ ] Implementar endpoint POST /chat
- [ ] Implementar CRUD para itinerarios
- [ ] Agregar endpoint de búsqueda de lugares
- [ ] Implementar autenticación JWT con Supabase
- [ ] Agregar validación de requests con Pydantic
- [ ] Documentar endpoints con OpenAPI

```python
# app/api/v1/endpoints/chat.py
from fastapi import APIRouter, Depends, HTTPException, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.api.v1.schemas.chat import ChatRequest, ChatResponse
from app.agents.graph import create_travel_agent_graph
from app.services.supabase_client import get_supabase_client
from app.core.dependencies import get_current_user
from langgraph.checkpoint.postgres import PostgresSaver

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat_with_agent(
    request: ChatRequest,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """
    Envía un mensaje al agente de viajes y recibe una respuesta.
    
    El agente mantiene el contexto de la conversación usando thread_id.
    """
    try:
        # Crear checkpointer para persistencia
        checkpointer = PostgresSaver.from_conn_string(
            conn_string=settings.DATABASE_URL
        )
        
        # Crear o recuperar el grafo
        graph = create_travel_agent_graph(checkpointer)
        
        # Configuración del thread
        config = {
            "configurable": {
                "thread_id": request.thread_id or str(uuid.uuid4()),
                "user_id": current_user.id
            }
        }
        
        # Preparar entrada
        input_state = {
            "messages": [{
                "role": "user",
                "content": request.message,
                "timestamp": datetime.now().isoformat()
            }],
            "max_iterations": 10
        }
        
        # Ejecutar el grafo
        result = await graph.ainvoke(input_state, config=config)
        
        # Guardar conversación en Supabase si es nuevo itinerario
        if result.get("itinerary") and request.save_conversation:
            await _save_conversation(
                supabase,
                current_user.id,
                result,
                config["configurable"]["thread_id"]
            )
        
        return ChatResponse(
            message=result["messages"][-1]["content"],
            itinerary=result.get("itinerary"),
            thread_id=config["configurable"]["thread_id"],
            needs_clarification=result.get("needs_clarification", False),
            clarification_questions=result.get("clarification_questions", [])
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error procesando mensaje: {str(e)}"
        )
```

**Día 28-30: Testing del Backend**

- [ ] Tests unitarios de nodos individuales
- [ ] Tests de integración del grafo completo
- [ ] Tests de endpoints API
- [ ] Tests de autenticación y autorización
- [ ] Mocking de APIs externas (Google, OpenAI)
- [ ] Coverage mínimo del 70%

**Deliverables de Fase 2:**
- ✅ Agentes LangGraph funcionando end-to-end
- ✅ API REST completa y documentada
- ✅ Integración con Google Places API
- ✅ Persistencia de estado en Supabase
- ✅ Tests con buena cobertura
- ✅ Documentación técnica de agentes

---