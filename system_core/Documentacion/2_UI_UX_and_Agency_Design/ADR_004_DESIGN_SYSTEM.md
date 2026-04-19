# ADR_004 — DESIGN SYSTEM: Tokens, Estilos, Layout e Iconografía

> **Versión:** 2.0 (Actualizado según implementación real)
> **Estado:** VIGENTE — Documento fundacional del sistema de diseño
> **Estética:** Tony Stark × Glassmorphism × Solar Punk HUD
> **Principio rector:** Un cambio en un token cambia el 100% de la UI.

---

## 1. PROPÓSITO

Este sistema de diseño centraliza la identidad visual de Indra. La arquitectura se basa en capas de abstracción para garantizar que la UI sea coherente, escalable y fácil de tematizar.

**La pirámide de responsabilidades:**

```
Capa 1: design_tokens.css     → El ADN. Variables puras.
Capa 2: layout.css            → Lógica espacial (Flex/Grid/Slots).
Capa 3: component_styles.css  → Clases reutilizables (btn, glass, input).
Capa 4: main.css              → Reset, body HUD y scrollbars.
```

---

## 2. CAPA 1 — DESIGN TOKENS (`design_tokens.css`)

### 2.1 Paleta de Color (Tema Oscuro - Default)

```css
:root {
  /* Fondos HUD */
  --color-bg-void:      #020408;  /* Fondo absoluto */
  --color-bg-deep:      #050810;  /* Fondo base profundo */
  --color-bg-surface:   #0d1117;  /* Superficies de contenedores */
  --color-bg-elevated:  #161b22;  /* Paneles elevados */
  --color-bg-float:     #1c2128;  /* Portales flotantes */
  --color-bg-hover:     #21262d;  /* Estado de interacción */

  /* Acento Solar Punk */
  --color-accent:       #00f5d4;  /* Cian neón */
  --color-accent-dim:   rgba(0, 245, 212, 0.1);
  --color-accent-glow:  rgba(0, 245, 212, 0.2);

  /* Semánticos */
  --color-warm:       #f5a623;    /* Ámbar (Warnings) */
  --color-cold:       #7c6af7;    /* Violeta (Relaciones) */
  --color-danger:     #ff4655;    /* Rojo industrial (Errores) */
  --color-success:    #3fb950;    /* Verde neón (Confirmación) */

  /* Glassmorphism */
  --glass-bg:         rgba(13, 17, 23, 0.7);
  --glass-light:      rgba(255, 255, 255, 0.03);
  --glass-border:     rgba(255, 255, 255, 0.1);
}
```

### 2.2 Efectos HUD y Gradientes

Nuevos tokens añadidos para la profundidad visual del sistema:
- `--grad-hud`: Gradiente radial del fondo principal (`radial-gradient`).
- `--hud-scanline`: Barrido de líneas horizontales para textura de monitor.
- `--hud-grid`: Patrón de cuadrícula técnica subyacente.
- `--blur-glass`: Desenfoque de 16px para superficies transparentes.

---

## 3. CAPA 2 — LAYOUT Y CONTAINERS (`layout.css`)

El sistema utiliza el concepto de **Slots** para la jerarquía visual, sustituyendo el concepto previo de MCA genérico.

### 3.1 Slots de Estructura
- `.slot-large`: Contenedor principal para motores. Fondo `--color-bg-deep` y bordes acentuados.
- `.slot-small`: Micro-contadores para tarjetas y atributos. Usan `--color-bg-surface` y reaccionan al hover.

### 3.2 Lógica Flexbox
- `.stack`: Columna vertical con gaps variables (`--tight`, `--loose`).
- `.shelf`: Fila horizontal centrada.
- `.spread`: Fila con `space-between` para empujar elementos a los extremos.
- `.fill`: Expansión automática al espacio disponible (`flex: 1`).

---

## 4. CAPA 3 — COMPONENT STYLES (`component_styles.css`)

### 4.1 Botones e Inputs
- `.btn`: Botón base transparente con bordes de 1px.
- `.btn--accent`: Botón sólido de color cian con efecto brillo (`shadow-glow`).
- `.input-base`: Input técnico con enfoque acentuado.
- `.util-input--sm`: Input especializado (10px, mono) para inspectores de propiedades.

### 4.2 Tipografía Técnica
- `.text-label`: 10px, negrita, mayúsculas, color secundario.
- `.util-label`: 8px, cian (`--color-accent`), fuente mono. Utilizada para metadatos de propiedades.

---

## 5. ICONOGRAFÍA — INDRA ICON SYSTEM

### 5.1 Especificación Técnica
- **Viewport:** 16x16.
- **StrokeWidth:** 1.5 (Afilado e industrial).
- **Style:** `strokeLinecap: 'square'`, `strokeLinejoin: 'miter'`.
- **Color:** `currentColor` (Heredado del padre).

### 5.2 Vocabulario Canónico (Fragmento Real)
- `ATOM / WORKSPACE`: Identidad de sistema.
- `SCHEMA / DOCUMENT / BRIDGE`: Motores macro.
- `FLOW / LINK / SYNC`: Acciones de datos.
- `MATH / TEXT / EXTRACTOR / LOGIC`: Operadores de lógica.
- `TARGET / TERMINAL`: Puntos finales de ejecución.

---

## 6. ESTRUCTURA DE ARCHIVOS

La implementación real del sistema de diseño se organiza en:

```
system_core/client/src/
├── styles/
│   ├── design_tokens.css       # ADN Visual y variables HUD.
│   ├── layout.css              # Lógica espacial y Slots.
│   ├── component_styles.css    # Clases de componentes (btns, inputs, util-labels).
│   └── main.css                # Orquestador, Reset y Scrollbar personalizada.
│
└── components/utilities/
    └── IndraIcons.jsx          # Biblioteca de iconos vectorial propia.
```

---

## 7. AXIOMAS ACTUALIZADOS

1.  **A1 — Token First:** Ningún valor visual es literal; debe ser un token CSS.
2.  **A2 — Slot Hierarchy:** Toda UI debe vivir dentro de un `.slot-small` o `.slot-large`.
3.  **A3 — HUD Texture:** Todo fondo de nivel 0 debe tener el patrón de cuadrícula y scanline.
4.  **A4 — Herencia de Iconos:** Los iconos nunca fuerzan color; se adaptan al `.btn` o `.text` donde residen.
5.  **A5 — Scrollbar Integrada:** La scrollbar no es un elemento nativo del SO, es una pieza del diseño (pianu, floating thumb).
6.  **A6 — Prohibición de Estilos Inline:** Ningún componente debe definir estilos dinámicos (opacidad, colores, bordes) mediante el atributo `style` de React. Se DEBE usar el mecanismo de Atributos de Datos (`data-*`) para que el motor de CSS tenga la soberanía absoluta de la representación visual.

---
*Este documento es la fuente de verdad técnica para la UI. Toda contradicción con el código debe resolverse priorizando esta especificación.*

