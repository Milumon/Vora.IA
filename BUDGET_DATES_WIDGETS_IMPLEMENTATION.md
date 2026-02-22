# Implementación de Widgets Condicionales de Fechas y Presupuesto

## Resumen

Se implementó un sistema de widgets condicionales que muestra selectores de fechas y presupuesto solo cuando el usuario no especifica esta información en su primer mensaje. El presupuesto ahora representa el presupuesto total del viaje, y el 90% de este se usa para calcular el límite de alojamiento.

## Cambios Realizados

### 1. Backend - Schema y Estado

**`backend/app/agents/state.py`**
- Agregado `budget_total: Optional[int]` - Presupuesto total del viaje
- Agregado `missing_dates: bool` - Flag para indicar si faltan fechas
- Agregado `missing_budget: bool` - Flag para indicar si falta presupuesto

**`backend/app/api/v1/schemas/chat.py`**
- `ChatRequest`: Reemplazado `budget_min`/`budget_max` por `budget_total`
- `ChatResponse`: Agregados campos `missing_dates` y `missing_budget`

### 2. Backend - Lógica de Detección

**`backend/app/agents/nodes/preference_extractor.py`**
- Agregado campo `budget_total` al schema `ExtractedPreferences`
- Agregados campos `missing_dates` y `missing_budget` para detección
- Implementada lógica de detección en primer mensaje:
  - Detecta si el usuario mencionó fechas (start_date/end_date)
  - Detecta si el usuario mencionó presupuesto total
  - Marca los flags correspondientes para mostrar widgets
- Actualizado prompt para extraer presupuesto numérico como `budget_total`

### 3. Backend - Cálculo de Presupuesto de Alojamiento

**`backend/app/agents/nodes/accommodation_searcher.py`**
- Modificado para usar `budget_total` del estado
- Implementado cálculo: 90% del presupuesto total para alojamiento
- Divide el presupuesto de alojamiento entre número de noches
- `price_min` siempre es 0 (como solicitado)
- `price_max` = (budget_total * 0.9) / número_de_noches

**`backend/app/api/v1/endpoints/chat.py`**
- Actualizado para pasar `budget_total` al estado del agente
- Agregado manejo de `missing_dates` y `missing_budget` en respuesta

### 4. Frontend - Componentes de Widgets

**`frontend/src/components/chat/widgets/BudgetSlider.tsx`**
- Cambiado label de "Presupuesto por noche" a "Presupuesto total del viaje"
- Actualizado `CURRENCY_CONFIG` con rangos más amplios:
  - PEN: 500-10,000 (default: 2,000-5,000)
  - USD: 150-3,000 (default: 600-1,500)

**`frontend/src/components/chat/widgets/DateRangePicker.tsx`**
- Sin cambios (ya existente y funcional)

### 5. Frontend - Lógica de Visualización Condicional

**`frontend/src/components/chat/ChatPanel.tsx`**
- Agregadas props `showDatePicker` y `showBudgetSlider`
- Auto-apertura del panel de filtros cuando hay widgets activos
- Cambio de label: "Filtros de alojamiento" → "Información adicional"
- Solo envía `budgetTotal` (el valor máximo del slider)
- Widgets se muestran/ocultan condicionalmente

**`frontend/src/app/[locale]/chat/page.tsx`**
- Agregados estados `showDatePicker` y `showBudgetSlider`
- Implementado `useEffect` para detectar flags del último mensaje del asistente
- Pasa las props al `ChatPanel` para controlar visibilidad

### 6. Frontend - API y Hooks

**`frontend/src/lib/api/endpoints.ts`**
- Actualizado `chatApi.sendMessage` para aceptar `budget_total` en lugar de `budget_min`/`budget_max`

**`frontend/src/hooks/useChat.ts`**
- Modificado para enviar `budgetTotal` en lugar de `budgetRange`
- Agregado manejo de `missing_dates` y `missing_budget` en metadata del mensaje

**`frontend/src/store/chatStore.ts`**
- Actualizado tipo `Message.metadata` para incluir `missingDates` y `missingBudget`

## Flujo de Funcionamiento

1. **Usuario envía primer mensaje**: "Quiero ir a Cusco por 5 días"

2. **Backend analiza el mensaje**:
   - Extrae: destination="Cusco", days=5
   - Detecta: NO hay fechas → `missing_dates=true`
   - Detecta: NO hay presupuesto → `missing_budget=true`

3. **Frontend recibe respuesta**:
   - Lee flags `missing_dates` y `missing_budget`
   - Activa `showDatePicker=true` y `showBudgetSlider=true`

4. **Usuario ve los widgets**:
   - Panel "Información adicional" se abre automáticamente
   - Puede seleccionar fechas en el calendario
   - Puede ajustar presupuesto total del viaje con el slider

5. **Usuario envía siguiente mensaje**:
   - Se incluyen: `dateRange`, `budgetTotal`, `currency`
   - Backend recibe y actualiza el estado

6. **Cálculo de alojamiento**:
   - Si `budget_total = 5000 PEN` y `days = 5`:
   - Presupuesto alojamiento = 5000 * 0.9 = 4500 PEN
   - Precio máximo por noche = 4500 / 5 = 900 PEN
   - Se buscan alojamientos con `price_min=0`, `price_max=900`

## Ventajas del Diseño

1. **No intrusivo**: Los widgets solo aparecen cuando realmente faltan datos
2. **Contexto claro**: El presupuesto es para todo el viaje, no solo alojamiento
3. **Cálculo automático**: El 90% se asigna a alojamiento sin que el usuario lo sepa
4. **Flexible**: Si el usuario menciona fechas/presupuesto en texto, no se muestran widgets
5. **Persistente**: Los valores se mantienen en el estado de la conversación

## Notas Técnicas

- El presupuesto mínimo siempre es 0 para maximizar opciones
- El 10% restante del presupuesto se reserva implícitamente para transporte/comidas
- Los widgets se ocultan automáticamente después del primer mensaje si no son necesarios
- La detección solo ocurre en el primer mensaje (cuando `len(messages) <= 2`)
