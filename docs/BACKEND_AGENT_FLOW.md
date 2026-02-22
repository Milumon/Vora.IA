# 🧠 Vora Backend — Flujo Completo del Agente de Viajes IA

> **Audiencia:** Entusiastas de IA con conocimientos básicos de software.
> Este documento explica paso a paso cómo funciona el backend de Vora, desde que el usuario envía un mensaje hasta que recibe un itinerario completo.

---

## 📖 Glosario de Términos Técnicos

Antes de sumergirnos en el flujo, definamos las palabras clave que aparecerán a lo largo del documento:

| Término | Definición |
|---|---|
| **LLM (Large Language Model)** | Un modelo de lenguaje grande, como GPT-4o de OpenAI. Es el "cerebro" de la IA que entiende texto humano y genera respuestas inteligentes. Piensa en él como un asistente ultra-inteligente que lee y escribe. |
| **LangGraph** | Un framework (herramienta de desarrollo) creado por LangChain que permite construir **grafos de agentes** — flujos donde diferentes pasos de IA se conectan entre sí como un mapa de metro. Cada estación es un "nodo" y los rieles son las "aristas". |
| **Grafo (Graph)** | Una estructura de datos que conecta puntos (nodos) con líneas (aristas). Imagina un diagrama de flujo: cada caja es un nodo, y cada flecha es una arista. El grafo define el ORDEN en que se ejecutan las tareas. |
| **Nodo (Node)** | Una unidad de trabajo individual dentro del grafo. Cada nodo hace UNA cosa específica: clasificar intención, buscar lugares, construir itinerario, etc. Es como un empleado especializado en una empresa. |
| **Arista (Edge)** | La conexión entre dos nodos. Puede ser **directa** ("siempre ve al siguiente nodo") o **condicional** ("dependiendo de la respuesta, ve a este o aquel nodo"). |
| **Estado (State)** | La "memoria compartida" del agente. Es un diccionario (objeto con pares clave-valor) que todos los nodos pueden leer y modificar. Contiene todo: mensajes del chat, destino, fechas, lugares encontrados, itinerario, etc. |
| **Intención (Intent)** | Lo que el usuario QUIERE hacer. El clasificador de intención detecta si el usuario quiere un viaje nuevo, refinar uno existente, hacer una pregunta general, o dar más detalles. |
| **Pipeline** | Una secuencia de pasos que se ejecutan uno tras otro, como una línea de producción en una fábrica. Cada paso toma algo del anterior y lo mejora. |
| **API (Application Programming Interface)** | Un punto de comunicación entre el frontend (lo que el usuario ve) y el backend (el servidor que procesa). El frontend envía un mensaje, la API lo recibe y devuelve la respuesta del agente. |
| **Endpoint** | Una URL específica del backend que acepta peticiones. Por ejemplo: `POST /api/v1/chat` es el endpoint donde el frontend envía los mensajes del chat. |
| **Prompt** | Las instrucciones que se le dan al LLM. Es como un guión que le dice al modelo cómo debe comportarse, qué información analizar, y qué formato de respuesta usar. |
| **Structured Output** | Cuando le pedimos al LLM que responda en un formato específico (como JSON con campos predefinidos) en lugar de texto libre. Esto nos permite extraer datos confiablemente. |
| **Pydantic** | Una librería de Python que define "modelos" de datos con validación. Si dices "quiero un campo `days` que sea un número entero", Pydantic rechaza automáticamente si alguien intenta poner texto ahí. |
| **FastAPI** | El framework web del backend. Maneja las peticiones HTTP, valida datos de entrada, y devuelve respuestas JSON. Es ultrarrápido y tiene documentación automática. |
| **Supabase** | Servicio de base de datos en la nube (alternativa a Firebase). Vora lo usa para guardar conversaciones, itinerarios y datos de usuarios. |
| **Deep Link** | Un enlace que lleva al usuario directamente a una acción específica dentro de otra aplicación o sitio web. Por ejemplo, un link que abre la página de reserva de LATAM con el vuelo ya seleccionado. |
| **Webhook / Scraper** | Herramientas para obtener datos de otros servicios. Un scraper extrae información de páginas web (como precios de Airbnb). |
| **Delta (de refinamiento)** | La diferencia entre lo que el usuario tenía antes y lo que quiere ahora. Si tenía "5 días" y dice "cambia a 7 días", el delta es `{days: 7}`. |
| **Scope (alcance)** | Qué tanto del pipeline debe re-ejecutarse cuando el usuario pide un cambio. Cambiar destino = rehacer TODO. Cambiar días = solo reconstruir el itinerario. |

---

## 🏗️ Arquitectura General

Vora está construida como un **agente conversacional de viajes** especializado en Perú. Su backend usa un **grafo dirigido** (LangGraph) donde cada nodo es un especialista que cumple una función específica.

### Estructura de carpetas del backend

