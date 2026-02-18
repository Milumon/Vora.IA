"""
Script de diagnóstico para el endpoint de chat
"""
import asyncio
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.supabase_client import get_supabase_client
from app.core.dependencies import get_current_user
from fastapi.security import HTTPAuthorizationCredentials

async def test_supabase_auth():
    """Prueba la autenticación con Supabase"""
    
    print("=" * 60)
    print("DIAGNÓSTICO DE AUTENTICACIÓN SUPABASE")
    print("=" * 60)
    
    # 1. Verificar cliente de Supabase
    print("\n1. Verificando cliente de Supabase...")
    try:
        supabase = get_supabase_client()
        print("✅ Cliente de Supabase creado correctamente")
        print(f"   URL: {supabase.supabase_url}")
    except Exception as e:
        print(f"❌ Error creando cliente: {e}")
        return
    
    # 2. Probar con un token de ejemplo
    print("\n2. Probando verificación de token...")
    print("   NOTA: Necesitas un token real de tu sesión")
    print("   Puedes obtenerlo desde las DevTools del navegador")
    print("   en la pestaña Network > Headers > Authorization")
    
    # Token de ejemplo (reemplazar con uno real)
    test_token = input("\n   Pega tu token aquí (o presiona Enter para saltar): ").strip()
    
    if test_token:
        try:
            print("\n   Intentando verificar token...")
            response = supabase.auth.get_user(test_token)
            
            print(f"\n   Tipo de respuesta: {type(response)}")
            print(f"   Tiene atributo 'user': {hasattr(response, 'user')}")
            
            if hasattr(response, 'user') and response.user:
                print(f"\n   ✅ Token válido!")
                print(f"   Usuario ID: {response.user.id}")
                print(f"   Email: {response.user.email}")
            else:
                print(f"\n   ❌ Respuesta no tiene usuario válido")
                print(f"   Respuesta: {response}")
                
        except Exception as e:
            print(f"\n   ❌ Error verificando token: {e}")
            print(f"   Tipo de error: {type(e).__name__}")
            import traceback
            traceback.print_exc()
    
    # 3. Verificar estructura de respuesta
    print("\n3. Información sobre la estructura de respuesta de Supabase:")
    print("   - La respuesta debe tener un atributo 'user'")
    print("   - El usuario debe tener 'id' y 'email'")
    print("   - Los tokens de Supabase usan ES256 (ECC)")
    
    print("\n" + "=" * 60)
    print("FIN DEL DIAGNÓSTICO")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_supabase_auth())
