# Solución: Error OUTPUT_PARSING_FAILURE en LangChain

## Problema

El error `OUTPUT_PARSING_FAILURE` ocurría cuando el LLM (OpenAI) no generaba una salida en el formato JSON esperado por `PydanticOutputParser`. Este error se manifestaba en los logs como:

```
For troubleshooting, visit: https://docs.langchain.com/oss/python/langchain/errors/OUTPUT_PARSING_FAILURE
```

## Causa Raíz

`PydanticOutputParser` es frágil y falla cuando:
- El LLM genera texto adicional antes/después del JSON
- El JSON tiene formato incorrecto (comas faltantes, comillas mal cerradas)
- El LLM no sigue exactamente las instrucciones de formato

## Solución Implementada

### 1. Migración a `with_structured_output`

Reemplazamos `PydanticOutputParser` con el método más robusto `with_structured_output` de LangChain:

**Antes:**
```python
parser = PydanticOutputParser(pydantic_object=ExtractedPreferences)
chain = prompt | llm | parser
result = await chain.ainvoke({...})
```

**Después:**
```python
structured_llm = llm.with_structured_output(ExtractedPreferences)
chain = prompt | structured_llm
result = await chain.ainvoke({...})
```

### 2. Manejo Robusto de Errores

Agregamos bloques try-except con fallbacks inteligentes en todos los nodos que usan LLMs:

#### `preference_extractor.py`
```python
try:
    result = await chain.ainvoke({...})
except Exception as e:
    logger.error(f"OUTPUT_PARSING_FAILURE in preference_extractor: {e}", exc_info=True)
    # Fallback: usar estado actual
    result = ExtractedPreferences(
        destination=current.get("destination"),
        days=current.get("days"),
        needs_clarification=not (current.get("destination") and current.get("days")),
        clarification_questions=_generate_missing_questions(current, {})
    )
```

#### `refinement_delta.py`
```python
try:
    delta = await chain.ainvoke({...})
except Exception as e:
    logger.error(f"OUTPUT_PARSING_FAILURE in refinement_delta: {e}", exc_info=True)
    # Fallback: metadata_only scope
    return {
        "refinement_scope": "metadata_only",
        "previous_itinerary": state.get("itinerary"),
    }
```

#### `intent_classifier.py`
```python
try:
    result = await chain.ainvoke({...})
    intent = result.content.strip().lower()
except Exception as e:
    logger.error(f"Error in intent_classifier: {e}", exc_info=True)
    # Fallback: heurística basada en estado
    intent = "clarify" if (has_destination or has_days) else "new_trip"
```

### 3. Mejoras en Prompts

Simplificamos los prompts para reducir la probabilidad de errores:
- Eliminamos `{format_instructions}` (ya no necesario con `with_structured_output`)
- Instrucciones más claras y concisas
- Enfoque en la estructura del modelo Pydantic

## Archivos Modificados

1. `backend/app/agents/nodes/preference_extractor.py`
   - Migrado a `with_structured_output`
   - Agregado manejo de errores con fallback

2. `backend/app/agents/nodes/refinement_delta.py`
   - Migrado a `with_structured_output`
   - Agregado manejo de errores con fallback

3. `backend/app/agents/nodes/intent_classifier.py`
   - Agregado manejo de errores con fallback heurístico

## Beneficios

✅ **Mayor robustez**: El sistema continúa funcionando incluso si el LLM falla
✅ **Mejor logging**: Errores detallados con stack traces completos
✅ **Fallbacks inteligentes**: Usa el estado previo en lugar de fallar completamente
✅ **Menos errores**: `with_structured_output` es más tolerante a variaciones en la salida del LLM

## Testing

Para verificar la solución:

```bash
cd backend
python test_conversational_flow.py
```

O probar manualmente en el chat enviando mensajes que anteriormente causaban el error.

## Referencias

- [LangChain Structured Output](https://python.langchain.com/docs/how_to/structured_output/)
- [Error Handling Best Practices](https://docs.langchain.com/docs/guides/debugging)
