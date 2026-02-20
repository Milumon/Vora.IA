# Efecto de Pulso Vibrante en Marcadores del Mapa

## Descripción Visual

El efecto de pulso vibrante crea una animación llamativa cuando un marcador es seleccionado en el mapa.

### Estados del Marcador

#### Estado Normal (No Seleccionado)
```
┌─────────────┐
│             │
│   ┌─────┐   │
│   │  1  │   │  ← Marcador circular de 24px
│   └─────┘   │     Borde blanco de 2px
│             │     Color del día vibrante
└─────────────┘
```

#### Estado Seleccionado (Con Efecto Sonar)
```
┌─────────────────────────────────┐
│                                 │
│        ╭─────────────╮          │  ← Onda 3 (más externa)
│       ╱               ╲         │     Delay: 1s
│      │  ╭───────────╮  │        │     Se expande y desvanece
│      │ ╱             ╲ │        │
│      │ │ ╭─────────╮ │ │        │  ← Onda 2 (media)
│      │ │╱           ╲│ │        │     Delay: 0.5s
│      │ ││  ┌─────┐  ││ │        │
│      │ ││  │  1  │  ││ │        │  ← Marcador central 32px
│      │ ││  └─────┘  ││ │        │     Borde blanco 3px
│      │ │╲           ╱│ │        │     Sombra con glow
│      │ │ ╰─────────╯ │ │        │
│      │ ╲             ╱ │        │  ← Onda 1 (más interna)
│      │  ╰───────────╯  │        │     Sin delay
│       ╲               ╱         │     Comienza inmediatamente
│        ╰─────────────╯          │
│                                 │
└─────────────────────────────────┘

Efecto: Las ondas se propagan desde el centro
        como un sonar, una tras otra
```

## Características Técnicas

### Capas de Animación

1. **Onda Sonar 1 (Inmediata)**
   - Usa animación personalizada `sonar-wave`
   - Tamaño inicial: 32px (desde el marcador)
   - Tamaño final: 80px
   - Opacidad: 1 → 0
   - Velocidad: 2s
   - Delay: 0s (comienza inmediatamente)
   - Borde: 3px sólido del color del día

2. **Onda Sonar 2 (Retrasada)**
   - Misma animación `sonar-wave`
   - Tamaño inicial: 32px
   - Tamaño final: 80px
   - Opacidad: 1 → 0
   - Velocidad: 2s
   - Delay: 0.5s
   - Borde: 3px sólido del color del día

3. **Onda Sonar 3 (Más Retrasada)**
   - Misma animación `sonar-wave`
   - Tamaño inicial: 32px
   - Tamaño final: 80px
   - Opacidad: 1 → 0
   - Velocidad: 2s
   - Delay: 1s
   - Borde: 3px sólido del color del día

4. **Resplandor Interior**
   - Usa animación `inner-glow`
   - Tamaño: 40px (constante)
   - Opacidad: 0.2 → 0.4 → 0.2
   - Escala: 1 → 1.1 → 1
   - Velocidad: 1.5s
   - Color de fondo del día con transparencia

5. **Marcador Central**
   - Transición suave de tamaño (24px → 32px)
   - Borde aumenta (2px → 3px)
   - Sombra con glow del color del día
   - zIndex elevado (1000)

### Colores por Día

Cada día tiene un color vibrante único que se aplica a:
- El círculo del marcador
- Los anillos de pulso
- El glow de la sombra

| Día | Color | Hex Code |
|-----|-------|----------|
| 1   | Rojo brillante | #FF1744 |
| 2   | Verde brillante | #00E676 |
| 3   | Azul brillante | #2979FF |
| 4   | Naranja brillante | #FF9100 |
| 5   | Púrpura brillante | #D500F9 |
| 6   | Cian brillante | #00E5FF |
| 7   | Amarillo brillante | #FFEA00 |

## Implementación

### Componente PulsingMarker

```typescript
<PulsingMarker
  position={{ lat, lng }}
  dayNumber={1}
  label="1"
  isPulsing={true}
  onClick={handleClick}
/>
```

### Animaciones CSS

```css
/* Ondas de sonar que se expanden desde el centro */
@keyframes sonar-wave {
  0% {
    width: 32px;
    height: 32px;
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    width: 80px;
    height: 80px;
    opacity: 0;
  }
}

/* Resplandor interior pulsante */
@keyframes inner-glow {
  0%, 100% {
    opacity: 0.2;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.4;
    transform: translate(-50%, -50%) scale(1.1);
  }
}
```

## Ventajas UX

1. **Efecto Sonar Realista**: Las ondas se propagan desde el centro como un radar o sonar
2. **Alta Visibilidad**: Tres ondas consecutivas son imposibles de ignorar
3. **Feedback Inmediato**: El usuario sabe exactamente qué marcador seleccionó
4. **Contexto Visual**: El color del día se mantiene en todas las ondas
5. **Secuencia Natural**: Las ondas aparecen una tras otra, creando un efecto fluido
6. **No Intrusivo**: A pesar de ser llamativo, no molesta la navegación
7. **Profesional**: Efecto moderno similar a aplicaciones de mapas premium
8. **Accesible**: Los colores vibrantes son visibles en diferentes condiciones

## Comparación con Bounce

| Característica | Bounce (Anterior) | Sonar Vibrante (Actual) |
|----------------|-------------------|-------------------------|
| Movimiento | Vertical (salta) | Expansión radial desde centro |
| Visibilidad | Media | Muy Alta |
| Profesionalismo | Básico | Premium |
| Distracción | Alta | Media |
| Personalización | Limitada | Completa |
| Colores | Estáticos | Dinámicos con ondas |
| Efecto | Simple | Sofisticado (tipo sonar) |
| Ondas | Ninguna | 3 ondas secuenciales |

## Casos de Uso

- Usuario hace clic en un marcador → Ondas sonar se propagan desde el centro
- Usuario hace clic en un lugar del timeline → Mapa centra y activa efecto sonar
- Usuario cierra InfoWindow → Efecto sonar continúa hasta nueva selección
- Usuario selecciona otro marcador → Efecto sonar se transfiere al nuevo marcador
- Las ondas se propagan continuamente mientras el marcador está seleccionado
- Cada onda aparece con 0.5s de diferencia, creando un efecto de radar

## Inspiración del Diseño

El efecto está inspirado en:
- Sistemas de sonar submarino
- Radares de navegación
- Aplicaciones de mapas premium (Google Maps, Apple Maps)
- Interfaces de seguimiento en tiempo real
- Efectos de ondas de agua al lanzar una piedra
