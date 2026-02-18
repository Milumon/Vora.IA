# Script de Setup para Fase 3 - Frontend
# Ejecutar desde el directorio frontend

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Setup Fase 3 - ViajesPeru.AI   " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Debes ejecutar este script desde el directorio frontend/" -ForegroundColor Red
    exit 1
}

Write-Host "1. Instalando dependencias de npm..." -ForegroundColor Green
npm install

Write-Host ""
Write-Host "2. Verificando variables de entorno..." -ForegroundColor Green

if (-not (Test-Path ".env.local")) {
    Write-Host "   Creando .env.local desde .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.local"
        Write-Host "   ✓ Archivo .env.local creado" -ForegroundColor Green
        Write-Host "   ⚠ IMPORTANTE: Edita .env.local con tus credenciales" -ForegroundColor Yellow
    } else {
        Write-Host "   ⚠ No se encontró .env.example" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✓ .env.local ya existe" -ForegroundColor Green
}

Write-Host ""
Write-Host "3. Verificando estructura de directorios..." -ForegroundColor Green

$directories = @(
    "src/components/ui",
    "src/components/layout",
    "src/components/auth",
    "src/components/shared",
    "src/components/providers",
    "src/lib/utils",
    "public/locales/es",
    "public/locales/en"
)

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Write-Host "   ✓ $dir" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $dir (falta)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Setup Completado                " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Edita .env.local con tus credenciales de Supabase" -ForegroundColor White
Write-Host "2. Configura Google OAuth en Supabase Dashboard" -ForegroundColor White
Write-Host "3. Ejecuta: npm run dev" -ForegroundColor White
Write-Host "4. Visita: http://localhost:3000" -ForegroundColor White
Write-Host ""

Write-Host "Documentación:" -ForegroundColor Yellow
Write-Host "- PHASE3_PROGRESS.md - Progreso de implementación" -ForegroundColor White
Write-Host "- ../docs/FASE3_IMPLEMENTACION.md - Guía completa" -ForegroundColor White
Write-Host ""

Write-Host "¿Quieres iniciar el servidor de desarrollo ahora? (S/N): " -ForegroundColor Cyan -NoNewline
$response = Read-Host

if ($response -eq "S" -or $response -eq "s") {
    Write-Host ""
    Write-Host "Iniciando servidor de desarrollo..." -ForegroundColor Green
    npm run dev
}
