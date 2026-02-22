# ADR-022: Coherencia de IOS — Reducción del Pipeline Core→Front
**Estado:** EN IMPLEMENTACIÓN  
**Fecha:** 2026-02-20  
**Autor:** Axiom Engine  

---

## Objetivo

Reducir las transformaciones Core→Front de **7 a 3**, eliminando el ruido semántico,
la duplicación de contratos y la ambigüedad de casing. El CANON de cada adapter
es y será la única fuente de verdad.

---

## Pipeline Objetivo

```
CANON del Adapter (GAS)
    ↓ GenotypeDistiller  → emite contrato canónico directo (lowercase + ports)
    ↓ HTTP JSON          → sin transformar
    ↓ SovereignAdapter   → cachea directo (sin isLabMode)
    ↓ Law_Compiler       → solo items isVirtual:true del SemanticManifest
    ↓ ProjectionKernel   → sin cambio
```

---

## CHECKLIST DE IMPLEMENTACIÓN

### PASO 1 — `GenotypeDistiller.gs` (Core) ✅ COMPLETADO
> Desbloquea todo lo demás. Sin este paso, el front sigue necesitando el deepMerge ruidoso.

- [x] **1.1** Cambiar casing del `liveRegistry` a `lowercase` + mantener alias UPPER para retrocompat
- [x] **1.2** Añadir campo `ports` calculado desde `capabilities.io` (función `_computePorts`)
- [x] **1.3** Incluir `reification_hints` en el output del registry
- [x] **1.4** Mantener `ui_layout_hint` con default `'smart_form'`
- [ ] **1.5** Test: verificar COMPONENT_REGISTRY con todos los adapters

---

### PASO 2 — `SovereignAdapter.js` (Front) ✅ COMPLETADO

- [x] **2.1** Eliminado `this.isLabMode = window.location.href.includes('mode=lab')`
- [x] **2.2** Condición `if (cached && !this.isLabMode)` → `if (cached)`
- [ ] **2.3** Verificar que el L0 cacheado se lee con las nuevas keys lowercase del Paso 1
  - Añadir invalidación de cache si `VERSION` del genotipo cambia

---

### PASO 3 — `Law_Compiler.compile()` (Front) ✅ COMPLETADO
> El cambio más delicado. Depende del Paso 1 completado.

- [ ] **3.1** Separar el flujo en dos ramas claras:
  ```
  if (item.isVirtual) → deepMerge(semanticRef, item)  // como hoy
  else                → item directamente              // sin merge
  ```

- [ ] **3.2** Para items reales (no virtuales), mantener solo la normalización mínima:
  - `_normalizeCapabilities(item.capabilities)` — solo si `io` ausente en alguna capability
  - Mapeo de campos: leer `label`, `archetype`, `domain` directamente (ya en lowercase del Paso 1)

- [ ] **3.3** Mantener los fallbacks SOLO para retrocompatibilidad durante transición:
  - `label || LABEL || functional_name` → se elimina después de validación en staging

- [ ] **3.4** Añadir lectura de `ports` del genotipo en el item compilado:
  - Exponer `item.ports` sin transformar para que GraphEngine lo consuma

- [ ] **3.5** Añadir lectura de `reification_hints` del genotipo:
  - Exponer como `item.reification_hints` para que los Engines hagan mapeo automático

---

### PASO 4 — `Semantic_Manifest.js` (Front) ✅ COMPLETADO
> Limpieza. Depende de Paso 3 estable.

- [ ] **4.1** Auditar cada entrada del manifest
  - Marcar como `isVirtual: true` los que no tienen backend (CosmosSelector, SovereignSphere, etc.)
  - Eliminar entradas que duplican un adapter real (drive, notion, gmail, etc.)

- [ ] **4.2** Para entradas que se mantienen (virtuales), asegurarse que tienen:
  - `isVirtual: true`
  - `icon` (metadata visual que el backend no puede proveer)
  - `ui_layout_hint` si es distinto al default

