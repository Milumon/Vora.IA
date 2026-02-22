# Implementación de Campos Obligatorios: Fechas y Presupuesto

## Problema Identificado

El agente generaba itinerarios sin solicitar información crítica como fechas de viaje y presupuesto total, lo que resultaba en itinerarios incompletos o poco precisos.

**Ejemplo del problema:**
```
Usuario: "Quiero que me ayudes a generar un itinerario para viajar a Cusco con mi novia, 
         quiero que sea un plan mochilero de 4 días"
         
Agente: [Genera itinerario sin preguntar fechas ni presupuesto]
```

## Solución Implementada

Se modificó el sistema de validación del agente para hacer obligatorios los siguientes campos antes de generar un itinerario:

### Campos Obligatorios (REQUIRED_FIELDS)
1. **destination**: Ciudad o región de destino
2. **days**: Duración del viaje en días
3. **dates**: Fechas del viaje (start_date O end_date, al menos una)
4. **budget_total**: Presupuesto total del viaje en número

### Campos Opcionales (OPTIONAL_FIELDS)
- **budget**: Nivel de presupuesto (low/medium/high)
- **travel_style**: Estilo de viaje (cultural, adventure, etc.)
- **travelers**: Número de viajeros

## Archivos Modificados

### 1. backend/app/agents/nodes/preference_extractor.py

#### Cambios en REQUIRED_FIELDS:
```python
# ANTES
REQUIRED_FIELDS = {"destination", "days"}

# AHORA
REQUIRED_FIELDS = {"destination", "days", "dates", "budget_total"}
```

#### Validación Mejorada:
```python
# Validar TODOS los campos obligatorios
final_destination = update.get("destination") or current["destination"]
final_days = update.get("days") or current["days"]
final_start_date = update.get("start_date") or current.get("start_date")
final_end_date = update.get("end_date") or current.get("end_date")
final_budget_total = update.get("budget_total") or current.get("budget_total")

has_dates = bool(final_start_date or final_end_date)
has_budget = bool(final_budget_total)

# Solo proceder si TODOS los campos obligatorios están presentes
if final_destination and final_days and has_dates and has_budget:
    update["needs_clarification"] = False
    # Proceder a generar itinerario
else:
    update["needs_clarification"] = True
    # Solicitar información faltante
```

#### Prompt del LLM Actualizado:
```
Para proceder a generar el itinerario, TODOS estos campos son OBLIGATORIOS:
1. DESTINO (ciudad o región de Perú)
2. DÍAS (duración del viaje)
3. FECHAS (al menos start_date O end_date)
4. PRESUPUESTO TOTAL (budget_total en número)
```

#### Generación de Preguntas:
```python
def _generate_missing_questions(...):
    questions = []
    if not final_destination:
        questions.append("¿A qué ciudad o región de Perú te gustaría viajar?")
    if not final_days:
        questions.append("¿Cuántos días durará tu viaje?")
    if not has_dates:
        questions.append("¿Cuándo planeas viajar? (fecha de inicio y/o fin)")
    if not has_budget:
        questions.append("¿Cuál es tu presupuesto total para el viaje?")
    return questions
```

#### Snapshot de Campos:
```python
def _build_field_snapshot(current: dict):
    # Fechas (al menos una debe estar presente)
    if current["start_date"] or current["end_date"]:
        if current["start_date"]:
            confirmed.append(f"✅ Fecha inicio: {current['start_date']}")
        if current["end_date"]:
            confirmed.append(f"✅ Fecha fin: {current['end_date']}")
    else:
        missing_required.append("❌ Fechas: NO definidas (OBLIGATORIO)")

    # Presupuesto total
    if current.get("budget_total"):
        confirmed.append(f"✅ Presupuesto total: {current['budget_total']}")
    else:
        missing_required.append("❌ Presupuesto total: NO definido (OBLIGATORIO)")
```

### 2. backend/app/agents/nodes/conversation_manager.py

#### Keywords Actualizados:
```python
_FIELD_KEYWORDS: dict[str, list[str]] = {
    # ... otros campos ...
    "budget_total": [
        "presupuesto total", "presupuesto", "budget", 
        "cuánto", "cuanto", "dinero", "soles", "dólares", "dolares"
    ],
    "start_date": [
        "fecha", "cuándo", "cuando", "salida", 
        "partida", "inicio", "fecha de inicio"
    ],
    "end_date": [
        "regreso", "vuelta", "fin del viaje", 
        "fecha de fin", "fecha final"
    ],
}
```