```
backend/
├── app/
│   ├── main.py                    # 🚀 Punto de entrada — configura FastAPI
│   ├── agents/                    # 🧠 El cerebro del agente
│   │   ├── graph.py               #    Grafo principal (conecta todos los nodos)
│   │   ├── state.py               #    Definición del estado compartido
│   │   ├── nodes/                 #    Los nodos individuales:
│   │   │   ├── intent_classifier.py       # Clasificador de intención
│   │   │   ├── preference_extractor.py    # Extractor de preferencias
│   │   │   ├── conversation_manager.py    # Generador de respuestas
│   │   │   ├── place_searcher.py          # Buscador de lugares
│   │   │   ├── mobility_searcher.py       # Buscador de transporte
│   │   │   ├── accommodation_searcher.py  # Buscador de alojamiento
│   │   │   ├── itinerary_builder.py       # Constructor de itinerarios
│   │   │   ├── restaurant_searcher.py     # Buscador de restaurantes
│   │   │   ├── refinement_delta.py        # Extractor de cambios
│   │   │   └── refinement_handler.py      # Manejador de refinamientos
│   │   └── tools/                 #    Herramientas del agente
│   │       └── google_places.py   #    Cliente de Google Places API
│   ├── api/v1/                    # 🌐 Endpoints HTTP
│   │   ├── router.py              #    Router principal
│   │   ├── endpoints/
│   │   │   ├── chat.py            #    Endpoint de chat (el principal)
│   │   │   ├── auth.py            #    Autenticación
│   │   │   ├── conversations.py   #    CRUD de conversaciones
│   │   │   ├── itineraries.py     #    CRUD de itinerarios
│   │   │   ├── places.py          #    Búsqueda de lugares
│   │   │   └── mobility.py        #    Transporte
│   │   └── schemas/               #    Modelos de entrada/salida (Pydantic)
│   ├── services/                  # 🔌 Clientes de APIs externas
│   │   ├── serpapi_client.py      #    Búsqueda de vuelos (Serper.dev)
│   │   ├── routes_client.py       #    Google Routes API (bus/auto)
│   │   ├── apify_client.py        #    Airbnb scraper (Apify)
│   │   ├── airline_deeplinks.py   #    Deep links de aerolíneas
│   │   └── supabase_client.py     #    Cliente de Supabase
│   ├── config/                    # ⚙️ Configuración
│   │   ├── settings.py            #    Variables de entorno
│   │   ├── logging.py             #    Sistema de logging
│   │   └── security.py            #    Seguridad
│   └── core/                      # 🔧 Utilidades centrales
│       ├── dependencies.py        #    Dependencias de FastAPI
│       ├── exceptions.py          #    Manejo de errores
│       └── middleware.py          #    Middlewares
```

---

## 🔄 El Flujo Completo: Del Mensaje a la Respuesta

### Diagrama de Flujo General

```
                         ┌─────────────────────┐
                         │   Usuario envía un   │
                         │      mensaje         │
                         └─────────┬───────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │     POST /api/v1/chat         │
                    │  (Endpoint de FastAPI)         │
                    │                                │
                    │  1. Autenticar usuario          │
                    │  2. Recuperar conversación      │
                    │     previa de Supabase          │
                    │  3. Construir estado inicial    │
                    │  4. Ejecutar el GRAFO ──────────┼──── ► (ver siguiente diagrama)
                    │  5. Guardar estado en Supabase  │
                    │  6. Devolver ChatResponse       │
                    └──────────────────────────────┘
                                   │
                                   ▼
                         ┌─────────────────────┐
                         │  Frontend recibe la  │
                         │    respuesta JSON    │
                         └─────────────────────┘
```

---

## 🧩 Fase 1: La Puerta de Entrada — El Endpoint de Chat

**Archivo:** `app/api/v1/endpoints/chat.py`

Cuando el frontend envía un mensaje, esta es la secuencia exacta:

### 1.1 Recibir y validar la petición

El endpoint recibe un objeto `ChatRequest` con esta estructura:

```python
{
    "message": "Quiero viajar a Cusco 5 días",  # El mensaje del usuario
    "thread_id": "abc-123",                      # ID de conversación (null si es nueva)
    "save_conversation": true,                    # Guardar en Supabase
    "currency": "PEN",                            # Moneda (Soles o Dólares)
    "budget_total": 3000,                         # Presupuesto total (del widget)
    "check_in": "2026-03-15",                     # Fecha de inicio (del widget)
    "check_out": "2026-03-20"                     # Fecha de fin (del widget)
}
```

### 1.2 Recuperar el contexto previo

Si el usuario tiene un `thread_id` (ya conversó antes), se recupera la conversación completa de Supabase:
- Mensajes previos (toda la conversación)
- Estado acumulado (destino, días, presupuesto, etc.)
- Itinerario generado (si existe)
- Opciones de transporte y alojamiento encontradas

### 1.3 Construir el estado inicial

Se arma un diccionario `input_state` que combina:
- **Datos del frontend** (widgets de fechas, presupuesto)
- **Estado previo** (de la conversación anterior)
- **Mensaje nuevo** del usuario

