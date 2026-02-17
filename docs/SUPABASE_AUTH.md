# Autenticación con Supabase en Vora

## Cambio Importante: JWT con ECC P-256

Supabase migró de un sistema de secreto compartido (`SUPABASE_JWT_SECRET`) a criptografía asimétrica moderna usando **ECC P-256** (Elliptic Curve Cryptography).

### ¿Qué significa esto?

**Antes (sistema antiguo):**
- Supabase usaba un secreto compartido (HMAC) para firmar JWT
- Necesitabas configurar `SUPABASE_JWT_SECRET` en tu backend
- El mismo secreto se usaba para firmar y verificar tokens

**Ahora (sistema moderno):**
- Supabase usa **claves públicas/privadas** (ECC P-256)
- La clave privada permanece en Supabase (nunca se expone)
- La clave pública se usa automáticamente para verificar tokens
- **No necesitas configurar ningún secreto JWT**

### Ventajas del nuevo sistema

1. **Mayor seguridad**: La clave privada nunca sale de Supabase
2. **Más simple**: No necesitas gestionar secretos adicionales
3. **Estándar moderno**: ECC P-256 es el estándar de la industria
4. **Verificación automática**: El cliente de Supabase maneja todo

## Configuración en Vora

### Backend (.env.local)

```env
# Solo necesitas estas dos variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# NO necesitas:
# SUPABASE_JWT_SECRET=... ❌
```

### Cómo funciona la autenticación

1. **Login del usuario**:
   ```python
   response = supabase.auth.sign_in_with_password({
       "email": email,
       "password": password
   })
   # response.session.access_token contiene el JWT firmado con ECC P-256
   ```

2. **Verificación automática**:
   ```python
   # El cliente de Supabase verifica automáticamente el JWT
   user = supabase.auth.get_user(token)
   # Si el token es válido, retorna el usuario
   # Si es inválido, lanza una excepción
   ```

3. **En los endpoints protegidos**:
   ```python
   from app.core.dependencies import get_current_user
   
   @router.get("/protected")
   async def protected_route(
       current_user: dict = Depends(get_current_user)
   ):
       # current_user contiene los datos del usuario verificado
       return {"user_id": current_user["id"]}
   ```

## Flujo de Autenticación

```
┌─────────┐                 ┌──────────┐                ┌──────────┐
│ Cliente │                 │  Backend │                │ Supabase │
└────┬────┘                 └────┬─────┘                └────┬─────┘
     │                           │                           │
     │ 1. Login (email/pass)     │                           │
     ├──────────────────────────>│                           │
     │                           │ 2. Verificar credenciales │
     │                           ├──────────────────────────>│
     │                           │                           │
     │                           │ 3. JWT firmado (ECC P-256)│
     │                           │<──────────────────────────┤
     │ 4. JWT al cliente         │                           │
     │<──────────────────────────┤                           │
     │                           │                           │
     │ 5. Request + JWT          │                           │
     ├──────────────────────────>│                           │
     │                           │ 6. Verificar JWT          │
     │                           ├──────────────────────────>│
     │                           │ 7. Usuario válido         │
     │                           │<──────────────────────────┤
     │ 8. Respuesta              │                           │
     │<──────────────────────────┤                           │
```

## Implementación en Vora

### 1. Cliente Supabase (backend/app/services/supabase_client.py)

```python
from supabase import create_client, Client

def get_supabase_client() -> Client:
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_KEY
    )
    # La verificación JWT es automática
```

### 2. Dependency para rutas protegidas (backend/app/core/dependencies.py)

```python
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    token = credentials.credentials
    
    # Supabase verifica automáticamente el JWT con ECC P-256
    supabase = get_supabase_client()
    user = supabase.auth.get_user(token)
    
    return {"id": user.id, "email": user.email}
```

### 3. Endpoints de autenticación (backend/app/api/v1/endpoints/auth.py)

```python
@router.post("/login")
async def login(credentials: UserLogin):
    response = supabase.auth.sign_in_with_password({
        "email": credentials.email,
        "password": credentials.password
    })
    
    return {
        "access_token": response.session.access_token,
        "token_type": "bearer",
        "expires_in": response.session.expires_in
    }
```

## Migración desde el sistema antiguo

Si tienes código antiguo que usaba `SUPABASE_JWT_SECRET`:

### ❌ Antes (NO usar)
```python
import jwt

# Verificación manual con secreto compartido
payload = jwt.decode(
    token, 
    settings.SUPABASE_JWT_SECRET, 
    algorithms=["HS256"]
)
```

### ✅ Ahora (usar esto)
```python
# Verificación automática con ECC P-256
supabase = get_supabase_client()
user = supabase.auth.get_user(token)
# Supabase maneja la verificación internamente
```

## Preguntas Frecuentes

**P: ¿Necesito actualizar algo en mi proyecto Supabase?**
R: No, Supabase ya usa ECC P-256 por defecto en todos los proyectos nuevos.

**P: ¿Qué pasa con los tokens antiguos?**
R: Supabase mantiene compatibilidad. Los tokens nuevos usan ECC P-256.

**P: ¿Puedo ver la clave pública?**
R: Sí, está en Settings > API > JWT Settings en tu proyecto Supabase.

**P: ¿Necesito configurar algo especial?**
R: No, solo `SUPABASE_URL` y `SUPABASE_KEY`. Todo lo demás es automático.

**P: ¿Cómo genero el SECRET_KEY para mi backend?**
R: Es para sesiones internas (no relacionado con Supabase):
```python
import secrets
print(secrets.token_urlsafe(32))
```

## Referencias

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [JWT with ECC P-256](https://datatracker.ietf.org/doc/html/rfc7518#section-3.4)
- [Supabase Python Client](https://github.com/supabase-community/supabase-py)

---

**Última actualización**: 2024-01-01
**Versión de Supabase**: 2.x+
