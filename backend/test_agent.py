"""Script de prueba simple para el agente de viajes."""
import asyncio
from app.agents.graph import create_travel_agent_graph
from datetime import datetime


async def test_agent():
    """Prueba básica del agente."""
    
    print("🚀 Iniciando prueba del agente de viajes...\n")
    
    # Crear el grafo
    graph = create_travel_agent_graph()
    
    # Mensaje de prueba
    test_message = "Quiero viajar a Cusco por 5 días con presupuesto medio, me gusta la cultura y la aventura"
    
    print(f"📝 Mensaje de prueba: {test_message}\n")
    
    # Preparar entrada
    input_state = {
        "messages": [{
            "role": "user",
            "content": test_message,
            "timestamp": datetime.now().isoformat()
        }],
        "max_iterations": 10,
        "searched_places": [],
        "day_plans": [],
        "needs_clarification": False,
        "clarification_questions": [],
        "iteration_count": 0
    }
    
    try:
        # Ejecutar el grafo
        print("⚙️ Ejecutando grafo...\n")
        result = await graph.ainvoke(input_state)
        
        # Mostrar resultados
        print("✅ Resultado:\n")
        print(f"Intent: {result.get('intent')}")
        print(f"Destination: {result.get('destination')}")
        print(f"Days: {result.get('days')}")
        print(f"Budget: {result.get('budget')}")
        print(f"Travel Style: {result.get('travel_style')}")
        print(f"Needs Clarification: {result.get('needs_clarification')}")
        print(f"\nPlaces Found: {len(result.get('searched_places', []))}")
        
        # Mostrar respuesta del asistente
        assistant_messages = [
            msg for msg in result.get("messages", [])
            if msg.get("role") == "assistant"
        ]
        
        if assistant_messages:
            print(f"\n💬 Respuesta del asistente:\n")
            print(assistant_messages[-1]["content"][:500] + "...")
        
        # Mostrar itinerario si existe
        if result.get("itinerary"):
            itinerary = result["itinerary"]
            print(f"\n🗺️ Itinerario generado:")
            print(f"Title: {itinerary.get('title')}")
            print(f"Days: {len(itinerary.get('day_plans', []))}")
        
        print("\n✅ Prueba completada exitosamente!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_agent())