Los datos del widget tienen **prioridad** sobre el estado previo (si el usuario cambia las fechas en el widget, eso toma preferencia).

### 1.4 Ejecutar el grafo

```python
graph = create_travel_agent_graph()
result = await graph.ainvoke(input_state)
```

Aquí es donde entra la magia. El grafo toma el estado y lo pasa por todos los nodos necesarios.

### 1.5 Devolver la respuesta

La respuesta `ChatResponse` incluye:

```python
{
    "message": "¡Cusco es increíble! Aquí tienes tu itinerario...",
    "thread_id": "abc-123",
    "itinerary": { ... },              # El itinerario completo (si se generó)
    "needs_clarification": false,       # ¿Necesita más info?
    "clarification_questions": [],      # Preguntas pendientes
    "missing_dates": false,             # ¿Faltan fechas?
    "missing_budget": false             # ¿Falta presupuesto?
}
```

---

## 🧠 Fase 2: El Grafo del Agente — El Cerebro de Vora

**Archivo:** `app/agents/graph.py`

El grafo es el corazón del sistema. Define **qué nodos existen** y **cómo se conectan**. Piensa en él como un mapa de metro con varias líneas posibles.

### Diagrama del Grafo Completo

```
                              ┌──────────────────┐
                              │  ENTRY POINT     │
                              │                  │
                              │  classify_intent │ ◄── Todo comienza aquí
                              └───────┬──────────┘
                                      │
                          ┌───────────┼────────────────┬──────────────┐
                          │           │                │              │
                    intent=          intent=       intent=        intent=
                   "new_trip"       "clarify"     "question"     "refine"
                          │           │                │              │
                          ▼           ▼                │              ▼
                ┌─────────────────────────┐           │    ┌─────────────────────┐
                │  extract_preferences    │           │    │ extract_refinement  │
                │  (extrae datos del msg) │           │    │      _delta         │
                └────────┬────────────────┘           │    └────────┬────────────┘
                         │                            │             │
                    ┌────┴────┐                       │             ▼
                    │         │                       │    ┌─────────────────────┐
               "ready"  "needs_                       │    │  handle_refinement  │
                    │   clarification"                │    └────────┬────────────┘
                    │         │                       │             │
                    │         ▼                       │      ┌──────┼──────────┬──────────────┐
                    │  ┌──────────────┐               │      │      │          │              │
                    │  │  generate    │               │  destination style    dates      metadata
                    │  │  _response   │◄──────────────┘  _changed  _changed  _changed     _only
                    │  └──────┬───────┘                    │      │          │              │
                    │         │                            │      │          │              │
                    │        END                           ▼      ▼          │              │
                    │                            ┌──────────────────┐        │              │
                    ▼                            │  search_places   │        │              │
           ┌────────────────┐                    └────────┬─────────┘        │              │
           │ search_places  │                             │                  │              │
           └───────┬────────┘                             ▼                  │              │
                   │                             ┌──────────────────┐        │              │
                   ▼                             │ search_mobility  │◄───────┘              │
           ┌────────────────┐                    └────────┬─────────┘                       │
           │search_mobility │                             │                                 │
           └───────┬────────┘                             ▼                                 │
                   │                             ┌──────────────────────┐                   │
                   ▼                             │search_accommodation  │                   │
           ┌──────────────────────┐              └────────┬────────────┘                    │
           │search_accommodation  │                       │                                 │
           └───────┬──────────────┘                       ▼                                 │
                   │                             ┌──────────────────┐                       │
                   ▼                             │ build_itinerary  │◄──────────────────────┘
           ┌────────────────┐                    └────────┬─────────┘
           │build_itinerary │                             │
           └───────┬────────┘                             ▼
                   │                             ┌────────────────────┐
                   ▼                             │search_restaurants  │
           ┌────────────────────┐                └────────┬───────────┘
           │search_restaurants  │                         │
           └───────┬────────────┘                        END
                   │
                  END
```

### Tipos de conexiones (aristas)

| Tipo | Símbolo | Significado |
|------|---------|-------------|
| **Arista directa** | `→` | Siempre va al siguiente nodo. Ej: `search_places → search_mobility` |
| **Arista condicional** | `→ ?` | Depende de una función que evalúa el estado. Ej: `classify_intent → {new_trip, refine, question, clarify}` |
| **END** | ⬛ | El grafo termina y devuelve el estado final |

---

## 🔍 Fase 3: Los Nodos — Cada Especialista en Detalle

### 🏷️ Nodo 1: `classify_intent` — El Recepcionista

**Archivo:** `app/agents/nodes/intent_classifier.py`
**Propósito:** Determinar QUÉ QUIERE el usuario.

```
📥 Entrada: Último mensaje + contexto de conversación + estado actual
📤 Salida:  { intent: "new_trip" | "clarify" | "refine" | "question" }
```

**¿Cómo funciona?**

