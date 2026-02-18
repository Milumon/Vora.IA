# Guía de Testing - UI/UX Conversacional

## Requisitos Previos

1. Backend corriendo en `http://localhost:8000`
2. Frontend corriendo en `http://localhost:3000`
3. Variables de entorno configuradas (OPENAI_API_KEY, etc.)

## Pruebas del Backend

### 1. Prueba del Flujo Conversacional

Ejecuta el script de prueba para verificar que el agente hace preguntas progresivas:

```bash
cd backend
python test_conversational_flow.py
```

**Resultado esperado:**
- El agente debe hacer preguntas una a la vez
- Debe validar la información antes de continuar
- Debe generar respuestas conversacionales con personalidad "Layla"
- Debe incluir emojis y tono entusiasta

### 2. Prueba del Endpoint de Chat

```bash
# Mensaje inicial
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Quiero viajar a Machu Picchu",
    "save_conversation": false
  }'
```

**Verificar en la respuesta:**
- `needs_clarification: true`
- `clarification_questions` contiene preguntas específicas
- `message` tiene tono conversacional

## Pruebas del Frontend

### 1. Flujo Completo de Conversación

1. Ve a `http://localhost:3000/chat`
2. Envía el mensaje: "Quiero viajar a Cusco 5 días"
3. Observa:
   - ✅ El mensaje del usuario aparece a la derecha
   - ✅ La respuesta del asistente aparece a la izquierda
   - ✅ Aparecen botones de respuesta rápida debajo del mensaje
   - ✅ El panel derecho muestra "Entendiendo tu viaje..."

4. Haz clic en uno de los botones de respuesta rápida
5. Observa:
   - ✅ El mensaje se envía automáticamente
   - ✅ El agente hace la siguiente pregunta
   - ✅ Nuevos botones de respuesta aparecen

6. Continúa respondiendo hasta completar toda la información
7. Observa:
   - ✅ Aparece el componente de progreso con los pasos
   - ✅ Los pasos se van completando uno a uno
   - ✅ El panel derecho muestra "Construyendo tu Itinerario"
   - ✅ Se genera el itinerario final

### 2. Prueba de Componentes Visuales

#### Componente de Progreso
- Debe mostrar 5 pasos
- El paso activo debe tener un spinner animado
- Los pasos completados deben tener un check verde
- Los pasos pendientes deben estar en gris

#### Botones de Respuesta Rápida
- Deben aparecer después de mensajes del asistente con preguntas
- Deben tener hover effect
- Al hacer clic, deben enviar el mensaje automáticamente

#### Panel Lateral (TravelVisualizer)
- Debe aparecer solo en pantallas grandes (lg+)
- Debe mostrar el título correcto según el estado
- Debe detectar el destino de los mensajes
- Debe mostrar indicador de progreso animado cuando está generando

### 3. Prueba de Responsive Design

1. Abre DevTools y cambia a vista móvil
2. Verifica:
   - ✅ El panel lateral desaparece en móvil
   - ✅ El chat ocupa todo el ancho
   - ✅ Los botones de respuesta se ajustan correctamente
   - ✅ El componente de progreso se ve bien en móvil

## Casos de Prueba Específicos

### Caso 1: Usuario Proporciona Toda la Información de Una Vez

**Input:**
```
"Quiero viajar a Cusco 5 días con presupuesto medio, somos 2 personas"
```

**Resultado esperado:**
- El agente debe reconocer toda la información
- Debe hacer solo preguntas sobre lo que falta (fechas, tipo de experiencia)
- No debe repetir preguntas sobre información ya proporcionada

### Caso 2: Usuario Cambia de Opinión

**Conversación:**
```
Usuario: "Quiero ir a Cusco"
Layla: [pregunta sobre tipo de experiencia]
Usuario: "Mejor quiero ir a Arequipa"
```

**Resultado esperado:**
- El agente debe reconocer el cambio
- Debe ajustar las preguntas según el nuevo destino
- Debe mantener otra información ya proporcionada

### Caso 3: Usuario Responde con Información Vaga

**Input:**
```
"Quiero viajar a Perú"
```

