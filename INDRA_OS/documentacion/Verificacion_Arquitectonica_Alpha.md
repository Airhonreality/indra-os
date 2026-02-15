# 🛡️ Verificación Arquitectónica Post-Proceso (Modelo Alpha)

Este documento detalla la estructura final esperada y los requisitos axiomáticos para INDRA OS v5.6.2 tras la refactorización de contención de entropía.

---

## 🏛️ I. Estructura de Capas (Topología Ideal)

### 1. El Genotipo (INDRA_CORE - L0)
**Archivo Maestro:** `System_Constitution.gs`
- **Requisito:** Todas las entradas en `COMPONENT_REGISTRY` deben seguir el patrón `AXIOM_CASE` (ej. `DRIVE_ADAPTER`, `TOKEN_MANAGER`).
- **Función:** Proyectar el ADN del sistema sin conocer la forma final de la UI.

### 2. Los Ensambladores (Assemblers)
| Entorno | Nombre Canónico | Responsabilidad Axiomática |
| :--- | :--- | :--- |
| **INDRA_CORE** | **`CoreAssembler.gs`** | Cableado de Dependencias. Inyecta adaptadores en servicios. |
| **INDRA_SKIN** | **`SkinAssembler.js`** | Manifestación de Fenotipo. Traduce Archetypes a Componentes React. |

---

## 🧬 II. Requisitos Axiomáticos de Integridad

### Axioma 1: Independencia de Nomenclatura
> "No existirán alias ni puentes de traducción manual para nombres de componentes."
- **Evidencia:** Si el Core registra `TOKEN_MANAGER`, el Skin **debe** buscar `TOKEN_MANAGER`. Cualquier mapeo intermedio (como `TokenManager` o `tokenmanager`) se considera **corrupción de señal**.

### Axioma 2: Headless Logic (GAS Purity)
> "El Core no procesa vistas; el Core procesa leyes."
- **Evidencia:** El `clasp push` debe contener 0 archivos con lógica de renderizado web pesado. Solo scripts `.gs` puros.

### Axioma 3: Handshake de Soberanía (The Kernel)
> "El Skin solo despierta si el Core certifica su propia integridad."
- **Evidencia:** El `ProjectionKernel.gs` debe ejecutar un `preflightCheck` (vía `ContractGatekeeper`) antes de entregar el Genotipo al Skin.

---

## 🚀 III. Plan de Ensamblaje Final (Post-Refactor)

1.  **Sincronización Ontológica:** Unificar todos los adaptadores (Drive, Sheet, LLM) bajo el mismo ID de la Constitución.
2.  **Cableado Neuronal:** El `CoreAssembler.gs` genera una `PublicAPI` limpia y tipada.
3.  **Proyección Solar-Punk:** El Skin (vía GitHub Pages) consume la `PublicAPI` y usa el `SkinAssembler.js` para construir el despliegue dinámico sin hardcoding.

### Matriz de Verificación (Checklist)
- [ ] ¿Coinciden el ID de `DriveAdapter.gs` con la clave en `System_Constitution`?
- [ ] ¿El `clasp push` arroja 0 violaciones UIDB en el `ContractGatekeeper`?
- [ ] ¿El Skin puede renderizar el Vault Manager solo con leer el `archetype: VAULT`?
- [ ] ¿El archivo `CoreAssembler.gs` existe y reemplaza a `SystemAssembler.gs`?
- [ ] ¿El archivo `SkinAssembler.js` existe en `INDRA_SKIN/src/core/`?

---

## 🔬 IV. Protocolo de Certificación Atómica

### Test 1: Handshake de Identidad
**Objetivo:** Verificar que Core y Skin hablan el mismo idioma sin traductores.
1. Ejecutar `PublicAPI.getSystemHierarchyProjection()`.
2. El JSON resultante **debe** contener claves `AXIOM_CASE` que coincidan 1:1 con el `SkinAssembler.js`.
3. **Falla si:** Existe algún alias manual (ej: `if (node === 'TokenManager' || node === 'TOKEN_MANAGER')`).

### Test 2: Purga de la Constitución (UIDB Audit)
**Objetivo:** Eliminar la ambigüedad en la ley L0.
1. Barrer `System_Constitution.gs`.
2. **Falla si:** Se encuentra cualquier clave duplicada por razones de compatibilidad (ej: `ADMINTOOLS` y `ADMIN_TOOLS`).
3. El `ContractGatekeeper` debe arrojar **0 Warning** de UIDB.

### Test 3: Soberanía de Despliegue (Clasp Compliance)
**Objetivo:** Verificar que no hay "leakage" de Skin en el Core.
1. Ejecutar `clasp push` desde `INDRA_CORE`.
2. Revisar el archivo `appsscript.json`.
3. **Falla si:** El tamaño del bundle GAS excede los 2MB debido a inyección de vistas o assets que pertenecen a GitHub Pages.

### Test 4: Auto-Ignición del Skin
**Objetivo:** Verificar que el Skin genera la UI basándose solo en la proyección.
1. Cargar `INDRA_SKIN` en localhost.
2. El `SkinAssembler.js` debe leer la proyección del Core.
3. **Falla si:** Existe algún componente hardcodeado que no esté definido en `Visual_Grammar.gs`.

---

## 🎯 V. Certificación Alpha

El sistema solo se certifica como **ESTABLE** cuando:
1. El `RunAllTests.gs` en el Core es **100% Verde** (0 fallos).
2. El `SkinAssembler.js` genera la interfaz completa del Vault Manager basándose solo en el Archetype inyectado, con **0 hardcoded components**.
3. No existen alias de compatibilidad en `System_Constitution.gs`.
4. Los nombres de archivo coinciden con el Master Schema Canónico:
   - `INDRA_CORE/1_Core/CoreAssembler.gs` ✅
   - `INDRA_SKIN/src/core/SkinAssembler.js` ✅

---

*Este documento es la brújula para la fase final de implementación. Si no puedes verificarlo atómicamente, no existe.*