1. Toma los últimos 6 mensajes de la conversación como contexto
2. Evalúa el estado actual (¿ya tiene destino? ¿tiene itinerario?)
3. Envía todo al LLM (GPT-4o) con un prompt que le dice:
   - "Si es la primera vez → `new_trip`"
   - "Si está dando más detalles de un viaje en curso → `clarify`"
   - "Si quiere cambiar un itinerario existente → `refine`"
   - "Si es una pregunta general → `question`"

**Reglas de seguridad:**
- Si el LLM da una respuesta inválida, usa una **heurística** (regla lógica simple): si ya hay destino o días definidos → `clarify`, si no → `new_trip`
- Si se alcanza el máximo de iteraciones (10), reinicia a `new_trip` para evitar loops infinitos

> 💡 **Analogía:** Es como el recepcionista de un hotel que escucha al huésped y decide: "¿necesita una habitación nueva, quiere cambiar la que tiene, o solo tiene una pregunta?"

---

### 📋 Nodo 2: `extract_preferences` — El Entrevistador

**Archivo:** `app/agents/nodes/preference_extractor.py`
**Propósito:** Extraer DATOS ESTRUCTURADOS del mensaje del usuario.

```
📥 Entrada: Mensaje del usuario + campos ya confirmados
📤 Salida:  { destination, days, budget_total, start_date, end_date, 
              travel_style, travelers, needs_clarification, ... }
```

**¿Cómo funciona?**

1. **Snapshot de campos:** Lee qué datos ya tenemos confirmados y cuáles faltan
2. **Invocación del LLM:** Con `structured_output` (Pydantic), le pide al LLM que extraiga SOLO info NUEVA del mensaje
3. **Merge inteligente:** Combina datos nuevos con los previos (sin sobrescribir lo que ya sabemos)
4. **Guardia programática:** Verifica si ya tenemos TODO lo obligatorio

**Campos obligatorios para lanzar el pipeline:**

| Campo | Ejemplo | ¿Obligatorio? |
|-------|---------|:-:|
| `destination` | "Cusco" | ✅ |
| `days` | 5 | ✅ |
| `start_date` o `end_date` | "2026-03-15" | ✅ |
| `budget_total` | 3000 | ✅ |
| `travel_style` | ["cultural", "adventure"] | ❌ Opcional |
| `travelers` | 2 | ❌ Opcional |
| `budget` (nivel) | "medium" | ❌ Opcional |

**La Guardia Programática** (anti-LLM alucinatorio):

El LLM a veces "alucina" y dice que necesita más datos cuando ya los tiene. Para evitar esto, hay una verificación programática POST-LLM:

```
SI destino + días + fechas + presupuesto están completos:
    → FORZAR needs_clarification = false (IGNORAR lo que diga el LLM)
    → Limpiar las preguntas de clarificación
    → Proceder al pipeline de búsqueda
```

Esto garantiza que el usuario no sea bombardeado con preguntas innecesarias.

> 💡 **Analogía:** Es como un agente de viajes que tiene un formulario. Escucha al cliente, anota lo que dice, y solo pregunta lo que REALMENTE falta. Si el formulario está completo, arranca la búsqueda sin preguntar más.

---

### 💬 Nodo 3: `generate_response` — La Voz de Vora

**Archivo:** `app/agents/nodes/conversation_manager.py`
**Propósito:** Generar la respuesta en lenguaje natural para el usuario.

```
📥 Entrada: Estado actual + preguntas de clarificación
📤 Salida:  { messages: [{ role: "assistant", content: "..." }] }
```

**Dos modos de operación:**

1. **Modo Clarificación:** Cuando faltan datos, genera una respuesta amigable preguntando lo necesario
2. **Modo Confirmación:** Cuando todo está listo, resume la info y confirma antes de proceder

**Protecciones anti-repetición:**

Este nodo tiene múltiples capas de seguridad para NO repetir preguntas:

1. **Filtrado por keywords:** Si "destino" ya está definido, elimina cualquier pregunta que contenga palabras como "destino", "lugar", "ciudad", "dónde"
2. **Detección de frustración:** Si el usuario dice "ya te dije", "otra vez", "ya mencioné", el nodo se disculpa brevemente y avanza directamente

> 💡 **Analogía:** Es la personalidad de Vora — cálida, entusiasta, experta en Perú. Nunca repite preguntas y siempre reconoce lo que el usuario ya dijo.

---

### 📍 Nodo 4: `search_places` — El Explorador

**Archivo:** `app/agents/nodes/place_searcher.py`
**Propósito:** Buscar lugares turísticos relevantes usando Google Places API.

```
📥 Entrada: destination + travel_style + budget
📤 Salida:  { searched_places: [ { place_id, name, rating, location, photos, ... } ] }
```

**¿Cómo funciona?**

1. **Genera queries de búsqueda** según el estilo de viaje:
   - `cultural` → "museos", "sitios históricos", "galerías de arte"
   - `adventure` → "trekking", "actividades al aire libre"
   - `gastronomy` → "restaurantes típicos", "mercados gastronómicos"
   - Siempre agrega: "atracciones turísticas", "lugares imprescindibles"