#### Filtrado de Preguntas:
Ahora incluye `budget_total` en la validación para evitar preguntar sobre presupuesto si ya fue proporcionado.

#### Respuestas de Clarificación:
```python
async def _generate_clarification_response(...):
    # Incluye budget_total en la información confirmada
    - Presupuesto total: {budget_total}
    - Nivel de presupuesto: {budget}
    
    # Reglas actualizadas
    - Si presupuesto total está confirmado, NO preguntes cuánto quiere gastar
```

#### Respuestas de Confirmación:
```python
async def _generate_confirmation_response(...):
    # Incluye todos los campos obligatorios en el resumen
    - Destino: {destination}
    - Días: {days}
    - Fecha inicio: {start_date}
    - Fecha fin: {end_date}
    - Presupuesto total: {budget_total}
```

## Flujo de Validación

### Antes:
```
1. Usuario menciona destino + días
2. Agente genera itinerario inmediatamente
3. ❌ Falta información crítica (fechas, presupuesto)
```

### Ahora:
```
1. Usuario menciona destino + días
2. Agente valida campos obligatorios
3. ¿Faltan fechas o presupuesto?
   → SÍ: Solicita información faltante con widgets
   → NO: Procede a generar itinerario
4. ✅ Itinerario completo con toda la información necesaria
```

## Integración con Widgets del Frontend

Los flags `missing_dates` y `missing_budget` se mantienen para activar los widgets en el frontend:

```python
update["missing_dates"] = not has_dates
update["missing_budget"] = not has_budget
```

Estos flags se envían al frontend para mostrar:
- **DateRangePicker**: Si `missing_dates = true`
- **BudgetSlider**: Si `missing_budget = true`

## Ejemplos de Interacción

### Ejemplo 1: Usuario proporciona todo
```
Usuario: "Quiero viajar a Cusco del 15 al 19 de marzo con un presupuesto de 3000 soles"

Agente: ✅ Todos los campos obligatorios presentes
        → Genera itinerario directamente
```

### Ejemplo 2: Usuario omite fechas y presupuesto
```
Usuario: "Quiero un itinerario para Cusco de 4 días"

Agente: ❌ Faltan fechas y presupuesto
        → "¡Cusco es increíble! Para armar el plan perfecto, cuéntame:
           
           **¿Cuándo planeas viajar?**
           **¿Cuál es tu presupuesto total para el viaje?**"
        
        → Muestra widgets de DateRangePicker y BudgetSlider
```

### Ejemplo 3: Usuario proporciona fechas pero no presupuesto
```
Usuario: "Quiero viajar a Arequipa del 1 al 5 de abril"

Agente: ❌ Falta presupuesto
        → "¡Arequipa te va a encantar! Para completar tu itinerario:
           
           **¿Cuál es tu presupuesto total para el viaje?**"
        
        → Muestra widget de BudgetSlider
```

## Beneficios

1. **Itinerarios más precisos**: Con fechas reales, se pueden buscar vuelos y hoteles con precios actuales
2. **Presupuesto realista**: El agente puede ajustar recomendaciones al presupuesto disponible
3. **Mejor experiencia**: El usuario recibe un itinerario completo y ejecutable
4. **Menos iteraciones**: Se solicita toda la información necesaria desde el inicio
5. **Validación robusta**: Múltiples capas de validación (LLM + programática)

## Testing Recomendado

1. ✅ Enviar mensaje sin fechas ni presupuesto → Debe solicitar ambos
2. ✅ Enviar mensaje con fechas pero sin presupuesto → Debe solicitar solo presupuesto
3. ✅ Enviar mensaje con presupuesto pero sin fechas → Debe solicitar solo fechas
4. ✅ Enviar mensaje con toda la información → Debe generar itinerario directamente
5. ✅ Verificar que los widgets aparezcan correctamente en el frontend
6. ✅ Verificar que el botón "Enviar información" funcione
7. ✅ Probar con diferentes formatos de fecha ("15 de marzo", "2026-03-15", etc.)
8. ✅ Probar con diferentes formatos de presupuesto ("3000 soles", "S/3000", "$1500")

## Notas Técnicas

- El campo `budget_total` se almacena como número entero
- Las fechas se almacenan como objetos `date` de Python
- El sistema acepta al menos una fecha (inicio O fin), no necesariamente ambas
- Si solo se proporciona una fecha, el sistema puede calcular la otra usando `days`
- El nivel de presupuesto (`budget`: low/medium/high) es opcional y complementario al presupuesto total
