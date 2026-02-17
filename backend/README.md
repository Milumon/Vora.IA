# Vora Backend

FastAPI backend con LangChain/LangGraph para agentes de IA.

## Setup

1. Crear entorno virtual:
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

3. Configurar variables de entorno:
```bash
copy .env.example .env.local
# Editar .env.local con tus credenciales
```

4. Ejecutar servidor de desarrollo:
```bash
uvicorn app.main:app --reload
```

El servidor estará disponible en `http://localhost:8000`

## Documentación API

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Testing

```bash
pytest
pytest --cov=app tests/
```

## Linting

```bash
black .
ruff check .
mypy .
```

## Estructura

```
app/
├── api/          # Endpoints REST
├── agents/       # LangGraph agents (Fase 2)
├── config/       # Configuración
├── core/         # Dependencias y middleware
├── services/     # Servicios de negocio
└── main.py       # Aplicación FastAPI
```