2. **Busca en Google Places API** hasta 5 resultados por query

3. **Deduplica** (elimina repetidos por `place_id`)

4. **Rankea** los resultados con un algoritmo que pondera:
   - Rating del lugar (40%)
   - Relevancia al presupuesto (30%)
   - Coincidencia con el estilo de viaje (30%)

5. Retorna los **Top 30** lugares

> 💡 **Analogía:** Es un guía turístico local que conoce todos los rincones y te recomienda los mejores según tus gustos.

---

### ✈️ Nodo 5: `search_mobility` — El Agente de Transporte

**Archivo:** `app/agents/nodes/mobility_searcher.py`
**Propósito:** Buscar opciones de vuelos, buses y rutas en auto.

```
📥 Entrada: destination + start_date + travelers
📤 Salida:  { mobility_options: [MobilitySegment] }
```

**Tres búsquedas en paralelo:**

```
    ┌──────────────────────┐
    │  search_mobility     │
    └───────┬──────────────┘
            │
   ┌────────┼────────────┐
   │        │            │
   ▼        ▼            ▼
 Vuelos    Bus/         Auto
(Serper.  Transporte   (Google
  dev)    público      Routes
          (Google      API —
          Routes       DRIVE)
          API —
          TRANSIT)
```

1. **Vuelos:** Busca con Serper.dev (Google Search) y enriquece con:
   - **Deep links** de reserva por aerolínea (LATAM, Sky, JetSMART, etc.)
   - Logos de aerolíneas
   - Precios ordenados de menor a mayor

2. **Bus/Transporte público:** Google Routes API modo TRANSIT
   - Duración estimada
   - Detalles de líneas y agencias

3. **Auto:** Google Routes API modo DRIVE
   - Distancia en km
   - Duración estimada

**Resultado unificado (`MobilitySegment`):**

```python
{
    "origin": "Lima",
    "destination": "Cusco",
    "departure_date": "2026-03-15",
    "best_flight": { "provider": "LATAM", "price": 89, ... },
    "best_transit": { "duration_text": "22 horas", ... },
    "best_drive": { "duration_text": "20 horas", "distance_km": 1105, ... },
    "flight_options": [ ... ],  # Todas las opciones de vuelo
    "recommended_mode": "flight"  # Recomendación automática
}
```

> 💡 **Analogía:** Es como buscar en Kayak, Google Maps y un mapa de carreteras al mismo tiempo, pero todo automatizado y consolidado en una sola respuesta.

---

### 🏨 Nodo 6: `search_accommodation` — El Buscador de Hospedaje

**Archivo:** `app/agents/nodes/accommodation_searcher.py`
**Propósito:** Buscar opciones de alojamiento en Airbnb via Apify.

```
📥 Entrada: destination + start_date + days + budget_total + travelers
📤 Salida:  { accommodation_options: [AccommodationOption] }
```

**¿Cómo funciona?**

1. **Calcula fechas:** check_in = start_date, check_out = start_date + días
2. **Calcula presupuesto por noche:** Toma el 90% del presupuesto total y lo divide entre las noches
3. **Busca en Airbnb** (via Apify scraper) con filtros de precio, moneda y huéspedes
4. **Rankea por calidad:** Usa la fórmula `rating × log₁₀(reviews + 1)` para balancear calificación con popularidad
5. Retorna hasta **12 opciones**

**Cada opción incluye:**
- Nombre, tipo, fotos
- Precio por noche y total
- Rating y número de reseñas
- Badges ("Guest favorite", "Free cancellation")
- URL de reserva
- Coordenadas (para mostrar en el mapa)

> 💡 **Analogía:** Es como tener un asistente personal que busca en Airbnb por ti, filtra por tu presupuesto, y te ordena los resultados inteligentemente.

---

### 🗓️ Nodo 7: `build_itinerary` — El Arquitecto del Viaje

**Archivo:** `app/agents/nodes/itinerary_builder.py`
**Propósito:** Construir el itinerario completo día a día usando GPT-4o.

```
📥 Entrada: destination + days + budget + travel_style + searched_places 
            + mobility_options + accommodation_options
📤 Salida:  { itinerary: { title, description, day_plans, tips }, messages }
```

**Este es el nodo más complejo. Su proceso es:**

1. **Formato JSON forzado:** Le dice al LLM que responda SOLO en JSON válido (con `response_format: json_object`)

2. **Prompt experto:** Le da al LLM instrucciones detalladas:
   - Distribuir lugares por mañana / tarde / noche
   - Máximo 3-4 lugares por día
   - Considerar horarios realistas (8:00-13:00, 14:00-19:00, 19:00-23:00)
   - Agrupar lugares cercanos
   - Considerar clima y altitud (especialmente Cusco, Puno, Arequipa)

3. **Enriquecetimiento cascada (post-LLM):**
   - `_enrich_itinerary_with_place_data`: Inyecta fotos reales y datos de Google Places
   - `_inject_dates`: Stampa fechas de calendario en cada día
   - `_embed_mobility`: Adjunta vuelos/bus al primer día
   - `_embed_accommodation`: Adjunta opciones de hospedaje

