# Implementación: Integración de Chat con Mapa Interactivo

## Estado: ✅ Implementado (Requiere instalación de dependencias)

## Resumen

Se ha implementado exitosamente el sistema de transición suave del chat conversacional a un layout de dos columnas (chat + mapa interactivo) cuando el agente genera un itinerario completo.

## Archivos Creados

### Frontend

1. **`frontend/src/components/chat/ItinerarySummaryCard.tsx`**
   - Muestra el resumen del itinerario en el chat
   - Tarjetas colapsables por día
   - Fotos en miniatura de lugares
   - Botones de acción (Guardar, Compartir, Hacer Ajustes)
   - Click en lugar centra el mapa

2. **`frontend/src/components/map/InteractiveMapView.tsx`**
   - Mapa de Google Maps con marcadores interactivos
   - Marcadores personalizados por día (colores diferentes)
   - Líneas conectando lugares en orden cronológico
   - Popups con información del lugar
   - Zoom automático para mostrar todos los lugares

3. **`docs/plans/2025-02-17-chat-map-integration-design.md`**
   - Documento de diseño completo aprobado

## Archivos Modificados

### Frontend

1. **`frontend/src/store/chatStore.ts`**
   - Agregados tipos: `Itinerary`, `DayPlan`, `PlaceInfo`
   - Nuevos estados: `generatedItinerary`, `showMapView`, `selectedPlace`
   - Nuevas acciones: `setGeneratedItinerary`, `updateItinerary`, `setSelectedPlace`, `resetMapView`

2. **`frontend/src/hooks/useChat.ts`**
   - Detecta cuando el backend devuelve un itinerario
   - Llama a `setGeneratedItinerary` automáticamente
   - Expone `generatedItinerary`, `showMapView`, `selectedPlace`

3. **`frontend/src/components/chat/ChatInterface.tsx`**
   - Renderiza `ItinerarySummaryCard` cuando hay itinerario
   - Maneja click en lugares para centrar mapa
   - Implementa guardar y compartir itinerario
   - Placeholder del input cambia cuando hay itinerario

4. **`frontend/src/app/[locale]/chat/page.tsx`**
   - Layout condicional: 1 columna vs 2 columnas
   - Animación CSS para transición suave
   - Responsive: oculta mapa en móvil

5. **`frontend/src/app/globals.css`**
   - Agregadas animaciones `slide-in-left` y `slide-in-right`

## Instalación de Dependencias

### Paso 1: Instalar @react-google-maps/api

```bash
cd frontend
npm install @react-google-maps/api
```

### Paso 2: Verificar Variables de Entorno

Asegúrate de que `frontend/.env.local` tenga:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
```

### Paso 3: Habilitar APIs en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Habilita las siguientes APIs:
   - Maps JavaScript API
   - Places API
   - Places API (New) - para fotos

## Flujo de Funcionamiento

### 1. Conversación Inicial
- Usuario inicia conversación
- Agente hace preguntas de validación progresivas
- Usuario proporciona toda la información necesaria

### 2. Generación del Itinerario
- Agente llama a Google Places API para buscar lugares
- Construye itinerario día por día
- Backend devuelve objeto `itinerary` en la respuesta

### 3. Transición a Vista de Mapa
- Frontend detecta `itinerary` en la respuesta
- `setGeneratedItinerary(itinerary)` activa `showMapView = true`
- Página renderiza layout de dos columnas con animación

### 4. Interacción con el Mapa
- Usuario puede hacer clic en lugares en el resumen
- Mapa se centra en el lugar seleccionado
- Popup muestra información detallada
- Usuario puede seguir conversando para hacer ajustes

### 5. Refinamiento
- Usuario escribe: "Cambia el día 2 por algo más relajado"
- Agente procesa y devuelve itinerario actualizado
- Frontend actualiza el mapa con animación

## Estructura del Itinerario (Backend)

El backend debe devolver este formato en `ChatResponse`:

```typescript
interface ChatResponse {
  message: string;
  thread_id: string;
  itinerary?: {
    title: string;
    description: string;
    day_plans: Array<{
      day_number: number;
      date?: string | null;
      morning: PlaceInfo[];
      afternoon: PlaceInfo[];
      evening: PlaceInfo[];
      notes: string;
    }>;
    tips: string[];
    estimated_budget: string;
  };
  needs_clarification: boolean;
  clarification_questions: string[];
}

