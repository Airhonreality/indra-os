# ADR_004 — DESIGN SYSTEM: Tokens, Estilos, Layout e Iconografía

> **Versión:** 1.0
> **Estado:** VIGENTE — Documento fundacional del sistema de diseño
> **Estética:** Tony Stark × Glassmorphism × Solar Punk
> **Principio rector:** Un cambio en un token cambia el 100% de la UI.

---

## 1. PROBLEMA QUE RESUELVE

Sin un sistema de diseño centralizado, cada componente toma sus propias decisiones visuales: colores hardcodeados, tamaños arbitrarios, iconos de librerías externas diferentes. El resultado es una UI visualmente inconsistente que es imposible de refactorizar o de cambiar de tema.

**La solución es una pirámide de responsabilidades:**

```
Capa 1: design_tokens.css     → El ADN. Variables. Solo valores, ninguna clase.
Capa 2: component_styles.css  → Las clases reutilizables. Construidas con tokens.
Capa 3: [componente].css      → Estilos específicos del componente. Usan tokens y clases.
Capa 4: JS inline             → Solo valores dinámicos computados por JavaScript.
```

---

## 2. CAPA 1 — DESIGN TOKENS (`design_tokens.css`)

Un solo archivo. La fuente única de verdad visual. Nunca contiene selectores de clase, solo variables CSS.

### 2.1 Paleta de Color — Solar Punk Dark / Light

```css
/* ══════════════════════════════════════════════════════════════
   TEMA OSCURO — Default
   Estética: Vacío cósmico + energía solar punk + cristal flotante
   ══════════════════════════════════════════════════════════════ */
:root {
  /* Fondos — De más profundo a más elevado */
  --color-bg-void:      #020408;    /* El vacío absoluto (body) */
  --color-bg-deep:      #050810;    /* Fondo base de la app */
  --color-bg-surface:   #0d1117;    /* Superficies de contenedores */
  --color-bg-elevated:  #161b22;    /* Paneles secundarios, modales */
  --color-bg-float:     #1c2128;    /* Tooltips, dropdowns flotantes */
  --color-bg-hover:     #21262d;    /* Hover states interactivos */

  /* Acento — El color vivo del sistema */
  --color-accent:           #00f5d4;  /* Cian solar punk */
  --color-accent-dim:       rgba(0, 245, 212, 0.12);  /* Fondo sutil de acento */
  --color-accent-glow:      rgba(0, 245, 212, 0.25);  /* Glow / shadow de acento */
  --color-accent-rgb:       0, 245, 212; /* Para uso en rgba() */

  /* Semánticos */
  --color-warm:       #f5a623;    /* Ámbar — warnings, atención */
  --color-cold:       #7c6af7;    /* Violeta — acciones secundarias, relaciones */
  --color-danger:     #ff4655;    /* Rojo — destructivo, error crítico */
  --color-success:    #3fb950;    /* Verde — confirmación, OK */
  --color-neutral:    #484f58;    /* Gris — estado neutral / deshabilitado */

  /* Texto */
  --color-text-primary:    #e6edf3;  /* Texto principal de lectura */
  --color-text-secondary:  #7d8590;  /* Metadata, labels, placeholders */
  --color-text-tertiary:   #484f58;  /* Texto deshabilitado, muy secundario */
  --color-text-accent:     #00f5d4;  /* Texto que actúa como accent */
  --color-text-inverse:    #0d1117;  /* Texto sobre fondos accent (botones) */

  /* Bordes y separadores */
  --color-border:          rgba(255, 255, 255, 0.08);
  --color-border-active:   rgba(0, 245, 212, 0.4);
  --color-border-strong:   rgba(255, 255, 255, 0.16);

  /* Glass */
  --color-glass-bg:    rgba(13, 17, 23, 0.75);
  --color-glass-light: rgba(30, 40, 55, 0.6);
}

/* ══════════════════════════════════════════════════════════════
   TEMA CLARO — Activado con data-theme="light" en <html>
   Solo se sobreescriben los tokens que cambian. El accent se preserva.
   ══════════════════════════════════════════════════════════════ */
[data-theme="light"] {
  --color-bg-void:      #e8ecf0;
  --color-bg-deep:      #f0f2f5;
  --color-bg-surface:   #ffffff;
  --color-bg-elevated:  #f6f8fa;
  --color-bg-float:     #ffffff;
  --color-bg-hover:     #eaeef2;

  --color-text-primary:    #0d1117;
  --color-text-secondary:  #57606a;
  --color-text-tertiary:   #b0b7c0;
  --color-text-inverse:    #ffffff;

  --color-border:          rgba(0, 0, 0, 0.1);
  --color-border-active:   rgba(0, 245, 212, 0.6);
  --color-border-strong:   rgba(0, 0, 0, 0.2);

  --color-glass-bg:    rgba(255, 255, 255, 0.75);
  --color-glass-light: rgba(240, 242, 245, 0.6);
}
```

