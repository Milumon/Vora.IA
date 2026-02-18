# Ejemplos de Uso - Vora Backend

## Ejemplos de Conversaciones con el Agente

### Ejemplo 1: Viaje Nuevo Completo

**Usuario:**
```
Quiero viajar a Cusco por 5 días con presupuesto medio. Me gusta la cultura y la aventura.
```

**Agente:**
```json
{
  "intent": "new_trip",
  "destination": "Cusco",
  "days": 5,
  "budget": "medium",
  "travel_style": ["cultural", "adventure"],
  "itinerary": {
    "title": "5 Días Mágicos en Cusco",
    "description": "Explora la capital del Imperio Inca...",
    "day_plans": [
      {
        "day_number": 1,
        "morning": [
          {
            "name": "Plaza de Armas",
            "visit_duration": "2 horas",
            "why_visit": "Centro histórico de Cusco..."
          }
        ],
        "afternoon": [...],
        "evening": [...]
      }
    ]
  }
}
```

### Ejemplo 2: Información Incompleta

**Usuario:**
```
Quiero viajar a Perú
```

**Agente:**
```json
{
  "needs_clarification": true,
  "clarification_questions": [
    "¿A qué ciudad de Perú te gustaría viajar? (Lima, Cusco, Arequipa, etc.)",
    "¿Por cuántos días planeas viajar?",
    "¿Cuál es tu presupuesto aproximado? (bajo, medio, alto)"
  ]
}
```

### Ejemplo 3: Refinamiento de Itinerario

**Usuario:**
```
Cambia el día 2 por algo más relajado, sin trekking
```

**Agente:**
```json
{
  "intent": "refine",
  "changes_made": [
    "Reemplazado trekking a Sacsayhuamán por visita al Museo Inka",
    "Agregado tiempo en cafés del barrio San Blas",
    "Incluido spa en la tarde"
  ],
  "itinerary": {
    // Itinerario actualizado
  }
}
```

### Ejemplo 4: Pregunta sobre Destino

**Usuario:**
```
¿Cuál es la mejor época para visitar Machu Picchu?
```

**Agente:**
```
La mejor época para visitar Machu Picchu es durante la temporada seca, 
de abril a octubre. Los meses de junio a agosto son los más populares 
pero también los más concurridos. Si prefieres menos turistas, considera 
abril-mayo o septiembre-octubre. Evita enero-febrero por las lluvias intensas.
```

## Ejemplos de Requests HTTP

### 1. Chat Básico

```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "message": "Quiero viajar a Cusco por 5 días",
    "thread_id": null,
    "save_conversation": true
  }'
```

**Respuesta:**
```json
{
  "message": "¡He creado tu itinerario perfecto!...",
  "thread_id": "550e8400-e29b-41d4-a716-446655440000",
  "itinerary": {
    "title": "5 Días Mágicos en Cusco",
    "day_plans": [...]
  },
  "needs_clarification": false,
  "clarification_questions": []
}
```

### 2. Continuar Conversación

```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
    "message": "Cambia el día 3 por algo más cultural",
    "thread_id": "550e8400-e29b-41d4-a716-446655440000",
    "save_conversation": true
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

## Ejemplos con Python

### Usando httpx

```python
import httpx
import asyncio

async def chat_with_agent():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/v1/chat",
            json={
                "message": "Quiero viajar a Cusco por 5 días",
                "thread_id": None,
                "save_conversation": True
            },
            headers={
                "Authorization": "Bearer YOUR_TOKEN"
            }
        )
        
        result = response.json()
        print(f"Respuesta: {result['message']}")
        
        if result.get('itinerary'):
            print(f"Itinerario: {result['itinerary']['title']}")

asyncio.run(chat_with_agent())
```

### Usando requests

```python
import requests

def chat_simple():
    response = requests.post(
        "http://localhost:8000/api/v1/chat",
        json={
            "message": "Quiero viajar a Arequipa por 3 días",
        },
        headers={
            "Authorization": "Bearer YOUR_TOKEN"
        }
    )
    
    return response.json()

result = chat_simple()
print(result['message'])
```

## Ejemplos con JavaScript/TypeScript

### Usando fetch

```javascript
async function chatWithAgent(message, threadId = null) {
  const response = await fetch('http://localhost:8000/api/v1/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${YOUR_TOKEN}`
    },
    body: JSON.stringify({
      message,
      thread_id: threadId,
      save_conversation: true
    })
  });
  
  const data = await response.json();
  return data;
}

// Uso
const result = await chatWithAgent('Quiero viajar a Cusco por 5 días');
console.log(result.message);
console.log(result.itinerary);
```

### Usando axios

```typescript
import axios from 'axios';

interface ChatRequest {
  message: string;
  thread_id?: string;
  save_conversation?: boolean;
}

interface ChatResponse {
  message: string;
  thread_id: string;
  itinerary?: any;
  needs_clarification: boolean;
  clarification_questions: string[];
}

async function chatWithAgent(request: ChatRequest): Promise<ChatResponse> {
  const response = await axios.post<ChatResponse>(
    'http://localhost:8000/api/v1/chat',
    request,
    {
      headers: {
        'Authorization': `Bearer ${YOUR_TOKEN}`
      }
    }
  );
  
  return response.data;
}

// Uso
const result = await chatWithAgent({
  message: 'Quiero viajar a Lima por 3 días',
  save_conversation: true
});

console.log(result.message);
```

## Flujos de Conversación Completos

### Flujo 1: Planificación Completa

```
1. Usuario: "Quiero viajar a Cusco"
   Agente: "¿Por cuántos días? ¿Cuál es tu presupuesto?"

2. Usuario: "5 días, presupuesto medio"
   Agente: "¿Qué tipo de actividades prefieres?"

3. Usuario: "Cultura y aventura"
   Agente: [Genera itinerario completo]

4. Usuario: "Perfecto, guárdalo"
   Agente: "Itinerario guardado. ¿Algo más?"
```

### Flujo 2: Refinamiento Iterativo

```
1. Usuario: "Quiero viajar a Arequipa 4 días"
   Agente: [Genera itinerario]

2. Usuario: "El día 2 está muy cargado"
   Agente: [Ajusta día 2, reduce actividades]

3. Usuario: "Agrega más gastronomía"
   Agente: [Agrega restaurantes típicos]

4. Usuario: "Perfecto así"
   Agente: "¡Excelente! Tu itinerario está listo."
```

## Testing Manual

### Script de prueba rápida

```bash
# 1. Iniciar servidor
uvicorn app.main:app --reload

# 2. En otra terminal, probar el agente
python test_agent.py

# 3. O hacer request directo
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Quiero viajar a Cusco por 5 días"}'
```

## Troubleshooting

### Error: "Unauthorized"
- Verifica que el token JWT sea válido
- Asegúrate de incluir el header `Authorization: Bearer <token>`

### Error: "Rate limit exceeded"
- Espera 1 minuto antes de hacer más requests
- El límite es 10 requests por minuto

### Error: "OpenAI API error"
- Verifica que `OPENAI_API_KEY` sea válida
- Revisa que tengas créditos en tu cuenta de OpenAI

### Error: "Google Places API error"
- Verifica que `GOOGLE_PLACES_API_KEY` sea válida
- Asegúrate de que Places API esté habilitada en GCP
- Verifica que billing esté configurado
