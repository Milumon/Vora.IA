# PowerShell setup script for Windows

Write-Host "🚀 Configurando Vora Backend..." -ForegroundColor Green

# Crear entorno virtual si no existe
if (-not (Test-Path "venv")) {
    Write-Host "📦 Creando entorno virtual..." -ForegroundColor Yellow
    python -m venv venv
}

# Activar entorno virtual
Write-Host "🔧 Activando entorno virtual..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Instalar dependencias
Write-Host "📥 Instalando dependencias..." -ForegroundColor Yellow
python -m pip install --upgrade pip
pip install -r requirements.txt

# Verificar .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  Advertencia: .env.local no encontrado" -ForegroundColor Red
    Write-Host "Por favor, crea .env.local con las variables necesarias"
    exit 1
}

Write-Host "✅ Setup completado!" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar el servidor:" -ForegroundColor Cyan
Write-Host "  .\venv\Scripts\Activate.ps1"
Write-Host "  uvicorn app.main:app --reload --port 8000"
Write-Host ""
Write-Host "Para ejecutar tests:" -ForegroundColor Cyan
Write-Host "  pytest tests/ -v"
Write-Host ""
Write-Host "Para probar el agente:" -ForegroundColor Cyan
Write-Host "  python test_agent.py"
