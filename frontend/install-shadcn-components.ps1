# Script para instalar componentes de Shadcn/ui
# Ejecutar desde el directorio frontend

Write-Host "Instalando componentes de Shadcn/ui..." -ForegroundColor Green

# Lista de componentes necesarios
$components = @(
    "card",
    "input",
    "textarea",
    "select",
    "dialog",
    "dropdown-menu",
    "toast",
    "avatar",
    "badge",
    "separator",
    "skeleton",
    "label",
    "form",
    "tabs",
    "scroll-area",
    "popover",
    "calendar",
    "checkbox"
)

foreach ($component in $components) {
    Write-Host "Instalando $component..." -ForegroundColor Cyan
    npx shadcn-ui@latest add $component --yes
}

Write-Host "`nTodos los componentes instalados exitosamente!" -ForegroundColor Green
Write-Host "Recuerda ejecutar 'npm install' si es necesario." -ForegroundColor Yellow
