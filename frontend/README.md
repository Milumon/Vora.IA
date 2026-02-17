# Vora Frontend

Next.js 14 frontend con TypeScript, Tailwind CSS y Shadcn/ui.

## Setup

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
copy .env.example .env.local
# Editar .env.local con tus credenciales
```

3. Ejecutar servidor de desarrollo:
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## Scripts

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm start` - Servidor de producción
- `npm run lint` - Linting
- `npm run format` - Formateo con Prettier

## Estructura

```
src/
├── app/              # App Router (Next.js 14)
├── components/       # Componentes React
│   ├── ui/          # Componentes Shadcn/ui
│   ├── layout/      # Layout components
│   └── providers/   # Context providers
├── lib/             # Utilidades y configuración
│   ├── api/        # Cliente API
│   ├── supabase/   # Cliente Supabase
│   └── utils/      # Funciones helper
└── types/          # TypeScript types
```

## Características

- Next.js 14 con App Router
- TypeScript estricto
- Tailwind CSS + Shadcn/ui
- i18n (Español/Inglés)
- Tema claro/oscuro
- React Query para data fetching
- Zustand para state management
- Supabase Auth
