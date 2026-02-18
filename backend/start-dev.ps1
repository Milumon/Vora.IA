# Script para iniciar el servidor con auto-reload (desarrollo)

Write-Host "🚀 Iniciando Vora Backend (modo desarrollo)..." -ForegroundColor Green

# Verificar que el entorno esté activado
if (-not $env:VIRTUAL_ENV) {
    Write-Host "⚠️  Activando entorno virtual..." -ForegroundColor Yellow
    & .\.venv\Scripts\Activate.ps1
}

# Iniciar servidor con auto-reload pero excluyendo .venv
Write-Host "📡 Servidor iniciando en http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "📚 Documentación en http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "🔄 Auto-reload activado (excluye .venv)" -ForegroundColor Yellow
Write-Host "" 
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Yellow
Write-Host ""

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload `
    --reload-exclude ".venv/*" `
    --reload-exclude "__pycache__/*" `
    --reload-exclude "*.pyc"
