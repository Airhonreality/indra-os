---
title: "ADR-016: CLASSIFICATION AND PROJECTION OF VISUAL UTILITIES"
status: "ACCEPTED"
date: "2026-02-13"
decision_drivers: ["Modular UI Composition", "User Experience", "Tooling Architecture"]
replaces: ["Legacy Slot Definition"]
---

# ADR-016: Clasificación y Proyección de Utilidades Visuales

## Contexto
El sistema necesita distinguir claramente entre **Herramientas Mayores** (Ventanas Completas) y **Herramientas Menores** (Controles Incrustables/Widgets) para construir interfaces complejas de manera modular.
Actualmente, todo se etiqueta confusamente como `NODE`, `SLOT` o `ADAPTER`, lo que impide al `ComponentProjector` saber si debe renderizar una ventana o un control lateral.

## Decisión
Se establece una nueva taxonomía canónica basada en la **Jerarquía de Uso**:

### 1. MACRO-UTILIDADES (`ARCHETYPE: "UTILITY"`)
Son aplicaciones completas que requieren su propia ventana de proyección (Canvas).
- **Ejemplos:**
    - `SLOT_NODE`: Proyector de Formularios (Cotizador).
    - `3D_VIEWER`: Visor de Realidad (Muebles, Arquitectura).
    - `TIMELINE_EDITOR`: Editor de Secuencias.
- **Comportamiento:**
    - Se abren en **Pantalla Completa** o **Ventana Flotante**.
    - Tienen su propio `Engine` dedicado (`SlotEngine`, `RealityEngine`).

### 2. MICRO-UTILIDADES (`ARCHETYPE: "WIDGET"`)
Son herramientas atómicas que **NO** tienen ventana propia. Están diseñadas para ser **Incrustadas** en los paneles de una Macro-Utilidad.
- **Ejemplos:**
    - `COLOR_RAMP`: Editor de Gradientes.
    - `RGB_CURVES`: Ajuste de Color.
    - `VECTOR_MATH`: Operaciones Matemáticas.
- **Comportamiento:**
    - Se renderizan como **Controles Nativos** dentro de la barra lateral de la Macro-Utilidad a la que se conectan.
    - Usan un motor ligero (`WidgetEngine`).

## Implementación Técnica

### A. Manifest Protocol (`ArtifactSelector.jsx`)
Se separan visualmente en dos estantes distintos:
1.  **"HERRAMIENTAS DE PROYECCIÓN" (Macro):** `UTILITY`, `SLOT`, `REALITY`.
2.  **"CONTROLES Y ÁTOMOS" (Micro):** `WIDGET`, `STYLING`, `MATH`.

### B. Archetype Registry
El motor debe saber enrutar cada uno:
```javascript
'UTILITY': SlotEngine,       // Motor Base para Herramientas Mayores
'SLOT': SlotEngine,          // Alias
'WIDGET': WidgetEngine,      // Motor Ligero para Controles Incrustados
'STYLING': WidgetEngine      // Alias para nodos de estilo
```

## Consecuencias
- **Positivo:** Permite construir interfaces complejas (ej: Un Visor 3D con un ColorRamp incrustado) simplemente conectando dos nodos.
- **Positivo:** Limpia el menú de creación separando Apps de Herramientas.
- **Negativo:** Requiere que el `SlotEngine` sepa renderizar `WIDGETS` conectados en su panel lateral.





