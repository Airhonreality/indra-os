---
title: ADR-014: Pure State & UI Hydration Architecture
status: PROPOSED
date: 2026-02-12
author: Antigravity Agent
tags: [architecture, state, react, serialization]

# 1. El Axioma Fundamental
**"El Estado es Datos Puros. La UI es su manifestación hidratada."**

El almacenamiento persistente (IndexedDB, LocalStorage, Backend) y el transporte de datos (JSON) son hostiles a conceptos de tiempo de ejecución como `Functions`, `Classes` o `React Components`. Intentar persistirlos causa corrupción (`DataCloneError`) o pérdida de comportamiento.

# 2. Mapa Relacional de la Visión

La arquitectura se divide en tres estratos claramente definidos:

```mermaid
graph TD
    subgraph L2_STORAGE ["L2: Estado Sobereano (El Subconsciente)"]
        direction TB
        StateJSON[("Artefacto JSON")]
        StateJSON -- "Contiene" --> ID["id: 'vault_01'"]
        StateJSON -- "Contiene" --> KeyIcon["iconKey: 'VAULT_ICON'"]
        StateJSON -- "Contiene" --> KeyAction["actionKey: 'EXECUTE_AUDIT'"]
        note1[/"Solo Datos Serializables (Strings, Numbers, Arrays)"/]
    end

    subgraph L3_MEMBRANE ["L3: Membrana de Hidratación (El Traductor)"]
        direction TB
        Hydrator["Hook / Mapper"]
        IconMap["IconRegistry { 'VAULT_ICON': <VaultSV /> }"]
        ActionMap["ActionRegistry { 'EXECUTE_AUDIT': fn() }"]
        Hydrator -- "Busca" --> IconMap
        Hydrator -- "Busca" --> ActionMap
    end

    subgraph L4_SURFACE ["L4: Superficie de Renderizado (La Conciencia)"]
        direction TB
        Component["<Card />"]
        Component -- "Recibe" --> PropIcon["prop: icon={ <VaultSVG /> }"]
        Component -- "Recibe" --> PropFn["prop: onClick={ fn() }"]
    end

    StateJSON --> Hydrator
    Hydrator --> Component
```

# 3. Diseño Axiomático

### Axioma 1: La Ley de Serialización
*   **En el Store:** NUNCA guardarás una función. NUNCA guardarás un componente React.
*   **En el Store:** Guardarás **Significantes** (Keys/Strings) que representen esa función o componente.
    *   ❌ `icon: <Icons.Vault />`
    *   ✅ `icon: "VAULT"`

### Axioma 2: La Ley de Hidratación Tardía
*   La conversión de `String -> Objeto Funcional` ocurre **únicamente** en el momento del renderizado (Render Time).
*   El componente es responsable de saber cómo interpretar sus props de datos.

### Axioma 3: Diccionarios Estáticos
*   Deben existir mapas estáticos (Registros) que vinculen las Keys con las Implementaciones.
*   Esto desacopla los datos de la implementación visual (puedes cambiar el pack de iconos sin tocar la DB).

# 4. Implementación Práctica

### A. El Registro (Static Dictionary)
```javascript
// src/4_Atoms/IconRegistry.js
import { Icons } from './IndraIcons';

export const ICON_MAP = {
    "VAULT": Icons.Vault,
    "DATABASE": Icons.Database,
    "TERMINAL": Icons.Terminal,
    "GHOST": Icons.Ghost
};

export const resolveIcon = (key, DefaultIcon = Icons.Help) => {
    return ICON_MAP[key] || DefaultIcon; // Fallback seguro
};
```

### B. El Estado (Pure Data)
```javascript
// En MockFactory o Base de Datos
const artifact = {
    id: "slot_1",
    capabilities: {
        "render": { label: "Proyectar", iconKey: "TV_SCREEN", actionKey: "PROJECT_VIEW" }
    }
};
```

### C. El Render (Hydration)
```javascript
// SlotEngine.jsx
import { resolveIcon } from '../atoms/IconRegistry';
import { resolveAction } from '../logic/ActionRegistry';

const CapabilityButton = ({ config }) => {
    // HIDRATACIÓN EN TIEMPO REAL
    const IconComponent = resolveIcon(config.iconKey); 
    const actionFn = resolveAction(config.actionKey);

    return (
        <button onClick={actionFn}>
            <IconComponent />
            {config.label}
        </button>
    );
};
```

# 5. Beneficios Estratégicos
1.  **Persistencia Indestructible:** IndexedDB nunca fallará por errores de clonación.
2.  **Transportabilidad:** El el estado puede enviarse por red (WebSocket/HTTP) sin serialización especial.
3.  **Hot-Swapping Visual:** Cambiar el tema de iconos cambia toda la app instantáneamente sin migrar datos.
4.  **Auditabilidad:** El estado es 100% legible por humanos en los logs.
---





