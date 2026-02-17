# Quickstart - Vora

Guía rápida para poner en marcha el proyecto Vora.

## 🚀 Inicio Rápido (5 minutos)

### 1. Clonar y Configurar

```bash
# Clonar repositorio
git clone <repository-url>
cd vora

# Copiar archivos de configuración
cd backend
copy .env.example .env.local

cd ../frontend
copy .env.example .env.local
```

### 2. Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
uvicorn app.main:app --reload
```

✅ Backend corriendo en `http://localhost:8000`

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar servidor
npm run dev
```

✅ Frontend corriendo en `http://localhost:3000`

## 📋 Configuración Mínima

Para que el proyecto funcione localmente, necesitas configurar:

### Backend (.env.local)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
OPENAI_API_KEY=sk-...
GOOGLE_PLACES_API_KEY=AIza...
SECRET_KEY=your-secret-key-for-internal-sessions
```

Nota: No necesitas `SUPABASE_JWT_SECRET`. Supabase usa ECC P-256 para JWT.

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🔑 Obtener Credenciales

1. **Supabase**: https://supabase.com
   - Crear proyecto
   - Ejecutar `supabase/schema.sql`
   - Copiar URL y Anon Key (Settings > API)
   - JWT se verifica automáticamente con ECC P-256

2. **OpenAI**: https://platform.openai.com
   - Crear API Key

3. **Google Cloud**: https://console.cloud.google.com
   - Crear proyecto
   - Habilitar Places API
   - Crear API Key

## 📚 Próximos Pasos

- Ver documentación completa en `docs/SETUP.md`
- Revisar arquitectura en `docs/ARCHITECTURE.md`
- Consultar API en `docs/API.md`
- Seguir checklist en `docs/PHASE1_CHECKLIST.md`

## 🆘 Problemas Comunes

**Error de conexión a Supabase**
- Verificar credenciales en `.env.local`
- Verificar que el proyecto esté activo

**Error de módulos Python**
- Verificar que el venv esté activado
- Reinstalar: `pip install -r requirements.txt`

**Error de módulos Node**
- Limpiar caché: `npm cache clean --force`
- Reinstalar: `rm -rf node_modules && npm install`
