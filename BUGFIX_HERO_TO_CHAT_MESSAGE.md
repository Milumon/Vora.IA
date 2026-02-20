# Bugfix: Mensaje del HeroSection no se enviaba al Chat

## Problema
Cuando un usuario autenticado escribía un mensaje en el HeroSection (landing page) y presionaba "Planifica mi viaje", el mensaje no se enviaba al backend en la página de chat.

## Causa Raíz
El flujo tenía múltiples problemas:

1. Usuario autenticado escribía en HeroSection
2. `handleSubmit` detectaba que había `user` (autenticado)
3. **Limpiaba localStorage** y llamaba `onSendMessage(trimmed)`
4. `onSendMessage` en page.tsx solo hacía `router.push()` sin pasar el mensaje
5. ChatPage no tenía forma de saber qué mensaje enviar
6. El `useEffect` en ChatPage tenía dependencias que causaban re-ejecuciones innecesarias

## Solución Implementada

### 1. HeroSection.tsx
**Cambio:** Ahora SIEMPRE guarda el mensaje en localStorage antes de navegar, independientemente del estado de autenticación. Agregados logs detallados para debugging.

```typescript
// ANTES (usuario autenticado):
localStorage.removeItem(VORA_PENDING_MESSAGE_KEY);
setDraftText('');
onSendMessage(trimmed); // Solo navegaba, mensaje se perdía

// DESPUÉS (usuario autenticado):
console.log('✅ User authenticated, saving to localStorage');
localStorage.setItem(VORA_PENDING_MESSAGE_KEY, trimmed);
console.log('💾 Saved to localStorage:', localStorage.getItem(VORA_PENDING_MESSAGE_KEY));
setDraftText('');
console.log('🚀 Navigating to chat page...');
router.push(`/${locale}/chat`);
```

### 2. ChatPage.tsx
**Cambio:** Refactorizado completamente el manejo del mensaje pendiente usando dos `useEffect` separados con responsabilidades claras:

1. **Primer useEffect (mount):** Lee localStorage una sola vez al montar
2. **Segundo useEffect (send):** Espera autenticación y envía el mensaje

```typescript
// Estado para controlar el mensaje pendiente
const [pendingMessage, setPendingMessage] = useState<string | null>(null);
const pendingMessageSentRef = useRef(false);

// 1. Cargar mensaje de localStorage al montar (solo una vez)
useEffect(() => {
  if (typeof window === 'undefined') return;
  if (pendingMessageSentRef.current) return;
  
  const pending = localStorage.getItem('vora_pending_message');
  if (pending) {
    setPendingMessage(pending);
    localStorage.removeItem('vora_pending_message');
  }
}, []); // Sin dependencias - solo al montar

// 2. Enviar mensaje cuando esté listo
useEffect(() => {
  if (!pendingMessage || pendingMessageSentRef.current || !user) return;
  
  pendingMessageSentRef.current = true;
  const timer = setTimeout(() => {
    sendMessage(pendingMessage);
    setPendingMessage(null);
  }, 300);
  
  return () => clearTimeout(timer);
}, [pendingMessage, user, sendMessage]);
```

**Ventajas de esta solución:**
- Separación clara de responsabilidades
- El primer useEffect solo se ejecuta una vez al montar
- El segundo useEffect solo se ejecuta cuando cambian las condiciones necesarias
- Uso de `ref` para prevenir envíos duplicados
- Logs detallados para debugging

## Flujo Completo Corregido

### Usuario Autenticado:
1. Escribe mensaje en HeroSection
2. Presiona "Planifica mi viaje"
3. Mensaje se guarda en localStorage (con log)
4. Navega a `/chat`
5. ChatPage monta y lee localStorage (primer useEffect)
6. Guarda mensaje en estado `pendingMessage`
7. Limpia localStorage inmediatamente
8. Segundo useEffect detecta `pendingMessage` y `user`
9. Envía mensaje automáticamente al backend
10. Limpia estado `pendingMessage`

### Usuario No Autenticado:
1. Escribe mensaje en HeroSection
2. Presiona "Planifica mi viaje"
3. Mensaje se guarda en localStorage
4. Redirige a `/auth/login?returnTo=/`
5. Usuario inicia sesión
6. Vuelve a landing page
7. Mensaje se restaura en el input (para confirmación)
8. Usuario presiona enviar nuevamente
9. Flujo de usuario autenticado continúa

## Debugging
Con los logs agregados, en la consola del navegador verás:

**En HeroSection:**
```
🎯 HeroSection handleSubmit called with: [mensaje]
   - isLoading: false
   - user: authenticated
✅ User authenticated, saving to localStorage
💾 Saved to localStorage: [mensaje]
🚀 Navigating to chat page...
```

**En ChatPage:**
```
🔍 [Mount] Checking for pending message: [mensaje]
✅ [Mount] Found pending message, setting state
🚀 [Send] All conditions met, sending message: [mensaje]
📤 [Send] Executing sendMessage now...
```

## Archivos Modificados
- `frontend/src/components/landing/sections/HeroSection.tsx`
- `frontend/src/app/[locale]/chat/page.tsx`

## Testing
Para verificar el fix:
1. Iniciar sesión
2. Ir a la landing page (/)
3. Abrir DevTools Console
4. Escribir un mensaje en el input del hero
5. Presionar "Planifica mi viaje"
6. Verificar logs en consola
7. Verificar que el mensaje se envía automáticamente en /chat
8. Verificar que aparece en el chat y se procesa por el backend
