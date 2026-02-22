#!/bin/bash

echo "🚀 Configurando Vora Backend..."

# Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    echo "📦 Creando entorno virtual..."
    python -m venv venv
fi

# Activar entorno virtual
echo "🔧 Activando entorno virtual..."
source venv/bin/activate

# Instalar dependencias
echo "📥 Instalando dependencias..."
pip install --upgrade pip
pip install -r requirements.txt

# Verificar .env.local
if [ ! -f ".env.local" ]; then
    echo "⚠️  Advertencia: .env.local no encontrado"
    echo "Por favor, crea .env.local con las variables necesarias"
    exit 1
fi

echo "✅ Setup completado!"
echo ""
echo "Para iniciar el servidor:"
echo "  source venv/bin/activate"
echo "  uvicorn app.main:app --reload --port 8000"
echo ""
echo "Para ejecutar tests:"
echo "  pytest tests/ -v"
echo ""
echo "Para probar el agente:"
echo "  python test_agent.py"