interface PlaceInfo {
  place_id: string;
  name: string;
  address: string;
  rating?: number;
  price_level?: number;
  types: string[];
  photos: string[];  // URLs de fotos de Google Places
  location: { lat: number; lng: number };
  visit_duration?: string;
  why_visit?: string;
}
```

## Características Implementadas

✅ Transición suave de chat simple a chat+mapa
✅ Marcadores personalizados por día (colores diferentes)
✅ Líneas conectando lugares en orden cronológico
✅ Popups interactivos con información del lugar
✅ Click en lugar en resumen centra el mapa
✅ Tarjetas colapsables por día
✅ Botones de acción (Guardar, Compartir, Hacer Ajustes)
✅ Animaciones CSS suaves
✅ Responsive (oculta mapa en móvil)
✅ Zoom automático para mostrar todos los lugares
✅ Leyenda de colores por día

## Características Pendientes

⏳ Implementar sistema de toasts para notificaciones
⏳ Agregar tabs en móvil para alternar entre chat y mapa
⏳ Implementar funcionalidad de compartir completa
⏳ Agregar exportar a PDF
⏳ Implementar clustering de marcadores para itinerarios largos
⏳ Agregar rutas de transporte reales (Directions API)
⏳ Implementar caché de mapas para mejor performance

## Testing

### Prueba Manual

1. Inicia el backend:
```bash
cd backend
python -m uvicorn app.main:app --reload
```

2. Inicia el frontend:
```bash
cd frontend
npm run dev
```

3. Ve a `http://localhost:3000/chat`

4. Envía un mensaje: "Quiero viajar a Cusco 5 días con presupuesto medio"

5. Responde a las preguntas del agente

6. Cuando el agente genere el itinerario, deberías ver:
   - El chat se reduce al 50% del ancho
   - El mapa aparece en el lado derecho con animación
   - Marcadores de colores en el mapa
   - Líneas conectando los lugares
   - Resumen del itinerario en el chat

7. Haz clic en un lugar en el resumen:
   - El mapa debe centrarse en ese lugar
   - El marcador debe hacer bounce
   - El popup debe abrirse

8. Escribe un refinamiento: "Cambia el día 2 por algo más relajado"
   - El agente debe procesar el cambio
   - El mapa debe actualizarse

### Casos de Prueba

**Caso 1: Itinerario de 3 días**
- Input: "Quiero ir a Lima 3 días"
- Esperado: Mapa muestra 3 colores diferentes, líneas conectando lugares

**Caso 2: Itinerario largo (7+ días)**
- Input: "Quiero recorrer Perú 10 días"
- Esperado: Mapa hace zoom out para mostrar todos los lugares

**Caso 3: Refinamiento**
- Input inicial: "Cusco 5 días"
- Refinamiento: "Agrega más actividades de aventura"
- Esperado: Mapa se actualiza con nuevos marcadores

**Caso 4: Responsive**
- Abre en móvil
- Esperado: Solo se muestra el chat, el mapa está oculto

## Troubleshooting

### Problema: El mapa no aparece

**Solución:**
1. Verifica que `@react-google-maps/api` esté instalado
2. Verifica que `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` esté configurado
3. Verifica que Maps JavaScript API esté habilitada en Google Cloud Console
4. Abre la consola del navegador para ver errores

### Problema: Los marcadores no tienen colores

**Solución:**
- Verifica que `google.maps` esté cargado antes de renderizar marcadores
- Revisa la consola para errores de Google Maps API

### Problema: Las fotos de lugares no se muestran

**Solución:**
1. Verifica que Places API esté habilitada
2. Asegúrate de que el backend esté devolviendo URLs de fotos válidas
3. Verifica que las URLs tengan el formato correcto de Google Places Photos API

### Problema: El layout no se anima

**Solución:**
- Verifica que las clases CSS `animate-slide-in-left` y `animate-slide-in-right` estén en `globals.css`
- Asegúrate de que Tailwind esté procesando las animaciones personalizadas

## Próximos Pasos

1. **Instalar dependencias:**
   ```bash
   cd frontend
   npm install @react-google-maps/api
   ```

2. **Probar el flujo completo** siguiendo las instrucciones de testing

3. **Implementar características pendientes** según prioridad

4. **Optimizar performance:**
   - Implementar lazy loading de imágenes
   - Agregar caché de mapas
   - Implementar virtualización para itinerarios largos

5. **Mejorar UX:**
   - Agregar tabs en móvil
   - Implementar sistema de toasts
   - Agregar más animaciones

## Notas Adicionales

- El diseño prioriza la experiencia fluida sobre la complejidad técnica
- Reutiliza componentes existentes donde sea posible
- Mantiene consistencia con el diseño actual de la aplicación
- Escalable para futuras funcionalidades (compartir, exportar PDF, etc.)

## Contacto y Soporte

Si encuentras algún problema durante la implementación, revisa:
1. Los logs del backend para errores de API
2. La consola del navegador para errores de JavaScript
3. El documento de diseño en `docs/plans/2025-02-17-chat-map-integration-design.md`
