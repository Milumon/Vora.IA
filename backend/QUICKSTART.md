# 🚀 Quick Start - Vora Backend

Guía rápida para tener el backend funcionando en 5 minutos.

## ⚡ Instalación Rápida

### Windows

```powershell
cd backend
.\setup.ps1
```

### Linux/Mac

```bash
cd backend
chmod +x setup.sh
./setup.sh
```

## 🔑 Configuración Mínima

Crea `.env.local` con:

```env
OPENAI_API_KEY=sk-proj-...
GOOGLE_PLACES_API_KEY=AIza...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
SECRET_KEY=tu-secret-key-aqui
```

## 🏃 Iniciar Servidor

```bash
# Activar entorno virtual
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/Mac:
source venv/bin/activate

# Iniciar servidor
uvicorn app.main:app --reload --port 8000
```

Servidor disponible en: `http://localhost:8000`

## 🧪 Probar el Agente

### Opción 1: Script de Prueba

```bash
python test_agent.py
```

### Opción 2: Swagger UI

Abre en tu navegador: `http://localhost:8000/docs`

### Opción 3: cURL

```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Quiero viajar a Cusco por 5 días"}'
```

## ✅ Verificar que Funciona

### 1. Health Check

```bash
curl http://localhost:8000/health
```

Debe retornar:
```json
{
  "status": "healthy",
  "environment": "development",
  "version": "1.0.0"
}
```

### 2. Ejecutar Tests

```bash
pytest tests/ -v
```

Todos los tests deben pasar ✅

## 📚 Próximos Pasos

1. Lee `AGENTS_README.md` para entender la arquitectura
2. Revisa `USAGE_EXAMPLES.md` para más ejemplos
3. Consulta `README.md` para documentación completa

## 🆘 Problemas Comunes

### Error: "Module not found"

```bash
pip install -r requirements.txt
```

### Error: "OpenAI API key invalid"

Verifica que tu API key en `.env.local` sea correcta.

### Error: "Google Places API error"

1. Habilita Places API en Google Cloud Console
2. Configura billing
3. Verifica tu API key

### Puerto 8000 ocupado

```bash
# Cambiar puerto
uvicorn app.main:app --reload --port 8001
```

## 🎯 Ejemplo Completo

```python
import requests

# 1. Hacer request al agente
response = requests.post(
    "http://localhost:8000/api/v1/chat",
    json={
        "message": "Quiero viajar a Cusco por 5 días con presupuesto medio",
        "thread_id": None,
        "save_conversation": False
    }
)

# 2. Ver respuesta
result = response.json()
print(result['message'])

# 3. Ver itinerario si existe
if result.get('itinerary'):
    print(f"\nItinerario: {result['itinerary']['title']}")
    print(f"Días: {len(result['itinerary']['day_plans'])}")
```

## 📖 Documentación

- **Arquitectura**: `AGENTS_README.md`
- **Ejemplos**: `USAGE_EXAMPLES.md`
- **Deployment**: `DEPLOYMENT.md`
- **API Docs**: `http://localhost:8000/docs`

## 💡 Tips

- Usa `--reload` en desarrollo para auto-reload
- Revisa logs en la terminal para debugging
- Swagger UI es tu amigo para probar endpoints
- Los tests no requieren API keys reales (usan mocks)

## ✨ ¡Listo!

Tu backend está funcionando. Ahora puedes:

1. ✅ Generar itinerarios de viaje
2. ✅ Buscar lugares turísticos
3. ✅ Refinar itinerarios
4. ✅ Mantener conversaciones naturales

**¿Dudas?** Revisa la documentación completa en `README.md`