4. **Parsing robusto de JSON:** Tiene 3 estrategias de fallback si el LLM genera JSON mal formateado:
   - Parseo directo
   - Limpieza de markdown (```json ... ```)
   - Extracción del primer objeto `{ ... }` del texto

**Estructura del itinerario generado:**

```json
{
  "title": "Aventura Cultural en Cusco — 5 Días",
  "description": "Un viaje que combina historia inca con gastronomía...",
  "day_plans": [
    {
      "day_number": 1,
      "date": "2026-03-15",
      "morning": [{ "name": "Plaza de Armas", "photos": [...], ... }],
      "afternoon": [{ "name": "Sacsayhuamán", ... }],
      "evening": [{ "name": "San Blas", ... }],
      "lunch_restaurants": [],
      "dinner_restaurants": [],
      "mobility": { ... },
      "accommodation": [ ... ],
      "notes": "Día de aclimatación a la altitud"
    }
  ],
  "tips": ["Bebe mate de coca para la altitud", ...]
}
```

> 💡 **Analogía:** Es el arquitecto que toma todos los materiales (lugares, vuelos, hoteles) y diseña un itinerario perfecto, como armar un rompecabezas donde cada pieza encaja lógicamente.

---

### 🍽️ Nodo 8: `search_restaurants` — El Crítico Gastronómico

**Archivo:** `app/agents/nodes/restaurant_searcher.py`
**Propósito:** Buscar restaurantes para almuerzo y cena de cada día del itinerario.

```
📥 Entrada: itinerary (con day_plans) + destination
📤 Salida:  { itinerary: (enriquecido con restaurantes), restaurant_recommendations }
```

**Lógica inteligente de proximidad:**

Para cada día del itinerario, busca restaurantes CERCA de donde el usuario estará:

**Almuerzo:**
1. ⭐ Radio 6km desde el ÚLTIMO lugar de la mañana
2. 🔄 Fallback: 4km desde el PRIMER lugar de la tarde
3. 🔄 Fallback final: 6km desde el centro del destino

**Cena:**
1. ⭐ Radio 4km desde el PRIMER lugar de la noche
2. 🔄 Fallback: 4km desde el alojamiento
3. 🔄 Fallback final: 4km desde el centro del destino

**Algoritmo de ranking:**

```
Score = (proximidad × 0.40) + (rating × 0.35) + (popularidad × 0.25)
```

- **Proximidad:** Qué tan cerca está del punto de referencia (1 = al lado, 0 = en el límite del radio)
- **Rating:** Calificación de Google (0-5, normalizada a 0-1)
- **Popularidad:** Número de reseñas / 1000 (max 1.0)

Selecciona los **2 mejores** por comida.

> 💡 **Analogía:** Es un foodie local que sabe exactamente dónde comer cerca de cada atracción que vas a visitar.

---

## 🔧 Fase 4: El Pipeline de Refinamiento

Cuando el usuario ya tiene un itinerario y quiere modificarlo, se activa el **pipeline de refinamiento** — un flujo especializado que re-ejecuta SOLO lo necesario.

### 🔬 Nodo 9: `extract_refinement_delta` — El Detective de Cambios

**Archivo:** `app/agents/nodes/refinement_delta.py`

```
📥 Entrada: Mensaje del usuario + estado actual + itinerario actual
📤 Salida:  { refinement_scope, campos cambiados }
```

El LLM analiza qué quiere cambiar el usuario y produce un "delta" (la diferencia):

| Ejemplo del usuario | Delta generado | Scope |
|---|---|---|
| "Cámbialo a Arequipa" | `{destination: "Arequipa"}` | `destination_changed` |
| "Quiero más aventura" | `{travel_style: ["adventure"]}` | `style_changed` |
| "Cambia las fechas al 20 de marzo" | `{start_date: "2026-03-20"}` | `dates_changed` |
| "Reduce a 3 días" | `{days: 3}` | `metadata_only` |

---

### 🔨 Nodo 10: `handle_refinement` — El Gestor de Reconstrucción

**Archivo:** `app/agents/nodes/refinement_handler.py`

Según el `scope`, decide QUÉ DATOS limpiar para forzar que se re-busquen:

