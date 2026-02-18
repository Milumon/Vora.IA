"""
Script de prueba para el flujo conversacional del agente.
Simula una conversación completa con preguntas de validación progresivas.
"""
import asyncio
from app.agents.graph import create_travel_agent_graph
from datetime import datetime


async def test_conversational_flow():
    """Prueba el flujo conversacional completo."""
    
    print("=" * 80)
    print("PRUEBA DE FLUJO CONVERSACIONAL - AGENTE LAYLA")
    print("=" * 80)
    print()
    
    # Crear el grafo
    graph = create_travel_agent_graph()
    
    # Conversación de prueba
    conversation = [
        "Quiero viajar a Machu Picchu",
        "Queremos la ruta clásica hacia el sur",
        "Tenemos 7 días disponibles",
        "Nuestro presupuesto es de 1000 dólares para dos personas",
        "Queremos ir en avión de Lima a Cusco"
    ]
    
    # Estado inicial
    state = {
        "messages": [],
        "max_iterations": 10,
        "searched_places": [],
        "day_plans": [],
        "needs_clarification": False,
        "clarification_questions": [],
        "iteration_count": 0
    }
    
    # Simular conversación
    for i, user_message in enumerate(conversation, 1):
        print(f"\n{'─' * 80}")
        print(f"TURNO {i}")
        print(f"{'─' * 80}\n")
        
        print(f"👤 USUARIO: {user_message}")
        print()
        
        # Agregar mensaje del usuario al estado
        state["messages"].append({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Ejecutar el grafo
        try:
            result = await graph.ainvoke(state)
            
            # Actualizar estado con el resultado
            state = result
            
            # Extraer respuesta del asistente
            assistant_messages = [
                msg for msg in result.get("messages", [])
                if msg.get("role") == "assistant"
            ]
            
            if assistant_messages:
                last_response = assistant_messages[-1]["content"]
                print(f"🤖 LAYLA: {last_response}")
                print()
            
            # Mostrar información de estado
            print("📊 ESTADO ACTUAL:")
            print(f"   - Destino: {result.get('destination', 'No especificado')}")
            print(f"   - Días: {result.get('days', 'No especificado')}")
            print(f"   - Presupuesto: {result.get('budget', 'No especificado')}")
            print(f"   - Estilo: {result.get('travel_style', 'No especificado')}")
            print(f"   - Viajeros: {result.get('travelers', 'No especificado')}")
            print(f"   - Necesita clarificación: {result.get('needs_clarification', False)}")
            
            if result.get('clarification_questions'):
                print(f"\n❓ PREGUNTAS DE CLARIFICACIÓN:")
                for q in result['clarification_questions']:
                    print(f"   - {q}")
            
            if result.get('itinerary'):
                print(f"\n✅ ITINERARIO GENERADO!")
                print(f"   Título: {result['itinerary'].get('title', 'N/A')}")
                break
                
        except Exception as e:
            print(f"❌ ERROR: {e}")
            import traceback
            traceback.print_exc()
            break
    
    print(f"\n{'=' * 80}")
    print("FIN DE LA PRUEBA")
    print(f"{'=' * 80}\n")


async def test_single_message():
    """Prueba con un solo mensaje para verificar el flujo básico."""
    
    print("\n" + "=" * 80)
    print("PRUEBA DE MENSAJE ÚNICO")
    print("=" * 80 + "\n")
    
    graph = create_travel_agent_graph()
    
    state = {
        "messages": [{
            "role": "user",
            "content": "Quiero viajar a Cusco 5 días con presupuesto medio",
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
        result = await graph.ainvoke(state)
        
        print("👤 USUARIO: Quiero viajar a Cusco 5 días con presupuesto medio\n")
        
        assistant_messages = [
            msg for msg in result.get("messages", [])
            if msg.get("role") == "assistant"
        ]
        
        if assistant_messages:
            print(f"🤖 LAYLA: {assistant_messages[-1]['content']}\n")
        
        print("📊 INFORMACIÓN EXTRAÍDA:")
        print(f"   - Destino: {result.get('destination', 'No especificado')}")
        print(f"   - Días: {result.get('days', 'No especificado')}")
        print(f"   - Presupuesto: {result.get('budget', 'No especificado')}")
        print(f"   - Necesita clarificación: {result.get('needs_clarification', False)}")
        
        if result.get('clarification_questions'):
            print(f"\n❓ PREGUNTAS:")
            for q in result['clarification_questions']:
                print(f"   - {q}")
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("\n🚀 Iniciando pruebas del flujo conversacional...\n")
    
    # Ejecutar prueba de mensaje único
    asyncio.run(test_single_message())
    
    # Ejecutar prueba de conversación completa
    asyncio.run(test_conversational_flow())
    
    print("\n✅ Pruebas completadas!\n")