### 2.2 Tipografía

```css
:root {
  /* Familias */
  --font-sans:  'Inter', system-ui, -apple-system, sans-serif;
  --font-mono:  'JetBrains Mono', 'Fira Code', monospace;

  /* Escala — todos en px para control total */
  --text-2xs:  10px;
  --text-xs:   11px;
  --text-sm:   13px;
  --text-base: 15px;
  --text-lg:   18px;
  --text-xl:   22px;
  --text-2xl:  28px;
  --text-3xl:  36px;

  /* Pesos */
  --font-regular:  400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;

  /* Interlineado */
  --leading-tight:  1.2;
  --leading-base:   1.5;
  --leading-loose:  1.75;

  /* Letter spacing */
  --tracking-tight:  -0.02em;
  --tracking-base:    0em;
  --tracking-wide:    0.08em;  /* Para labels en caps */
  --tracking-wider:   0.12em;
}
```

### 2.3 Espaciado (Escala 4px)

```css
:root {
  --space-0:  0px;
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-7:  28px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Gaps específicos del layout modular */
  --mca-gap:      var(--space-2);   /* Gap interno de un micro-container */
  --mca-padding:  var(--space-4);   /* Padding estándar de un container */
  --panel-gap:    var(--space-3);   /* Gap entre paneles del motor */
}
```

### 2.4 Bordes y Radios

```css
:root {
  --radius-xs:   2px;
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-2xl:  24px;
  --radius-pill: 9999px;
}
```

### 2.5 Sombras y Efectos

```css
:root {
  /* Sombras */
  --shadow-sm:    0 1px 3px rgba(0,0,0,0.3);
  --shadow-md:    0 4px 12px rgba(0,0,0,0.4);
  --shadow-lg:    0 8px 32px rgba(0,0,0,0.5);
  --shadow-float: 0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px var(--color-border);
  --shadow-glow:  0 0 20px var(--color-accent-glow);
  --shadow-glow-warm: 0 0 20px rgba(245, 166, 35, 0.25);

  /* Blur */
  --blur-glass:  blur(16px);
  --blur-heavy:  blur(32px);

  /* Transiciones */
  --transition-instant: 80ms ease;
  --transition-fast:    140ms ease;
  --transition-base:    220ms ease;
  --transition-slow:    380ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-bounce:  400ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 3. CAPA 2 — COMPONENT STYLES (`component_styles.css`)

Clases reutilizables construidas con tokens. Estas son las piezas de Lego del sistema.

### 3.1 Contenedores MCA (Micro-Container Architecture)

```css
/* CONTAINER BASE */
.mca-surface {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--mca-padding);
}

/* CONTAINER ELEVADO (modales, paneles flotantes) */
.mca-float {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-float);
}

/* GLASS PANEL (estética Tony Stark) */
.glass-panel {
  background: var(--color-glass-bg);
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
}

/* CONTAINER CON ACENTO ACTIVO */
.mca-active {
  border-color: var(--color-border-active);
  box-shadow: 0 0 0 1px var(--color-accent-dim), var(--shadow-glow);
}
```

### 3.2 Sistema de Layout Flexbox

El padre declara el layout. Los hijos se posicionan. Nunca al revés.

```css
/* STACK — Columna vertical */
.stack        { display: flex; flex-direction: column; gap: var(--space-3); }
.stack--tight { display: flex; flex-direction: column; gap: var(--space-1); }
.stack--loose { display: flex; flex-direction: column; gap: var(--space-6); }

/* SHELF — Fila horizontal */
.shelf        { display: flex; align-items: center; gap: var(--space-2); }
.shelf--loose { display: flex; align-items: center; gap: var(--space-4); }

/* SPREAD — Fila que separa ítems a los extremos */
.spread {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}

/* GRID AUTO — Grilla de tarjetas auto-responsiva */
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}

/* FILL — Ocupar todo el espacio disponible del padre */
.fill   { flex: 1; min-width: 0; min-height: 0; }

