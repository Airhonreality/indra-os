---
title: "ADR-017: DEEP MERGE HYBRID SOVEREIGNTY"
status: "ACCEPTED"
date: "2026-02-13"
decision_drivers: ["Frontend-Backend Collaboration", "Visual Projection", "Capability Extension"]
replaces: ["Shallow Object Spread in Law_Compiler"]
---

# ADR-017: Merge Profundo Universal (Soberanía Híbrida)

## Contexto
El sistema Indra tiene dos fuentes de verdad para la identidad de los artefactos:
1.  **Backend (Google Apps Script):** Define la estructura semántica, columnas de bases de datos, conexiones físicas.
2.  **Frontend (`Semantic_Manifest.js`):** Define proyecciones visuales, motores de renderizado, capacidades UI-específicas.

### El Problema
La fusión actual en `Law_Compiler.js` usa `spread` superficial (`...item`), lo que causa:
*   **Sobrescritura total:** Si Backend envía `CAPABILITIES`, el Frontend pierde sus capacidades.
*   **Pérdida de extensiones:** El Frontend no puede añadir puertos visuales (ej: columnas de tabla como puertos gráficos).
*   **Conflictos de identidad:** Artefactos virtuales (como `SLOT_NODE`) son sobrescritos por versiones vacías del Backend.

### Caso de Uso Crítico
**Base de Datos de Productos:**
*   Backend envía: `{ columns: ["NOMBRE", "PRECIO"] }`
*   Frontend quiere añadir: `{ CAPABILITIES: { "col:NOMBRE": {...}, "col:PRECIO": {...} } }` (Puertos visuales)
*   Resultado esperado: **Ambas** propiedades coexisten.

## Decisión
Implementamos un **Merge Profundo Universal** en `Law_Compiler.compile()`.

### Reglas de Fusión:
1.  **Prioridad Base:** Frontend (`semanticRef`) es la constitución base.
2.  **Sobrescritura Selectiva:** Backend (`item`) añade/sobrescribe solo campos específicos.
3.  **Merge Recursivo:** Objetos anidados (`CAPABILITIES`, `VITAL_SIGNS`, `DATA_CONTRACT`) se fusionan, no se reemplazan.
4.  **Protección de Virtuales:** Si `semanticRef.isVirtual === true`, el Backend **NO** puede sobrescribir la identidad completa.

### Algoritmo:
```javascript
function deepMerge(base, override) {
    const result = { ...base };
    for (const key in override) {
        if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
            result[key] = deepMerge(result[key] || {}, override[key]);
        } else {
            result[key] = override[key];
        }
    }
    return result;
}
```

## Implementación

### Antes:
```javascript
const compiled = {
    ...item,  // Backend machaca todo
    ARCHETYPE: item.ARCHETYPE || semanticRef.ARCHETYPE || 'SERVICE'
};
```

### Después:
```javascript
const compiled = deepMerge(semanticRef, item);
// Normalización final de campos críticos
compiled.ARCHETYPE = compiled.ARCHETYPE || 'SERVICE';
compiled.DOMAIN = compiled.DOMAIN || 'SYSTEM';
```

## Consecuencias

### Positivas:
*   **Extensibilidad:** El Frontend puede añadir capacidades visuales a cualquier artefacto del Backend.
*   **Complementariedad:** Backend y Frontend colaboran en lugar de competir.
*   **Resolución de Conflictos:** Artefactos virtuales (`isVirtual: true`) mantienen su identidad.

### Negativas:
*   **Complejidad:** El merge profundo es más costoso computacionalmente que el spread (insignificante en la práctica).
*   **Depuración:** Si hay conflictos, es más difícil saber qué propiedad ganó (mitigado con logs).

## Casos de Prueba

### Test 1: Artefacto Virtual Puro
*   **Frontend:** `{ ARCHETYPE: "UTILITY", isVirtual: true }`
*   **Backend:** `{}` (vacío o ausente)
*   **Resultado:** Frontend gana completamente.

### Test 2: Base de Datos con Proyección
*   **Frontend:** `{ CAPABILITIES: { "render_table": {...} } }`
*   **Backend:** `{ columns: ["A", "B"], CAPABILITIES: { "query": {...} } }`
*   **Resultado:** `CAPABILITIES` tiene **ambos**: `render_table` + `query`.

### Test 3: Backend Sobrescribe Dominio
*   **Frontend:** `{ DOMAIN: "LOGIC" }`
*   **Backend:** `{ DOMAIN: "DATA_ENGINE" }`
*   **Resultado:** Backend gana (`DATA_ENGINE`).

## Referencias
*   ADR-016: Clasificación de Utilidades Visuales
*   ADR-014: Pure State UI Hydration
*   `Law_Compiler.js` (Implementación)