**Resultado esperado:**
- El agente debe pedir clarificación sobre el destino específico
- Debe ofrecer opciones (Cusco, Lima, Arequipa, etc.)
- Debe mantener tono amigable y no frustrarse

### Caso 4: Usuario Hace Preguntas en Medio del Flujo

**Conversación:**
```
Usuario: "Quiero ir a Cusco"
Layla: [pregunta sobre tipo de experiencia]
Usuario: "¿Cuál es la mejor época para ir?"
```

**Resultado esperado:**
- El agente debe responder la pregunta
- Debe retomar el flujo de preguntas después
- No debe perder el contexto de la conversación

## Verificación de Calidad

### Checklist de Funcionalidad

- [ ] El agente hace preguntas progresivas (una o dos a la vez)
- [ ] Las respuestas tienen personalidad "Layla" (entusiasta, con emojis)
- [ ] Los botones de respuesta rápida funcionan correctamente
- [ ] El componente de progreso se muestra cuando corresponde
- [ ] El panel lateral detecta el destino correctamente
- [ ] El layout de dos columnas funciona en desktop
- [ ] El layout se adapta correctamente en móvil
- [ ] No hay errores en la consola del navegador
- [ ] No hay errores en los logs del backend
- [ ] El flujo completo genera un itinerario al final

### Checklist de UX

- [ ] Las transiciones son suaves
- [ ] Los mensajes se desplazan automáticamente al final
- [ ] El indicador de "escribiendo..." aparece mientras carga
- [ ] Los botones tienen feedback visual al hacer hover
- [ ] El progreso se actualiza de forma clara
- [ ] El tono conversacional se mantiene consistente
- [ ] Las preguntas son claras y fáciles de responder
- [ ] No se repiten preguntas innecesariamente

## Problemas Comunes y Soluciones

### Problema: El agente no hace preguntas progresivas

**Solución:**
- Verifica que `conversation_manager.py` esté importado en `graph.py`
- Verifica que el nodo `generate_response` esté en el grafo
- Revisa los logs del backend para ver el flujo de ejecución

### Problema: Los botones de respuesta no aparecen

**Solución:**
- Verifica que el backend devuelva `clarification_questions` en la respuesta
- Verifica que el frontend esté procesando `metadata` correctamente
- Revisa la consola del navegador para errores

### Problema: El panel lateral no aparece

**Solución:**
- Verifica que estés en una pantalla grande (lg+)
- Verifica que el componente `TravelVisualizer` esté importado en la página
- Revisa que el layout flex esté configurado correctamente

### Problema: El progreso no se actualiza

**Solución:**
- Verifica que `currentProgress` se esté actualizando en el store
- Verifica que el componente `ItineraryProgress` reciba las props correctas
- Revisa que los pasos tengan los campos `id`, `label`, `completed`, `active`

## Métricas de Éxito

Una implementación exitosa debe cumplir:

1. **Conversación Natural**: El 80%+ de las interacciones deben sentirse naturales
2. **Preguntas Progresivas**: Máximo 2 preguntas por mensaje del agente
3. **Tiempo de Respuesta**: < 3 segundos por mensaje
4. **Tasa de Completación**: 70%+ de usuarios completan el flujo
5. **Errores**: < 5% de tasa de error en el flujo conversacional

## Logs y Debugging

### Backend Logs
```bash
# Ver logs en tiempo real
cd backend
tail -f logs/app.log
```

### Frontend Console
- Abre DevTools (F12)
- Ve a la pestaña Console
- Busca errores o warnings relacionados con el chat

### Network Tab
- Abre DevTools → Network
- Filtra por "chat"
- Verifica las respuestas del API:
  - Status: 200 OK
  - Response incluye `needs_clarification` y `clarification_questions`
  - Tiempo de respuesta < 3s

## Próximos Pasos

Después de verificar que todo funciona:

1. Agregar imágenes reales de destinos
2. Implementar más opciones de respuesta rápida
3. Agregar animaciones más elaboradas
4. Implementar preview del itinerario antes de confirmar
5. Agregar analytics para medir el engagement
