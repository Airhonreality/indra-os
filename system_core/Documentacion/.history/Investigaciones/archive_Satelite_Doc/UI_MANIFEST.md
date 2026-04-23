# 📐 UI MANIFEST: El Axioma del Diseño Líquido (v1.0)

Este documento rige la proyección visual de cualquier artefacto en el ecosistema Indra. La rigidez es el enemigo; la fluidez es la norma.

## 🌊 1. El Axioma de la Liquidez (Liquid UI)
La interfaz de Indra no se "coloca", se "proyecta".

1.  **PROHIBICIÓN TOTAL DEL PÍXEL ESTRUCTURAL:** 
    *   Queda prohibido el uso de `px` para definir anchos, altos, márgenes o paddings en contenedores maestros. 
    *   **Estándar:** Usa exclusivamente `%`, `vh`, `vw`, `em` o `rem`.
2.  **MOBILE-FIRST MANDATORY:**
    *   Todo componente debe nacer funcional en **320px**. El escalado a escritorio es una consecuencia de la fluidez, no el objetivo inicial.
3.  **AUTO-LAYOUT (FLEX/GRID):**
    *   El posicionamiento manual es un antipatrón. Confía en el flujo orgánico de Flexbox y Grid con valores de auto-ajuste.

## 🤖 2. Autodibujado (Cero Código Manual)
El éxito de un Satélite se mide por la ausencia de código de renderizado redundante.

*   **Hydración Fantasma:** Usa el Hub para inyectar componentes.
*   **Generador de Formularios:** No escribas etiquetas `<input>` manuales. Usa `kernel.UI.getFormGenerator(schema)` para que la UI sea una proyección directa del ADN (ADN -> UI).

## 🎨 3. Estética Canónica (Indra Standard)
*   **Colores:** Usa las variables del sistema (`--indra-accent`, `--indra-bg`, etc.).
*   **Tipografía:** Inter (Cuerpo) y Outfit (Títulos).
*   **Superficies:** Glassmorphism nítido, bordes de 1px con opacidad reducida.

---
*Si rompes la fluidez, rompes la experiencia de Indra.* 🛰️💎🔥
