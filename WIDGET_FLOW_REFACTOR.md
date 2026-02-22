# Refactorización del Flujo de Widgets de Información Adicional

## Resumen de Cambios

Se ha modificado el flujo de interacción del chat para que los widgets de "Información adicional" (fechas y presupuesto) aparezcan como parte de la respuesta del agente, con un botón de "Enviar" integrado. También se ha agregado un indicador de progreso con checkboxes que muestra el estado de generación del itinerario.

## Componentes Modificados

### 1. BudgetSlider.tsx
- **Cambio**: Simplificado de un slider de rango doble a un slider simple
- **Antes**: `value: [number, number]` (rango mínimo-máximo)
- **Ahora**: `value: number` (valor único)
- **Configuración**:
  - PEN: S/500 - S/10,000 (default: S/5,000)
  - USD: $150 - $3,000 (default: $1,500)

### 2. ProgressIndicator.tsx (NUEVO)
- **Propósito**: Mostrar el progreso de generación del itinerario con checkboxes
- **Características**:
  - Checkboxes para pasos completados
  - Spinner animado para el paso activo
  - Estados visuales diferenciados (completado, activo, pendiente)
- **Pasos dinámicos**:
  - Búsqueda de transporte
  - Búsqueda de alojamiento
  - Búsqueda de lugares para cada día (dinámico según duración del viaje)
  - Generando itinerario personalizado

### 3. AdditionalInfoWidget.tsx (NUEVO)
- **Propósito**: Contenedor unificado para los widgets de fecha y presupuesto
- **Características**:
  - Integra DateRangePicker y BudgetSlider
  - Botón "Enviar información" con validación
  - Diseño consistente con el resto de la UI
  - Maneja el estado local de los widgets

### 4. MessageBubble.tsx
- **Cambios principales**:
  - Ahora acepta `metadata` en el mensaje con:
    - `missingDates`: boolean - indica si se necesitan fechas
    - `missingBudget`: boolean - indica si se necesita presupuesto
    - `progressSteps`: array - pasos de progreso a mostrar
  - Renderiza `AdditionalInfoWidget` cuando hay información faltante
  - Renderiza `ProgressIndicator` cuando hay pasos de progreso
  - Callback `onWidgetSubmit` para enviar la información recopilada

### 5. ChatPanel.tsx
- **Simplificación**:
  - Eliminado el panel colapsable de "Información adicional"
  - Eliminado el estado local de widgets (ahora en MessageBubble)
  - Callback `handleWidgetSubmit` que envía un mensaje automático con la data

### 6. useChat.ts
- **Mejora en generación de progreso**:
  - Calcula dinámicamente el número de días del viaje
  - Genera pasos de progreso personalizados:
    - 1 paso para transporte
    - 1 paso para alojamiento
    - N pasos para búsqueda de lugares (uno por día)
    - 1 paso final de generación

### 7. chat/page.tsx
- **Limpieza**:
  - Eliminadas props `showDatePicker` y `showBudgetSlider`
  - Eliminado estado local de widgets
  - Eliminado useEffect de detección de información faltante

## Flujo de Interacción

### Antes:
1. Usuario envía mensaje
2. Agente responde
3. Panel colapsable "Información adicional" aparece en la parte inferior
4. Usuario expande el panel manualmente
5. Usuario completa widgets
6. Usuario envía mensaje de texto (widgets se envían automáticamente)

### Ahora:
1. Usuario envía mensaje
2. Agente responde con texto invitando a completar información
3. Widgets aparecen **dentro del mensaje del agente**
4. Usuario completa widgets directamente en el mensaje
5. Usuario presiona botón **"Enviar información"** integrado
6. Se envía automáticamente un mensaje con la data

## Indicador de Progreso

### Ejemplo de pasos para un viaje de 3 días:
```
○ Búsqueda de transporte (activo con spinner)
○ Búsqueda de alojamiento
○ Búsqueda de lugares para el día 1
○ Búsqueda de lugares para el día 2
○ Búsqueda de lugares para el día 3
○ Generando itinerario personalizado
```

### Estados visuales:
- **Activo**: Spinner naranja animado + texto naranja en negrita
- **Completado**: Checkbox verde marcado + texto gris
- **Pendiente**: Checkbox gris desmarcado + texto gris claro

## Ventajas del Nuevo Flujo

1. **Más conversacional**: Los widgets son parte natural de la respuesta del agente
2. **Menos pasos**: No hay que expandir un panel separado
3. **Más claro**: El botón "Enviar" indica explícitamente la acción
4. **Mejor feedback**: El indicador de progreso muestra exactamente qué está haciendo el sistema
5. **Dinámico**: Los pasos de progreso se adaptan a la duración del viaje
6. **Más simple**: Menos estado compartido entre componentes

## Archivos Creados
- `frontend/src/components/chat/widgets/ProgressIndicator.tsx`
- `frontend/src/components/chat/widgets/AdditionalInfoWidget.tsx`
- `WIDGET_FLOW_REFACTOR.md` (este documento)

## Archivos Modificados
- `frontend/src/components/chat/widgets/BudgetSlider.tsx`
- `frontend/src/components/chat/MessageBubble.tsx`
- `frontend/src/components/chat/ChatPanel.tsx`
- `frontend/src/hooks/useChat.ts`
- `frontend/src/app/[locale]/chat/page.tsx`

## Testing Recomendado

1. Enviar mensaje inicial sin fechas ni presupuesto
2. Verificar que aparezcan los widgets en el mensaje del agente
3. Completar fechas y presupuesto
4. Presionar "Enviar información"
5. Verificar que aparezca el indicador de progreso
6. Verificar que los pasos se actualicen dinámicamente
7. Probar con diferentes duraciones de viaje (2, 3, 5 días)
8. Verificar cambio de moneda (PEN/USD)
