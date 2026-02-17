# Guía de Setup - Vora

Esta guía te ayudará a configurar el proyecto Vora desde cero.

## Requisitos Previos

- Python 3.11 o superior
- Node.js 18 o superior
- Git
- Cuenta en Supabase (https://supabase.com)
- Cuenta en Google Cloud Platform (https://console.cloud.google.com)
- API Key de OpenAI (https://platform.openai.com)

## 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd vora
```

## 2. Configurar Supabase

1. Crear un nuevo proyecto en Supabase
2. Ir a SQL Editor y ejecutar el script `supabase/schema.sql`
3. Copiar las credenciales:
   - Project URL
   - Anon/Public Key
   - JWT Secret (en Settings > API)

## 3. Configurar Google Cloud Platform

1. Crear un nuevo proyecto en GCP
2. Habilitar las siguientes APIs:
   - Places API (New)
   - Maps JavaScript API
   - Routes API
   - Geocoding API
3. Crear una API Key
4. Configurar restricciones de dominio para la API Key

## 4. Setup del Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Copiar archivo de configuración
copy .env.example .env.local

# Editar .env.local con tus credenciales
```

Configurar las siguientes variables en `.env.local`:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_PLACES_API_KEY`
- `SECRET_KEY` (generar uno nuevo para producción)

```bash
# Ejecutar servidor
uvicorn app.main:app --reload
```

El backend estará disponible en `http://localhost:8000`

## 5. Setup del Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Copiar archivo de configuración
copy .env.example .env.local

# Editar .env.local con tus credenciales
```

Configurar las siguientes variables en `.env.local`:
- `NEXT_PUBLIC_API_URL=http://localhost:8000`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

```bash
# Ejecutar servidor
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## 6. Verificar la Instalación

1. Abrir `http://localhost:3000` en tu navegador
2. Verificar que la página de inicio carga correctamente
3. Abrir `http://localhost:8000/docs` para ver la documentación de la API
4. Verificar el endpoint de salud: `http://localhost:8000/health`

## 7. Configurar Pre-commit Hooks (Opcional)

```bash
# Backend
cd backend
pre-commit install

# Frontend
cd frontend
npm run prepare  # Si tienes husky configurado
```

## Próximos Pasos

Una vez completada la configuración inicial:

1. Revisar la documentación de la API en `/docs`
2. Familiarizarse con la estructura del proyecto
3. Continuar con la Fase 2: Backend y Agentes IA

## Solución de Problemas

### Error de conexión a Supabase
- Verificar que las credenciales en `.env.local` sean correctas
- Verificar que el proyecto de Supabase esté activo

### Error de Google Places API
- Verificar que la API esté habilitada en GCP
- Verificar que la API Key tenga los permisos correctos
- Verificar que el billing esté configurado en GCP

### Error de dependencias de Python
- Verificar la versión de Python: `python --version`
- Actualizar pip: `pip install --upgrade pip`
- Reinstalar dependencias: `pip install -r requirements.txt --force-reinstall`

### Error de dependencias de Node
- Verificar la versión de Node: `node --version`
- Limpiar caché: `npm cache clean --force`
- Eliminar node_modules y reinstalar: `rm -rf node_modules && npm install`
