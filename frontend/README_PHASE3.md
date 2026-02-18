# Fase 3: Frontend y UX - Guía Rápida

## 🚀 Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 3. Ejecutar servidor de desarrollo
npm run dev

# 4. Abrir en navegador
# http://localhost:3000
```

## 📦 Lo que se Implementó

### ✅ Sistema de Diseño
- Paleta de colores cálida (terracota, beige, azul andino)
- Tema claro/oscuro
- Sistema de elevación de superficies
- Tipografía Inter

### ✅ Componentes UI
- Button, Card, Input, Textarea
- Avatar, Badge, Separator, Skeleton
- Header, Footer
- LocaleSwitcher, ThemeToggle, LoadingSpinner

### ✅ Autenticación
- Login con email/password
- Registro con email/password
- Google OAuth (Sign in with Google)
- AuthProvider con Supabase

### ✅ Internacionalización
- Español (ES)
- English (EN)
- Cambio dinámico de idioma

## 🔧 Configuración de Google OAuth

### 1. Supabase Dashboard

1. Ir a **Authentication > Providers > Google**
2. Habilitar el provider
3. Configurar Client ID y Client Secret
4. Agregar redirect URIs:
   ```
   http://localhost:3000/auth/callback
   https://tu-dominio.vercel.app/auth/callback
   ```

### 2. Google Cloud Console

1. Crear proyecto
2. Habilitar Google+ API
3. Crear credenciales OAuth 2.0
4. Configurar Authorized redirect URIs
5. Copiar Client ID y Secret a Supabase

## 📁 Estructura de Componentes

```
src/components/
├── ui/              # Componentes base de Shadcn
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── layout/          # Layout components
│   ├── Header.tsx
│   └── Footer.tsx
├── auth/            # Componentes de autenticación
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
├── shared/          # Componentes compartidos
│   ├── LocaleSwitcher.tsx
│   ├── ThemeToggle.tsx
│   └── LoadingSpinner.tsx
└── providers/       # Context providers
    ├── AuthProvider.tsx
    ├── ThemeProvider.tsx
    └── QueryProvider.tsx
```

## 🎨 Sistema de Colores

### Light Mode
```css
--background: 30 25% 98%      /* Beige cálido */
--primary: 10 55% 60%         /* Terracota */
--secondary: 200 35% 50%      /* Azul andino */
--accent: 10 80% 96%          /* Terracota suave */
```

### Dark Mode
```css
--background: 25 15% 8%       /* Gris cálido oscuro */
--primary: 10 50% 55%         /* Terracota desaturado */
--secondary: 200 30% 45%      /* Azul desaturado */
```

## 🧪 Testing

### Probar Autenticación

1. **Login con Email**
   - Ir a `/auth/login`
   - Ingresar email y contraseña
   - Verificar redirección a `/chat`

2. **Login con Google**
   - Click en "Continuar con Google"
   - Autorizar en Google
   - Verificar redirección a `/chat`

3. **Registro**
   - Ir a `/auth/register`
   - Completar formulario
   - Verificar email de confirmación

### Probar UI

1. **Tema**
   - Click en botón sol/luna
   - Verificar cambio de colores

2. **Idioma**
   - Click en botón ES/EN
   - Verificar cambio de textos

3. **Responsive**
   - Redimensionar ventana
   - Verificar navegación mobile

## 📝 Variables de Entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Google Maps (para Fase 3.5)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu-google-maps-key
```

## 🐛 Troubleshooting

### Error: "Invalid API key"
- Verificar que las variables de entorno estén configuradas
- Reiniciar el servidor de desarrollo

### Error: "Google OAuth not configured"
- Verificar configuración en Supabase Dashboard
- Verificar redirect URIs en Google Cloud Console

### Error: "Module not found"
- Ejecutar `npm install`
- Verificar que todos los archivos estén creados

### Estilos no se aplican
- Verificar que `globals.css` esté importado en layout
- Limpiar caché: `rm -rf .next && npm run dev`

## 📚 Documentación

- **PHASE3_PROGRESS.md** - Progreso detallado
- **../docs/FASE3_IMPLEMENTACION.md** - Guía completa
- **../docs/SUPABASE_AUTH.md** - Configuración de auth

## 🔜 Próximos Pasos

### Fase 3.3 - Chat Interface
- ChatInterface component
- MessageBubble component
- MessageInput component
- Integración con backend

### Fase 3.4 - Itinerarios
- ItineraryCard component
- ItineraryDetail component
- DayTimeline component
- PlaceCard component

### Fase 3.5 - Google Maps
- GoogleMapView component
- Marcadores y rutas
- Integración con itinerarios

## 💡 Tips

### Desarrollo
- Usa `npm run dev` para hot reload
- Usa `npm run lint` para verificar código
- Usa `npm run build` para verificar producción

### Componentes
- Todos los componentes UI están en `src/components/ui`
- Usa `cn()` para combinar classNames
- Sigue el patrón de Shadcn para nuevos componentes

### Estilos
- Usa variables CSS (`--primary`, `--background`, etc.)
- Usa clases de Tailwind para spacing y layout
- Evita estilos inline

## 🎯 Checklist de Calidad

Antes de hacer commit:
- [ ] Código sin errores de TypeScript
- [ ] Componentes responsive
- [ ] Dark mode funciona
- [ ] i18n funciona
- [ ] No hay console.logs
- [ ] Código formateado (Prettier)

## 📞 Soporte

Si encuentras problemas:
1. Revisa la documentación
2. Verifica las variables de entorno
3. Revisa los logs de consola
4. Consulta PHASE3_PROGRESS.md

---

**Versión**: 0.3.0
**Última actualización**: 2024-01-XX
