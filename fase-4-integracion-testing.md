## Fase 4: Integración y Testing (Semana 9-10)

### 4.1 Integración Frontend-Backend

**Día 49-52: Conexión Completa**

- [ ] Configurar cliente API en frontend
- [ ] Implementar custom hooks para llamadas API
- [ ] Agregar React Query para caché y sincronización
- [ ] Implementar manejo de errores global
- [ ] Agregar loading states en todas las acciones
- [ ] Configurar interceptores de autenticación
- [ ] Testear flujo completo end-to-end

```typescript
// src/lib/api/client.ts
import axios from 'axios';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
apiClient.interceptors.request.use(async (config) => {
  const supabase = createClientComponentClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  return config;
});

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirigir a login
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

```typescript
// src/hooks/useChat.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import apiClient from '@/lib/api/client';
import type { ChatRequest, ChatResponse, Message } from '@/types/chat';

export function useChat(initialThreadId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadId, setThreadId] = useState<string | undefined>(initialThreadId);
  const queryClient = useQueryClient();

  const { mutate: sendMessage, isLoading } = useMutation({
    mutationFn: async (content: string) => {
      const request: ChatRequest = {
        message: content,
        thread_id: threadId,
        save_conversation: true,
      };

      const response = await apiClient.post<ChatResponse>('/chat', request);
      return response.data;
    },
    onMutate: (content) => {
      // Optimistic update
      const userMessage: Message = {
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);
    },
    onSuccess: (data) => {
      setThreadId(data.thread_id);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        itinerary: data.itinerary,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Invalidar cache de itinerarios si se creó uno nuevo
      if (data.itinerary) {
        queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      }
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      // Mostrar toast de error
    },
  });

  return {
    messages,
    isLoading,
    sendMessage,
    threadId,
  };
}
```

### 4.2 Testing Completo

**Día 53-56: Suite de Tests**

- [ ] Tests E2E con Playwright o Cypress
- [ ] Tests de integración de flujos críticos
- [ ] Tests de accesibilidad (a11y)
- [ ] Tests de rendimiento (Lighthouse)
- [ ] Tests de responsive design
- [ ] Tests de i18n
- [ ] Tests de seguridad básicos

```typescript
// tests/e2e/chat-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/chat');
  });

  test('should create a new itinerary from chat', async ({ page }) => {
    // Enviar mensaje
    const input = page.locator('[data-testid="chat-input"]');
    await input.fill('Quiero ir a Cusco 5 días con presupuesto medio');
    await input.press('Enter');

    // Esperar respuesta del agente
    await expect(page.locator('[data-testid="typing-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="typing-indicator"]')).not.toBeVisible({ timeout: 30000 });

    // Verificar que se generó un itinerario
    await expect(page.locator('[data-testid="itinerary-card"]')).toBeVisible();
    await expect(page.locator('text=Cusco')).toBeVisible();
  });

  test('should display suggested prompts for new users', async ({ page }) => {
    await expect(page.locator('[data-testid="suggested-prompt"]')).toHaveCount(4);
  });
});
```

### 4.3 Optimización y Performance

**Día 57-60: Mejoras de Performance**

- [ ] Implementar code splitting en frontend
- [ ] Optimizar imágenes con next/image
- [ ] Agregar caché de Google Places API
- [ ] Implementar rate limiting más granular
- [ ] Optimizar queries de base de datos
- [ ] Agregar índices en Supabase
- [ ] Implementar lazy loading de componentes
- [ ] Analizar y reducir bundle size

**Deliverables de Fase 4:**
- ✅ Integración completa frontend-backend
- ✅ Suite de tests con cobertura >80%
- ✅ Performance optimizado (Lighthouse >90)
- ✅ Manejo robusto de errores
- ✅ Documentación de API actualizada

---