```
    ┌──────────────────────────────────────────────────────────────────┐
    │                    SCOPE DE REFINAMIENTO                         │
    ├──────────────────┬───────────────────────────────────────────────┤
    │                  │  Limpia:       Limpia:      Limpia:   Limpia │
    │  Scope           │  places?       mobility?    accomm?   itin?  │
    ├──────────────────┼───────────────────────────────────────────────┤
    │ destination_     │    ✅            ✅           ✅         ✅    │
    │ changed          │   (todo se     (todo se     (todo se   (todo │
    │                  │    rehace)      rehace)      rehace)  rehace)│
    ├──────────────────┼───────────────────────────────────────────────┤
    │ style_changed    │    ✅            ❌           ❌         ✅    │
    │                  │  (nuevos       (reusar)     (reusar)  (nuevo)│
    │                  │   lugares)                                    │
    ├──────────────────┼───────────────────────────────────────────────┤
    │ dates_changed    │    ❌            ✅           ✅         ✅    │
    │                  │  (reusar)     (nuevos       (nuevos   (nuevo)│
    │                  │               vuelos)      hoteles)          │
    ├──────────────────┼───────────────────────────────────────────────┤
    │ metadata_only    │    ❌            ❌           ❌         ✅    │
    │                  │  (reusar)     (reusar)     (reusar) (rebuild │
    │                  │                                     con      │
    │                  │                                     nuevos   │
    │                  │                                     params)  │
    └──────────────────┴───────────────────────────────────────────────┘
```

**La clave:** Solo se re-ejecutan los nodos necesarios. Si cambias de "5 a 3 días", NO se vuelven a buscar vuelos ni hoteles — solo se reconstruye el itinerario con menos días.

> 💡 **Analogía:** Si redecoras una habitación, no necesitas demoler toda la casa. Solo cambias lo que toca.

---

## 📊 El Estado Compartido (TravelState)

**Archivo:** `app/agents/state.py`

El `TravelState` es la **memoria RAM** del agente. Todos los nodos leen y escriben en él. Aquí están sus secciones principales:

### Conversación
```python
messages: List[Message]          # Historial completo del chat
```

### Intención
```python
intent: "new_trip" | "refine" | "question" | "clarify"
```

### Preferencias del usuario
```python
destination: str                 # "Cusco"
days: int                        # 5
start_date: date                 # 2026-03-15
end_date: date                   # 2026-03-20
budget_total: int                # 3000
budget: "low" | "medium" | "high"
travel_style: List[str]          # ["cultural", "adventure"]
travelers: int                   # 2
currency: str                    # "PEN"
```

### Flags de widgets
```python
missing_dates: bool              # ¿El frontend debe mostrar widget de fechas?
missing_budget: bool             # ¿El frontend debe mostrar widget de presupuesto?
```

### Datos de búsqueda
```python
searched_places: List[PlaceInfo]              # Lugares de Google Places
mobility_options: List[MobilitySegment]       # Vuelos, buses, autos
accommodation_options: List[AccommodationOption]  # Airbnbs
restaurant_recommendations: List[RestaurantRecommendation]  # Restaurantes
```

### Itinerario
```python
itinerary: Dict                  # El itinerario completo generado
day_plans: List[DayPlan]         # Plan día a día
```

### Control de refinamiento
```python
refinement_scope: str            # Qué debe re-ejecutarse
previous_itinerary: Dict         # Snapshot del itinerario antes de refinar
```

### Control de flujo
```python
needs_clarification: bool        # ¿Necesitar preguntar algo al usuario?
clarification_questions: List    # Las preguntas a hacer
iteration_count: int             # Contador para evitar loops infinitos
max_iterations: int              # Límite de seguridad (10)
```

---

## 🌐 APIs Externas y Servicios

Vora se conecta a múltiples servicios para obtener datos reales:

```
                        ┌──────────────────────────────────┐
                        │           Vora Backend           │
                        └──────────────┬───────────────────┘
                                       │
            ┌────────────┬─────────────┼─────────────┬──────────────┐
            │            │             │             │              │
            ▼            ▼             ▼             ▼              ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ OpenAI   │  │ Google   │  │ Google   │  │ Serper   │  │  Apify   │
    │ GPT-4o   │  │ Places   │  │ Routes   │  │   .dev   │  │ (Airbnb) │
    │          │  │   API    │  │   API    │  │          │  │          │
    │ LLM para │  │ Lugares, │  │ Rutas de │  │ Búsqueda │  │ Scraping │
    │ entender │  │ fotos,   │  │ bus y    │  │ de       │  │ de       │
    │ y generar│  │ ratings, │  │ auto     │  │ vuelos   │  │ listings │
    │ texto    │  │ coords   │  │          │  │          │  │ Airbnb   │
    └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
         │              │             │             │              │
         │              │             │             │              │
         ▼              ▼             ▼             ▼              ▼
    Clasificar     Buscar         Calcular     Encontrar      Buscar
    intención,     lugares        tiempos de   vuelos con     hospedaje
    extraer        turísticos     viaje por    precios y      con precios,
    preferencias,  y restaur-     carretera    horarios       fotos y
    construir      antes          y bus                       reseñas
    itinerario

```

