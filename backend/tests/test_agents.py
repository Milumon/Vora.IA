"""Tests para los nodos del agente."""
import pytest
from datetime import datetime
from app.agents.nodes.intent_classifier import classify_intent
from app.agents.nodes.preference_extractor import extract_preferences


@pytest.mark.asyncio
async def test_classify_intent_new_trip():
    """Test clasificación de intención para viaje nuevo."""
    state = {
        "messages": [{
            "role": "user",
            "content": "Quiero viajar a Cusco",
            "timestamp": datetime.now().isoformat()
        }],
        "iteration_count": 0
    }
    
    result = await classify_intent(state)
    
    assert result["intent"] in ["new_trip", "question", "clarify"]
    assert result["iteration_count"] == 1


@pytest.mark.asyncio
async def test_classify_intent_refinement():
    """Test clasificación de intención para refinamiento."""
    state = {
        "messages": [{
            "role": "user",
            "content": "Cambia el día 2 por algo más relajado",
            "timestamp": datetime.now().isoformat()
        }],
        "iteration_count": 0
    }
    
    result = await classify_intent(state)
    
    assert result["intent"] in ["refine", "clarify"]


@pytest.mark.asyncio
async def test_extract_preferences_complete():
    """Test extracción de preferencias con información completa."""
    state = {
        "messages": [{
            "role": "user",
            "content": "Quiero viajar a Cusco por 5 días con presupuesto medio",
            "timestamp": datetime.now().isoformat()
        }]
    }
    
    result = await extract_preferences(state)
    
    assert result.get("destination") is not None
    assert result.get("days") is not None
    assert result.get("budget") is not None


@pytest.mark.asyncio
async def test_extract_preferences_incomplete():
    """Test extracción de preferencias con información incompleta."""
    state = {
        "messages": [{
            "role": "user",
            "content": "Quiero viajar",
            "timestamp": datetime.now().isoformat()
        }]
    }
    
    result = await extract_preferences(state)
    
    # Debería necesitar clarificación
    assert result.get("needs_clarification") == True
    assert len(result.get("clarification_questions", [])) > 0