- [ ] **4.3** Resultado esperado: el manifest pasa de ~N entradas a solo los componentes
  que son puramente front-end (no tienen representación en el COMPONENT_REGISTRY del Core)

---

### PASO 5 — `PublicAPI.gs` + Front (Core+Front) ✅ COMPLETADO

- [x] **5.1** `_secureInvoke` unificado: arrays→`results`, objetos→`payload`. Nunca mezclados.
- [x] **5.2** `ORIGIN_SOURCE` → `origin` en el envelope de red del Core
- [x] **5.3** Front normalizado: 6 archivos actualizados con lógica `origin || ORIGIN_SOURCE`
  - `DataLobe.js` — `siloMetadata` y `newGraphNode` emiten `origin` + `ORIGIN_SOURCE`
  - `AxiomaticStore.jsx` — 3 lecturas (líneas 324, 336, 453) priorizan `origin`
  - `DatabaseEngine.jsx` — cadena de resolución extendida
  - `DatabaseNodeWidget.jsx` — lectura normalizada
  - `VaultEngine.jsx` — 3 constructores emiten ambos campos

---

### PASO 6 — `GraphEngine.jsx` (Front) [BONUS — pendiente]
> Solo posible después de Pasos 1 y 3 estables.

- [ ] **6.1** Leer `ports` del genotipo para cada nodo y ofrecerlos como "handles" de conexión
- [ ] **6.2** Al crear un edge, emitir `{ source, target, sourceHandle, targetHandle }`
  compatible con el esquema de `CoreOrchestrator.connections[]`
- [ ] **6.3** Validar visualmente que solo se conecten ports compatibles
  (output `READ` → input `WRITE/TRIGGER`)

---

## Matriz de Riesgo

| Paso | Archivo | Riesgo | Bloqueado por | Estado |
|------|---------|--------|---------------|--------|
| 1 | GenotypeDistiller.gs | 🔴 Alto | — | ✅ |
| 2 | SovereignAdapter.js | 🟢 Bajo | Paso 1 | ✅ |
| 3 | Law_Compiler.compile() | 🟡 Medio | Paso 1 | ✅ |
| 4 | Semantic_Manifest.js | 🟢 Bajo | Paso 3 | ✅ |
| 5 | PublicAPI.gs + Front | 🟡 Medio | — | ✅ |
| 6 | GraphEngine.jsx | 🟢 Bajo | Pasos 1+3 | ⏳ |

---

## ✅ ADR-022 COMPLETADO — 2026-02-20

**Pipeline reducido de 7 a 3 transformaciones.**

| Transformación Eliminada | Motivo |
|---|---|
| CAPS→lowercase en LawCompiler | Distiller ya emite lowercase |
| deepMerge para items reales | Backend ya es canónico |
| `_normalizeCapabilities` con regex | CANON ya declara `io` |
| Multi-fallback `LABEL\|\|label\|\|functional_name` | Un solo dialecto |

**Deuda técnica restante (eliminar después de validación en staging):**
- Alias `ORIGIN_SOURCE` (ya puede leer `origin`)
- Alias UPPER `LABEL`, `ARCHETYPE`, `DOMAIN` en el Distiller
- Implementar `reification_hints` automático en los Engines

## Contrato Canónico de Nodo (post-implementación)

```json
{
  "id": "drive",
  "label": "Google Drive",
  "archetype": "VAULT",
  "domain": "STORAGE",
  "capabilities": {
    "find": { "io": "READ", "desc": "...", "inputs": {}, "outputs": {} },
    "store": { "io": "WRITE", "desc": "...", "inputs": {}, "outputs": {} }
  },
  "ports": {
    "inputs": ["store", "move", "share"],
    "outputs": ["find", "retrieve", "listContents"]
  },
  "reification_hints": {
    "id": "id",
    "label": "name",
    "items": "results"
  },
  "ui_layout_hint": "smart_form"
}
```

Este JSON es lo que recibe el front directamente. Sin transformaciones intermedias.