| Servicio | Se usa en | ¿Para qué? |
|---|---|---|
| **OpenAI GPT-4o** | `intent_classifier`, `preference_extractor`, `conversation_manager`, `itinerary_builder`, `refinement_delta` | Entender lenguaje natural, clasificar intenciones, generar itinerarios y respuestas |
| **Google Places API** | `place_searcher`, `restaurant_searcher` | Buscar lugares turísticos y restaurantes con fotos, ratings y coordenadas |
| **Google Routes API** | `mobility_searcher` | Calcular rutas en bus/transporte público y auto con tiempos y distancias |
| **Serper.dev** | `mobility_searcher` | Buscar vuelos domésticos con precios y horarios |
| **Apify** | `accommodation_searcher` | Scrapear listados de Airbnb con precios, fotos, reviews |
| **Supabase** | `chat.py`, persistencia | Guardar conversaciones, itinerarios y datos de usuarios |

---

## 🔁 Ejemplo Completo: Un Viaje Paso a Paso

Veamos qué pasa cuando un usuario interactúa con Vora:

### Turno 1: "Quiero viajar a Cusco"

```
1. POST /api/v1/chat → { message: "Quiero viajar a Cusco" }
2. classify_intent → "new_trip" (primera interacción)
3. extract_preferences → destination: "Cusco", days: null, budget: null
   → needs_clarification: true (faltan días, fechas, presupuesto)
4. generate_response → "¡Cusco es una ciudad mágica! 🏔️
   Para armar tu viaje perfecto cuéntame:
   **¿Cuántos días tienes disponibles?**
   **¿Cuándo planeas viajar?**"
5. → FIN (devuelve respuesta con missing_dates: true, missing_budget: true)
   → El frontend muestra widgets de fecha y presupuesto
```

### Turno 2: "5 días" + widget de fechas (15-20 marzo) + widget de presupuesto (S/3000)

```
1. POST /api/v1/chat → { message: "5 días", check_in: "2026-03-15", 
                          check_out: "2026-03-20", budget_total: 3000 }
2. classify_intent → "clarify" (ya tiene destino, está dando más info)
3. extract_preferences → days: 5, start_date: 2026-03-15, budget_total: 3000
   → GUARDIA: ¡destination + days + dates + budget completos!
   → needs_clarification: false ✅
4. search_places → 30 lugares turísticos en Cusco (museos, miradores, ruinas...)
5. search_mobility → Vuelos Lima→Cusco ($89 LATAM, $65 Sky, $55 JetSMART)
                     + Bus (22 horas) + Auto (20 horas, 1105 km)
6. search_accommodation → 12 Airbnbs en Cusco (S/80-S/350/noche)
7. build_itinerary → Itinerario completo de 5 días con GPT-4o
   → Inyecta fotos, fechas, vuelos y hoteles
8. search_restaurants → 2 restaurantes por comida × 5 días = 20 restaurantes
9. → FIN (devuelve itinerario completo + mensaje)
```

### Turno 3: "Cambia a 3 días"

```
1. POST /api/v1/chat → { message: "Cambia a 3 días" }
2. classify_intent → "refine" (ya tiene itinerario)
3. extract_refinement_delta → { days: 3, scope: "metadata_only" }
4. handle_refinement → Limpia solo el itinerario (preserva places, vuelos, hoteles)
5. build_itinerary → Reconstruye con 3 días usando los mismos datos
6. search_restaurants → Nuevos restaurantes para 3 días
7. → FIN (itinerario actualizado a 3 días)
```

---

## 🛡️ Mecanismos de Seguridad y Robustez

| Mecanismo | ¿Dónde? | ¿Para qué? |
|---|---|---|
| **Límite de iteraciones** | `graph.py` | Evitar loops infinitos (máx 10) |
| **Guardia programática** | `preference_extractor.py` | No depender solo del LLM para decidir si proceder |
| **Filtrado de preguntas** | `conversation_manager.py` | Nunca repetir preguntas ya respondidas |
| **Detección de frustración** | `conversation_manager.py` | Detectar "ya te dije" y adaptarse |
| **Fallback del LLM** | Todos los nodos | Si el LLM falla, usar heurísticas simples |
| **JSON parsing robusto** | `itinerary_builder.py` | 3 estrategias para parsear JSON del LLM |
| **Rate limiting** | `main.py` | Limitar peticiones por minuto |
| **Autenticación** | `dependencies.py` | Verificar identidad del usuario (Supabase Auth) |

---

## 📝 Resumen Ejecutivo

**Vora es un agente de viajes IA** que funciona como una cadena de especialistas, donde cada uno hace su trabajo y pasa el resultado al siguiente:

1. **Recepcionista** (classify_intent) → ¿Qué quiere el usuario?
2. **Entrevistador** (extract_preferences) → ¿Qué datos tenemos?
3. **Voz** (generate_response) → Responder si falta algo
4. **Explorador** (search_places) → Buscar lugares increíbles
5. **Agente de transporte** (search_mobility) → ¿Cómo llegar?
6. **Buscador de hospedaje** (search_accommodation) → ¿Dónde dormir?
7. **Arquitecto** (build_itinerary) → Armar el plan perfecto
8. **Crítico gastronómico** (search_restaurants) → ¿Dónde comer?

Todo esto orquestado por un **grafo dirigido** (LangGraph) que decide el camino óptimo según la intención del usuario, con múltiples capas de protección para garantizar respuestas de calidad.
