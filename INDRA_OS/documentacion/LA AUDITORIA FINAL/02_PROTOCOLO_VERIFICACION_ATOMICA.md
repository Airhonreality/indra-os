# 🛡️ 02: PROTOCOLO DE VERIFICACIÓN ATÓMICA

Este protocolo debe ejecutarse tras cada refactorización para garantizar que la pérdida de contexto no ha corrompido el sistema. Si un solo paso falla, el sistema se considera **Inestable (Beta Solar-Punk Halt)**.

---

## 🔬 Test 1: El Handshake de Identidad (Handshake Check)
**Objetivo:** Verificar que el Core y el Front hablan el mismo idioma sin traductores.
1. Ejecutar `PublicAPI.getSystemHierarchyProjection()`.
2. El JSON resultante **debe** contener claves `STARK_CASE` que coincidan 1:1 con el `FrontAssembler.js`.
3. **Falla si:** Existe algún alias manual (ej: `if (node === 'TokenManager' || node === 'TOKEN_MANAGER')`).

## 🔬 Test 2: Purga de la Constitución (UIDB Audit)
**Objetivo:** Eliminar la ambigüedad en la ley L0.
1. Barrer `System_Constitution.gs`.
2. **Falla si:** Se encuentra cualquier clave duplicada por razones de compatibilidad (ej: `ADMINTOOLS` y `ADMIN_TOOLS`).
3. El `ContractGatekeeper` debe arrojar **0 Warning** de UIDB.

## 🔬 Test 3: Soberanía de Despliegue (Clasp Compliance)
**Objetivo:** Verificar que no hay "leakage" de Front en el Core.
1. Ejecutar `clasp push`.
2. Revisar el archivo `appsscript.json`.
3. **Falla si:** El tamaño del bundle GAS excede los 2MB debido a inyección de vistas o assets que pertenecen a GitHub Pages.

---

## 🎯 Certificación Alpha
El sistema solo se certifica como **ESTABLE** cuando:
1. El `RunAllTests.gs` en el Core es 100% Verde.
2. El `FrontAssembler.js` genera la interfaz completa del Vault Manager basándose solo en el Archetype inyectado, con 0 hardcoded components.

---
*Si no puedes verificarlo atómicamente, no existe.*
