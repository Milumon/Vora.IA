"""
Script de prueba para verificar el manejo robusto de errores de parsing.
"""
import asyncio
from app.agents.nodes.preference_extractor import extract_preferences
from app.agents.nodes.refinement_delta import extract_refinement_delta
from app.agents.nodes.intent_classifier import classify_intent


async def test_preference_extractor_with_valid_input():
    """Prueba con entrada válida."""
    print("\n=== Test 1: preference_extractor con entrada válida ===")
    state = {
        "messages": [
            {"role": "user", "content": "Quiero viajar a Cusco por 5 días"}
        ]
    }
    
    try:
        result = await extract_preferences(state)
        print(f"✅ Resultado: destination={result.get('destination')}, days={result.get('days')}")
        print(f"   needs_clarification={result.get('needs_clarification')}")
    except Exception as e:
        print(f"❌ Error: {e}")


async def test_preference_extractor_with_partial_info():
    """Prueba con información parcial."""
    print("\n=== Test 2: preference_extractor con info parcial ===")
    state = {
        "messages": [
            {"role": "user", "content": "Quiero ir a Arequipa"}
        ]
    }
    
    try:
        result = await extract_preferences(state)
        print(f"✅ Resultado: destination={result.get('destination')}, days={result.get('days')}")
        print(f"   needs_clarification={result.get('needs_clarification')}")
        print(f"   questions={result.get('clarification_questions')}")
    except Exception as e:
        print(f"❌ Error: {e}")


async def test_intent_classifier():
    """Prueba el clasificador de intención."""
    print("\n=== Test 3: intent_classifier ===")
    state = {
        "messages": [
            {"role": "user", "content": "Hola, quiero planear un viaje"}
        ]
    }
    
    try:
        result = await classify_intent(state)
        print(f"✅ Intent clasificado: {result.get('intent')}")
    except Exception as e:
        print(f"❌ Error: {e}")


async def test_refinement_delta():
    """Prueba el extractor de refinamiento."""
    print("\n=== Test 4: refinement_delta ===")
    state = {
        "messages": [
            {"role": "user", "content": "Quiero cambiar el viaje a 7 días"}
        ],
        "destination": "Cusco",
        "days": 5,
        "itinerary": {
            "title": "Viaje a Cusco",
            "day_plans": [{"day_number": 1}, {"day_number": 2}]
        }
    }
    
    try:
        result = await extract_refinement_delta(state)
        print(f"✅ Refinement scope: {result.get('refinement_scope')}")
        print(f"   Días actualizados: {result.get('days')}")
    except Exception as e:
        print(f"❌ Error: {e}")


async def test_with_existing_state():
    """Prueba con estado existente (conversación en curso)."""
    print("\n=== Test 5: preference_extractor con estado previo ===")
    state = {
        "messages": [
            {"role": "user", "content": "Quiero viajar a Lima"},
            {"role": "assistant", "content": "¿Cuántos días?"},
            {"role": "user", "content": "3 días"}
        ],
        "destination": "Lima"
    }
    
    try:
        result = await extract_preferences(state)
        print(f"✅ Resultado: destination={result.get('destination')}, days={result.get('days')}")
        print(f"   needs_clarification={result.get('needs_clarification')}")
    except Exception as e:
        print(f"❌ Error: {e}")


async def main():
    """Ejecuta todas las pruebas."""
    print("=" * 70)
    print("PRUEBAS DE MANEJO ROBUSTO DE ERRORES DE PARSING")
    print("=" * 70)
    
    await test_preference_extractor_with_valid_input()
    await test_preference_extractor_with_partial_info()
    await test_intent_classifier()
    await test_refinement_delta()
    await test_with_existing_state()
    
    print("\n" + "=" * 70)
    print("TODAS LAS PRUEBAS COMPLETADAS")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
