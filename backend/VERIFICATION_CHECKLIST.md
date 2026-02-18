# Checklist de Verificación - Fase 2

## ✅ Pre-requisitos

- [ ] Python 3.9+ instalado
- [ ] pip actualizado (`pip install --upgrade pip`)
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] API Keys válidas (OpenAI, Google Places, Supabase)

## ✅ Instalación

- [ ] Entorno virtual creado (`python -m venv venv`)
- [ ] Entorno virtual activado
- [ ] Dependencias instaladas (`pip install -r requirements.txt`)
- [ ] Sin errores de instalación

## ✅ Configuración

### Variables de Entorno

- [ ] `OPENAI_API_KEY` configurada y válida
- [ ] `OPENAI_MODEL` configurado (gpt-4o)
- [ ] `GOOGLE_PLACES_API_KEY` configurada y válida
- [ ] `GOOGLE_MAPS_API_KEY` configurada
- [ ] `SUPABASE_URL` configurada
- [ ] `SUPABASE_KEY` configurada
- [ ] `SECRET_KEY` configurada

### APIs Externas

- [ ] OpenAI API funcionando (test con curl o Python)
- [ ] Google Places API habilitada en GCP
- [ ] Billing configurado en GCP
- [ ] Supabase proyecto creado y accesible

## ✅ Estructura de Archivos

### Agentes

- [ ] `app/agents/__init__.py` existe
- [ ] `app/agents/state.py` existe y define TravelState
- [ ] `app/agents/graph.py` existe y crea el grafo
- [ ] `app/agents/nodes/intent_classifier.py` existe
- [ ] `app/agents/nodes/preference_extractor.py` existe
- [ ] `app/agents/nodes/place_searcher.py` existe
- [ ] `app/agents/nodes/itinerary_builder.py` existe
- [ ] `app/agents/nodes/refinement_handler.py` existe
- [ ] `app/agents/tools/google_places.py` existe

### API

- [ ] `app/api/v1/endpoints/chat.py` actualizado
- [ ] `app/api/v1/schemas/chat.py` actualizado
- [ ] Endpoint `/api/v1/chat` implementado

### Tests

- [ ] `tests/test_agents.py` existe
- [ ] `tests/test_google_places.py` existe
- [ ] `pytest.ini` configurado
- [ ] `test_agent.py` script de prueba existe

### Documentación

- [ ] `README.md` actualizado
- [ ] `AGENTS_README.md` creado
- [ ] `USAGE_EXAMPLES.md` creado
- [ ] `PHASE2_STATUS.md` creado

## ✅ Tests Funcionales

### Test 1: Servidor Inicia

```bash
uvicorn app.main:app --reload
```

- [ ] Servidor inicia sin errores
- [ ] Accesible en `http://localhost:8000`
- [ ] `/health` responde correctamente
- [ ] `/docs` muestra Swagger UI

### Test 2: Agente Básico

```bash
python test_agent.py
```

- [ ] Script ejecuta sin errores
- [ ] Clasifica intención correctamente
- [ ] Extrae preferencias
- [ ] Busca lugares (si API key válida)
- [ ] Genera itinerario

### Test 3: Tests Unitarios

```bash
pytest tests/ -v
```

- [ ] Tests de intent_classifier pasan
- [ ] Tests de preference_extractor pasan
- [ ] Tests de google_places pasan (con mocks)
- [ ] Sin errores críticos

### Test 4: Endpoint de Chat

```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Quiero viajar a Cusco por 5 días"}'
```

- [ ] Endpoint responde (puede requerir auth)
- [ ] Retorna JSON válido
- [ ] Estructura de respuesta correcta

## ✅ Verificación de Funcionalidades

### Clasificación de Intenciones

- [ ] Detecta "new_trip" correctamente
- [ ] Detecta "refine" correctamente
- [ ] Detecta "question" correctamente
- [ ] Detecta "clarify" correctamente

### Extracción de Preferencias

- [ ] Extrae destino correctamente
- [ ] Extrae días correctamente
- [ ] Extrae presupuesto correctamente
- [ ] Extrae travel_style correctamente
- [ ] Identifica cuando falta información
- [ ] Genera preguntas de clarificación

### Búsqueda de Lugares

- [ ] Conecta con Google Places API
- [ ] Busca lugares por categoría
- [ ] Filtra resultados
- [ ] Rankea por relevancia
- [ ] Maneja errores de API

### Construcción de Itinerarios

- [ ] Genera itinerario completo
- [ ] Distribuye lugares por días
- [ ] Organiza por horarios (mañana/tarde/noche)
- [ ] Incluye consejos prácticos
- [ ] Formato de respuesta correcto

### Refinamiento

- [ ] Modifica itinerarios existentes
- [ ] Mantiene coherencia
- [ ] Explica cambios realizados

## ✅ Verificación de Seguridad

- [ ] Rate limiting funciona (10 req/min)
- [ ] Autenticación JWT implementada
- [ ] CORS configurado correctamente
- [ ] Secrets no expuestos en código
- [ ] `.env.local` en `.gitignore`

## ✅ Verificación de Calidad

### Código

- [ ] Sin errores de sintaxis
- [ ] Docstrings en funciones principales
- [ ] Type hints donde sea apropiado
- [ ] Manejo de errores implementado
- [ ] Logging configurado

### Documentación

- [ ] README claro y completo
- [ ] Ejemplos de uso incluidos
- [ ] Instrucciones de instalación claras
- [ ] Troubleshooting documentado

## ✅ Performance

- [ ] Respuesta del agente < 10 segundos
- [ ] Sin memory leaks evidentes
- [ ] Manejo de concurrencia básico

## ✅ Integración

- [ ] Compatible con frontend (CORS)
- [ ] Schemas de API documentados
- [ ] Endpoints RESTful
- [ ] Respuestas JSON consistentes

## 🚨 Problemas Comunes y Soluciones

### Problema: ModuleNotFoundError

**Solución:**
```bash
pip install -r requirements.txt
```

### Problema: OpenAI API Error

**Solución:**
- Verifica API key en `.env.local`
- Verifica créditos en cuenta OpenAI
- Revisa límites de rate

### Problema: Google Places API Error

**Solución:**
- Habilita Places API en GCP Console
- Configura billing
- Verifica API key

### Problema: Tests Fallan

**Solución:**
```bash
# Reinstalar dependencias
pip install -r requirements.txt --force-reinstall

# Limpiar cache
pytest --cache-clear

# Ejecutar con verbose
pytest tests/ -vv
```

## ✅ Checklist Final

- [ ] Todos los tests pasan
- [ ] Servidor inicia correctamente
- [ ] Endpoint de chat funciona
- [ ] Agente genera itinerarios
- [ ] Documentación completa
- [ ] Sin errores críticos
- [ ] Listo para Fase 3 (Frontend)

## 📝 Notas

- Si algún test falla, revisa los logs en detalle
- Asegúrate de tener conexión a internet para APIs externas
- Los tests con mocks no requieren API keys reales
- El script `test_agent.py` requiere API keys válidas

## ✅ Aprobación

- [ ] Fase 2 completada y verificada
- [ ] Lista para integración con frontend
- [ ] Documentación entregada
- [ ] Tests pasando

**Fecha de verificación:** _____________

**Verificado por:** _____________

**Notas adicionales:**
_____________________________________________
_____________________________________________
