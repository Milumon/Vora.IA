# Estructura de Internacionalización (i18n)

## Organización de Archivos

Los archivos de traducción están organizados de forma granular por página/funcionalidad en:

```
frontend/public/locales/
├── en/
│   ├── common.json      # Elementos compartidos (navegación, botones comunes)
│   ├── home.json        # Página principal
│   ├── auth.json        # Login y registro
│   ├── chat.json        # Interfaz de chat
│   ├── itineraries.json # Lista y detalle de itinerarios
│   └── footer.json      # Footer
└── es/
    ├── common.json
    ├── home.json
    ├── auth.json
    ├── chat.json
    ├── itineraries.json
    └── footer.json
```

## Uso en Componentes

### Importar traducciones

```tsx
import { useTranslations } from 'next-intl';

// En el componente
const t = useTranslations('namespace');
```

### Namespaces disponibles

- `common` - Elementos compartidos (navegación, botones, mensajes generales)
- `home` - Página principal
- `auth.login` - Formulario de login
- `auth.register` - Formulario de registro
- `auth.errors` - Mensajes de error de autenticación
- `chat` - Interfaz de chat
- `itineraries.list` - Lista de itinerarios
- `itineraries.card` - Tarjeta de itinerario
- `itineraries.detail` - Detalle de itinerario
- `itineraries.budget` - Etiquetas de presupuesto
- `itineraries.status` - Estados de itinerario
- `itineraries.timeline` - Timeline de días
- `footer` - Footer

### Ejemplos de uso

#### Página principal
```tsx
const t = useTranslations('home');
<h1>{t('title')}</h1>
<p>{t('subtitle')}</p>
<button>{t('cta.start')}</button>
```

#### Formulario de login
```tsx
const t = useTranslations('auth.login');
<h2>{t('title')}</h2>
<input placeholder={t('email')} />
<button>{t('submit')}</button>
```

#### Tarjeta de itinerario
```tsx
const t = useTranslations('itineraries');
<span>{t(`budget.${itinerary.budget}`)}</span>
<span>{itinerary.days} {t('card.days')}</span>
```

## Agregar nuevas traducciones

1. Identifica el namespace apropiado o crea uno nuevo
2. Agrega las claves en ambos archivos (en/ y es/)
3. Actualiza `frontend/src/i18n/request.ts` si agregaste un nuevo archivo
4. Actualiza `frontend/src/app/[locale]/layout.tsx` para cargar el nuevo archivo
5. Usa `useTranslations('namespace')` en tu componente

## Estructura de archivos JSON

Usa objetos anidados para organizar traducciones relacionadas:

```json
{
  "section": {
    "subsection": {
      "key": "valor"
    }
  }
}
```

Acceso: `t('section.subsection.key')`
