# Bugfix: Redirección al Login en Chat

## Problema
Al intentar enviar un mensaje en `/chat`, el usuario era redirigido automáticamente al login a pesar de estar autenticado.

## Causa Raíz
El sistema tenía dos problemas principales:

1. **Frontend (`frontend/src/lib/api/client.ts`)**:
   - El interceptor de axios buscaba un token en `localStorage` con la clave `access_token`
   - Supabase no guarda el token con ese nombre, usa su propio sistema de sesiones
   - El token nunca se enviaba en las peticiones al backend

2. **Backend (`backend/app/core/dependencies.py`)**:
   - Intentaba decodificar el token JWT usando el `SECRET_KEY` local
   - Los tokens de Supabase están firmados con el JWT secret de Supabase
   - La validación fallaba siempre, retornando 401 Unauthorized

## Solución Implementada

### Frontend
Actualizado `frontend/src/lib/api/client.ts`:
- Ahora usa `createClientComponentClient()` de Supabase
- Obtiene el token de sesión directamente de Supabase con `getSession()`
- Envía el token correcto en el header `Authorization`
- Verifica la sesión antes de redirigir en errores 401

```typescript
// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const supabase = createClientComponentClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  }
);
```

### Backend
Actualizado `backend/app/core/dependencies.py`:
- Ahora usa el cliente de Supabase para validar tokens
- Llama a `supabase.auth.get_user(token)` para verificar el token
- Retorna la información del usuario directamente de Supabase
- Maneja correctamente la estructura de respuesta de Supabase

```python
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase = Depends(get_supabase_client)
) -> dict:
    token = credentials.credentials
    response = supabase.auth.get_user(token)
    
    if not response or not hasattr(response, 'user') or not response.user:
        raise HTTPException(status_code=401)
    
    return {
        "id": response.user.id,
        "email": response.user.email
    }
```

### Corrección de Trailing Slash
Actualizado endpoints en `backend/app/api/v1/endpoints/`:
- Cambiado `@router.post("/")` a `@router.post("")` en chat.py
- Cambiado `@router.post("/")` a `@router.post("")` en itineraries.py
- Esto evita redirecciones 307 innecesarias

## Archivos Modificados

1. `frontend/src/lib/api/client.ts` - Cliente API con autenticación Supabase
2. `backend/app/core/dependencies.py` - Validación de tokens con Supabase
3. `backend/app/api/v1/endpoints/chat.py` - Corrección de trailing slash
4. `backend/app/api/v1/endpoints/itineraries.py` - Corrección de trailing slash
5. `frontend/src/components/layout/Header.tsx` - Correcciones menores de tipos

## Pruebas Recomendadas

1. Login con email/password
2. Enviar mensaje en el chat
3. Verificar que no hay redirección
4. Verificar que el mensaje se procesa correctamente
5. Logout y verificar que sí redirige al login

## Notas Adicionales

- El sistema ahora usa completamente la autenticación de Supabase
- No se necesita mantener tokens en localStorage
- La sesión se maneja automáticamente por Supabase
- Los tokens se refrescan automáticamente cuando expiran
