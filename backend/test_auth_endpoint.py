"""
Script de prueba para verificar la autenticación con Supabase
"""
import os
from dotenv import load_dotenv
from supabase import create_client

# Cargar variables de entorno
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def test_token_verification():
    """Prueba la verificación de token con Supabase"""
    
    # Crear cliente
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Token de ejemplo (reemplazar con un token real de tu sesión)
    test_token = "TU_TOKEN_AQUI"
    
    try:
        # Intentar obtener usuario con el token
        response = supabase.auth.get_user(test_token)
        
        print("✅ Token válido!")
        print(f"Usuario ID: {response.user.id}")
        print(f"Email: {response.user.email}")
        print(f"Response type: {type(response)}")
        print(f"Has user attr: {hasattr(response, 'user')}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print(f"Error type: {type(e)}")

if __name__ == "__main__":
    print("Probando verificación de token con Supabase...")
    print(f"URL: {SUPABASE_URL}")
    print("-" * 50)
    test_token_verification()
