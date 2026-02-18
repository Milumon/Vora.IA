# Script de instalación para la integración de Chat con Mapa
# Ejecutar desde la carpeta frontend: .\install-map-integration.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Instalación: Chat + Mapa Interactivo" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en la carpeta frontend
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Debes ejecutar este script desde la carpeta frontend" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
npm install @react-google-maps/api

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al instalar dependencias" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencias instaladas correctamente" -ForegroundColor Green
Write-Host ""

# Verificar variables de entorno
Write-Host "🔍 Verificando variables de entorno..." -ForegroundColor Yellow

if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    
    if ($envContent -match "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY") {
        Write-Host "✅ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY encontrada" -ForegroundColor Green
    } else {
        Write-Host "⚠️  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no encontrada en .env.local" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Por favor, agrega la siguiente línea a tu archivo .env.local:" -ForegroundColor Yellow
        Write-Host "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️  Archivo .env.local no encontrado" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Creando archivo .env.local..." -ForegroundColor Yellow
    
    $envTemplate = @"
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_aqui

# Supabase (si aún no están configuradas)
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
"@
    
    Set-Content -Path ".env.local" -Value $envTemplate
    Write-Host "✅ Archivo .env.local creado" -ForegroundColor Green
    Write-Host "⚠️  Por favor, completa las variables de entorno en .env.local" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Instalación completada" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Asegúrate de tener tu Google Maps API Key configurada en .env.local" -ForegroundColor White
Write-Host "2. Habilita las siguientes APIs en Google Cloud Console:" -ForegroundColor White
Write-Host "   - Maps JavaScript API" -ForegroundColor Gray
Write-Host "   - Places API" -ForegroundColor Gray
Write-Host "   - Places API (New)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Inicia el servidor de desarrollo:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Ve a http://localhost:3000/chat y prueba el flujo completo" -ForegroundColor White
Write-Host ""
Write-Host "📖 Para más información, consulta:" -ForegroundColor Yellow
Write-Host "   CHAT_MAP_INTEGRATION_IMPLEMENTATION.md" -ForegroundColor Cyan
Write-Host ""
