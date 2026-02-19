"""Nodo para manejar respuestas conversacionales con validación progresiva."""
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from app.agents.state import TravelState
from app.config.settings import get_settings

settings = get_settings()


async def generate_response(state: TravelState) -> dict:
    """Genera una respuesta conversacional basada en el estado actual."""
    
    llm = ChatOpenAI(
        model=settings.OPENAI_MODEL,
        temperature=0.7,
        api_key=settings.OPENAI_API_KEY
    )
    
    destination = state.get("destination")
    days = state.get("days")
    budget = state.get("budget")
    travel_style = state.get("travel_style")
    travelers = state.get("travelers")
    needs_clarification = state.get("needs_clarification", False)
    clarification_questions = state.get("clarification_questions", [])
    accumulated = state.get("accumulated_summary", "")
    
    messages = state.get("messages", [])
    conversation_context = "\n".join([
        f"{msg['role']}: {msg['content']}" 
        for msg in messages[-15:]
    ])
    
    # Detectar si el usuario se queja de repetición
    last_user_msg = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            last_user_msg = msg["content"].lower()
            break
    
    user_frustrated = any(phrase in last_user_msg for phrase in [
        "ya te dije", "ya lo dije", "te lo dije", "repet", "otra vez",
        "ya mencion", "ya te lo", "constantmente", "de nuevo"
    ])
    
    frustration_instruction = ""
    if user_frustrated:
        frustration_instruction = """
⚠️ EL USUARIO ESTÁ FRUSTRADO PORQUE SIENTE QUE REPITES PREGUNTAS.
- Discúlpate BREVEMENTE (1 línea máximo)
- Confirma la información que ya tienes
- Avanza directamente con lo que FALTA, sin repetir nada
- NO uses frases como "tienes razón, ya lo mencionaste" de forma genérica
"""
    
    if needs_clarification and clarification_questions:
        prompt = ChatPromptTemplate.from_messages([
            ("system", """Eres Vora, una experta en viajes por Perú con personalidad amigable y entusiasta.

=== ESTADO ACUMULADO (lo que YA SABES, NO repitas estas preguntas) ===
{accumulated_summary}

=== INFORMACIÓN CONFIRMADA ===
- Destino: {destination}
- Días: {days}
- Presupuesto: {budget}
- Estilo: {travel_style}
- Viajeros: {travelers}

{frustration_instruction}

ESTILO DE COMUNICACIÓN:
- Sé cálida y entusiasta (usa emojis ocasionalmente)
- NUNCA preguntes algo que ya está en "INFORMACIÓN CONFIRMADA"
- Haz UNA pregunta a la vez sobre lo que FALTA
- Mantén respuestas CORTAS (máximo 3-4 líneas)
- Reconoce lo que el usuario acaba de decir

PREGUNTAS PENDIENTES (solo las que NO están ya respondidas):
{questions}

Conversación previa:
{conversation}
"""),
            ("user", "Genera la respuesta. Recuerda: NO repitas preguntas ya respondidas.")
        ])
        
        chain = prompt | llm
        
        result = await chain.ainvoke({
            "destination": destination or "No especificado aún",
            "days": days or "No especificado aún",
            "budget": budget or "No especificado aún",
            "travel_style": travel_style or "No especificado aún",
            "travelers": travelers or "No especificado aún",
            "accumulated_summary": accumulated or "Sin información previa",
            "frustration_instruction": frustration_instruction,
            "questions": "\n".join(f"- {q}" for q in clarification_questions),
            "conversation": conversation_context
        })
        
        response_message = result.content
    
    else:
        prompt = ChatPromptTemplate.from_messages([
            ("system", """Eres Vora, una experta en viajes por Perú.

El usuario ha proporcionado toda la información necesaria. Genera un resumen BREVE y entusiasta 
y pide confirmación final antes de generar el itinerario.

INFORMACIÓN DEL VIAJE:
- Destino: {destination}
- Días: {days}
- Presupuesto: {budget}
- Estilo: {travel_style}
- Viajeros: {travelers}

Genera una respuesta que:
1. Resuma la información de forma compacta (máximo 3 líneas)
2. Pida confirmación para generar el itinerario
3. Muestre entusiasmo

IMPORTANTE: Máximo 4 líneas de respuesta total.
"""),
            ("user", "Genera el resumen y confirmación.")
        ])
        
        chain = prompt | llm
        
        result = await chain.ainvoke({
            "destination": destination,
            "days": days,
            "budget": budget,
            "travel_style": travel_style or "Variado",
            "travelers": travelers or "No especificado"
        })
        
        response_message = result.content
    
    return {
        "messages": [{
            "role": "assistant",
            "content": response_message,
            "timestamp": ""
        }]
    }
