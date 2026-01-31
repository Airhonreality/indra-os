# 🛰️ MATRIX: ARCHITECTURAL INTEGRITY & CONTRACT GOVERNANCE (v1.5)

## 1. DEFINICIÓN DE ARQUETIPOS (MCEP CANONICAL)

| Arquetipo | Propósito | Visibilidad UI (Bridge) | Validación Requerida |
| :--- | :--- | :--- | :--- |
| **ADAPTER** | Conector con sistema externo (Drive, WhatsApp) | ✅ Visible | Schemas de I/O completos, Semantic Intent |
| **SERVICE** | Lógica granular interna (Math, Text) | ✅ Visible | Schemas de I/O, Pureza técnica |
| **VAULT** | Gestión de secretos y tokens (TokenManager) | ✅ Visible (Settings) | Schemas de seguridad, Encriptación |
| **ORCHESTRATOR**| Motores de flujo e inteligencia (LLM, Architect) | ✅ Visible | Full MCEP Interface |
| **SYSTEM_CORE** | Infraestructura crítica (ErrorHandler, Config) | ❌ Oculto | Verificación de existencia y salud |
| **LEGACY** | Artefactos en proceso de refactorización | ⚠️ Condicional | Solo verificación de presencia |

---

## 2. AUDIT MATRIX POR COMPONENTE (ESTADO ACTUAL VS OBJETIVO)

| Nodo | Arquetipo Actual | Arquetipo Objetivo | Acción de Curación |
| :--- | :--- | :--- | :--- |
| `drive` | DEFAULT | **ADAPTER** | Añadir schemas completos (MCEP) |
| `sheet` | DEFAULT | **ADAPTER** | Añadir schemas completos (MCEP) |
| `llm` | BRIDGE | **ORCHESTRATOR** | Validar que `chat` tenga I/O definidos |
| `tokenManager`| VAULT | **VAULT** | Cambiar visibilidad en UI (debe ser visible) |
| `config` | GATE | **SYSTEM_CORE** | Mantener oculto pero validar integridad |
| `sensing` | BRIDGE | **SERVICE** | Renombrar arquetipo para evitar exclusión |
| `indra` | ADAPTER | **ADAPTER** | Asegurar schemas para el Skeleton Console |

---

## 3. IMPLEMENTACIÓN DE INTELIGENCIA EN ENSAMBLAJE

### A. Backend (`SystemAssembler.gs`)
- Cada nodo registrado en `nodesRegistry` **DEBE** poseer la propiedad `archetype`.
- Eliminar la dependencia de nombres específicos. El Core decide qué proyectar basado en el metadato del arquetipo.

### B. Frontend (`SystemRegistry.jsx`)
- Se elimina el array `excludedNodes`.
- El filtro ahora es: `if (node.archetype === 'SYSTEM_CORE') return false;`.
- Se añade soporte para el nuevo arquetipo `VAULT` con micro-iconografía de seguridad.

### C. Validación (`SystemIntegrity.spec.js`)
- El validador ahora es "Archetype-Aware":
    - Si es `ADAPTER`, falla si no tiene `schemas.find` o similar.
    - Si es `SYSTEM_CORE`, solo valida que responda a un ping básico.

---

## 4. PRÓXIMOS PASOS (PLAN DE ACCIÓN)

1. **[Back]** Modificar `PublicAPI.getSystemContracts` para que destile basándose estrictamente en arquetipos.
2. **[Back]** Inyectar arquetipos faltantes en `SystemAssembler.gs`.
3. **[Front]** Refactorizar `SystemRegistry.jsx` para eliminar el hardcode.
4. **[Tests]** Actualizar la suite de integridad para seguir esta matriz.
