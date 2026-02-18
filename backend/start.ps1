# Script para iniciar el servidor de desarrollo

Write-Host "Iniciando Vora Backend..." -ForegroundColor Green

# Verificar que el entorno esté activado
if (-not $env:VIRTUAL_ENV) {
    Write-Host "Activando entorno virtual..." -ForegroundColor Yellow
    & .\.venv\Scripts\Activate.ps1
}

# Iniciar servidor sin auto-reload (más estable)
Write-Host "Servidor iniciando en http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "Documentacion en http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "" 
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Yellow
Write-Host ""

uvicorn app.main:app --host 0.0.0.0 --port 8000