/* CENTER — Centrado perfecto */
.center {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 3.3 Botones

```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  border: none;
  transition: all var(--transition-fast);
  white-space: nowrap;
}
.btn--xs  { padding: var(--space-1) var(--space-2); font-size: var(--text-xs); }
.btn--sm  { padding: var(--space-1) var(--space-3); font-size: var(--text-sm); }
.btn--lg  { padding: var(--space-3) var(--space-6); font-size: var(--text-base); }

.btn--accent  { background: var(--color-accent); color: var(--color-text-inverse); }
.btn--accent:hover  { box-shadow: var(--shadow-glow); }

.btn--ghost   { background: transparent; border: 1px solid var(--color-border); color: var(--color-text-primary); }
.btn--ghost:hover   { background: var(--color-bg-hover); border-color: var(--color-border-strong); }

.btn--danger  { background: var(--color-danger); color: white; }
.btn--subtle  { background: var(--color-accent-dim); color: var(--color-text-accent); border: 1px solid var(--color-border-active); }

.btn--full { width: 100%; justify-content: center; }
```

### 3.4 Inputs y Formularios

```css
.util-input {
  width: 100%;
  background: var(--color-bg-deep);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  transition: border-color var(--transition-fast);
  outline: none;
}
.util-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-dim);
}
.util-input::placeholder { color: var(--color-text-tertiary); }
.util-input--sm { padding: var(--space-1) var(--space-2); font-size: var(--text-xs); }
```

### 3.5 Labels y Texto de Apoyo

```css
.util-label {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.util-hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.util-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  background: var(--color-accent-dim);
  color: var(--color-text-accent);
  border: 1px solid var(--color-border-active);
}
```

---

## 4. ICONOGRAFÍA — INDRA ICON SYSTEM

### 4.1 Principios de Diseño

La biblioteca de iconos de Indra sigue el vocabulario visual **Tony Stark × Solar Punk**:

| Principio | Especificación |
|-----------|----------------|
| **Stroke, no fill** | Los iconos son líneas, nunca rellenos sólidos |
| **Trazo** | `strokeWidth: 1.5` — afilado e industrial |
| **Terminaciones** | `strokeLinecap: 'square'` — más técnico que redondeado |
| **Uniones** | `strokeLinejoin: 'miter'` — esquinas anguladas |
| **Color** | `stroke: 'currentColor'` — heredan el color del texto del padre |
| **Escala** | `width: '1em', height: '1em'` — se escalan con `font-size` |
| **Viewport** | `viewBox: '0 0 16 16'` — grilla de 16px |
| **Vocabulario** | Nodos, circuitos, flujos, hexágonos, átomos, portales |

### 4.2 Vocabulario Canónico de Iconos

```javascript
// IndraIcons.jsx — Mapa canónico de nombre → SVG
const ICON_MAP = {
  // ── ENTIDADES ────────────────────────────────
  'ATOM':         <path d="..." />,   // Átomo / workspace (hexágono con centro)
  'FOLDER':       <path d="..." />,   // Silo / base de datos
  'SCHEMA':       <path d="..." />,   // Formulario / captura de datos
  'DOCUMENT':     <path d="..." />,   // Plantilla de documento
  'FORMULA':      <path d="..." />,   // Regla de negocio / fórmula
  'BRIDGE':       <path d="..." />,   // Logic Bridge (dos círculos conectados)

  // ── ACCIONES ─────────────────────────────────
  'FLOW':         <path d="..." />,   // Flujo / conexión entre nodos
  'RESONANCE':    <path d="..." />,   // Nodo de resolución / extractor
  'SPLIT':        <path d="..." />,   // Fork / bifurcación
  'MERGE':        <path d="..." />,   // Unión de flujos
  'LINK':         <path d="..." />,   // Enlace / relación (cadena)
  'UNLINK':       <path d="..." />,   // Desvincular

  // ── ESTADO ───────────────────────────────────
  'SYNC':         <path d="..." />,   // Sincronizando (dos flechas circulares)
  'OK':           <path d="..." />,   // Check / éxito
  'ERROR':        <path d="..." />,   // X / error
  'WARN':         <path d="..." />,   // Triángulo de alerta
  'LOCK':         <path d="..." />,   // Bloqueado / protegido
  'UNLOCK':       <path d="..." />,   // Desbloqueado

  // ── NAVEGACIÓN ───────────────────────────────
  'CLOSE':        <path d="..." />,   // X de cierre
  'PLUS':         <path d="..." />,   // Agregar
  'MINUS':        <path d="..." />,   // Reducir
  'DRAG':         <path d="..." />,   // Handle de arrastre (6 puntos)
  'EXPAND':       <path d="..." />,   // Expandir / abrir
  'COLLAPSE':     <path d="..." />,   // Colapsar / cerrar
  'BACK':         <path d="..." />,   // Volver

  // ── CAMPOS / TIPOS ───────────────────────────
  'TEXT':         <path d="..." />,   // Tipo texto
  'NUMBER':       <path d="..." />,   // Tipo número (hash)
  'DATE':         <path d="..." />,   // Tipo fecha
  'BOOL':         <path d="..." />,   // Tipo booleano (toggle)
  'IMAGE':        <path d="..." />,   // Tipo imagen
  'RELATION':     <path d="..." />,   // Tipo relación (nodo conectado)
  'REPEATER':     <path d="..." />,   // Tipo lista / repeater
  'FORMULA_FIELD': <path d="..." />,  // Campo calculado

  // ── UI ───────────────────────────────────────
  'SETTINGS':     <path d="..." />,
  'SEARCH':       <path d="..." />,
  'COPY':         <path d="..." />,
  'DELETE':       <path d="..." />,
  'EYE':          <path d="..." />,
  'HELP':         <path d="..." />,
};
```

### 4.3 Implementación del Componente

```jsx
// IndraIcons.jsx
export function IndraIcon({ name, size, style, className }) {
  const icon = ICON_MAP[name?.toUpperCase()];
  if (!icon) return null;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width={size || '1em'}
      height={size || '1em'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      style={{ flexShrink: 0, ...style }}
      className={className}
      aria-hidden="true"
    >
      {icon}
    </svg>
  );
}
```

### 4.4 Uso en Contexto (Herencia de Color)

```jsx
// El ícono hereda el color del texto del padre automáticamente
<button className="btn btn--accent">
  <IndraIcon name="PLUS" />   {/* Se verá en --color-text-inverse (oscuro) */}
  Agregar
</button>

<span style={{ color: 'var(--color-danger)' }}>
  <IndraIcon name="ERROR" />  {/* Se verá rojo */}
  Error al guardar
</span>

<div className="util-hint">
  <IndraIcon name="HELP" />   {/* Se verá en --color-text-tertiary (gris) */}
  Este campo es opcional
</div>
```

---

## 5. CAMBIO DE TEMA

El tema se controla con un solo atributo HTML. Toda la UI responde automáticamente.

```javascript
// En CoreConnectionView.jsx o en el store global
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('indra-theme', next);
}

// Al arrancar la app (en main.jsx o App.jsx)
const savedTheme = localStorage.getItem('indra-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
```

**No necesita Context de React, no necesita estado global.** Los tokens CSS hacen todo el trabajo.

---

## 6. ESTRUCTURA DE ARCHIVOS DE ESTILO

```
system_core/client/src/
├── styles/
│   ├── design_tokens.css       # Capa 1: Variables. ADN visual del sistema.
│   ├── component_styles.css    # Capa 2: Clases reutilizables (btn, mca-surface...)
│   ├── layout.css              # Capa 2: Sistema de layout (stack, shelf, spread, grid)
│   ├── typography.css          # Capa 2: Clases tipográficas (util-label, util-hint...)
│   └── animations.css          # Capa 2: Keyframes y clases de animación
│
├── components/
│   └── utilities/
│       └── IndraIcons.jsx      # Biblioteca de iconos canónica
│
└── main.css                    # Importa todo en orden correcto:
                                # @import './styles/design_tokens.css'
                                # @import './styles/layout.css'
                                # @import './styles/typography.css'
                                # @import './styles/component_styles.css'
                                # @import './styles/animations.css'
```

---

## 7. AXIOMAS DEL DESIGN SYSTEM

### A1 — Token First
Ningún valor visual (color, tamaño, radio, sombra) puede vivir hardcodeado en un componente. Todo debe ser un token o derivarse de un token.

### A2 — El Padre Declara el Layout
Un componente solo define la forma de su contenido interior (padding, background, border). El `display: flex` y el `gap` del contenedor son responsabilidad del componente padre. Un hijo nunca sabe en qué layout vive.

### A3 — Los Iconos son currentColor
Ningún ícono tiene un color fijo. Siempre heredan del contexto de texto. Esto hace que respondan al tema y al estado del componente padre automáticamente.

### A4 — Un Solo Punto de Tema
El tema se controla exclusivamente con `data-theme` en `<html>`. No hay `ThemeProvider`, no hay Context, no hay estado global de tema.

### A5 — Sin Librerías Externas de Iconos
Todos los iconos son SVGs propios en `IndraIcons.jsx`. No se instala Heroicons, Lucide, FontAwesome ni ninguna otra librería. Los iconos son parte de la identidad del sistema.

### A6 — Cero CSS en JS (Excepto Dinámicos)
No se usan styled-components, emotion, ni CSS Modules. El único CSS en JS permitido son los valores que JavaScript necesita computar dinámicamente (posición de drag, ancho de resize).

### A7 — Dark Mode es el Default
El sistema nació en oscuro. El modo claro es una sobrescritura de tokens. Nunca al revés.

---

*La UI de Indra se ve como un sistema de control de tecnología avanzada: oscura, precisa, con destellos de energía cyan. Cada pixel tiene una razón.*
