# Plan de Implementación v6.2: Sinceridad Radical y Auditoría UI

Este plan aborda la necesidad de documentar con rigor de "contrato" la arquitectura v6.0 y preparar la UI para la unificación relacional definitiva.

## 📜 1. Fase I: Sinceridad Radical (Documentación)

### 1.1 Documentación del Core (Comentarios Quirúrgicos)
Inyectaremos comentarios detallados en los siguientes puntos neurálgicos, definiendo **Axiomas**, **Contratos de Entrada** (UQO) y **Garantías de Salida**:
- **`provider_system_ledger.gs`**: Documentar el motor CRUD de grafos (`ledger_sync_relation`).
- **`protocol_router.gs`**: Explicar el "Tejido Relacional" (Weaving) donde los vínculos se inyectan en los átomos.
- **`mount_manager.gs`**: Detallar el ciclo de vida de los Puertos JIT y la volatilidad de monturas.
- **`provider_system_infrastructure.gs`**: Definir el contrato del nuevo protocolo `RELATION_SYNC`.

### 1.2 Actualización de ADRs (La Biblia v6.0)
- **ADR 050 (JIT):** Añadir el diagrama de secuencia del Handshake JIT y el modelo de seguridad `ACL_JSON`.
- **ADR 051 (Graphs):** Detallar la semántica de flechas Yoneda y el impacto en la latencia de red.

---

## 🔍 2. Fase II: Auditoría y Desacople de la UI

Basado en la investigación, ejecutaremos el "Corte de Cables" en los Macro-Motores:

### 2.1 Desbloqueo del App.jsx (Polimorfismo)
- **Problema:** Levantamiento de motor basado estrictamente en `atom.class`.
- **Evolución:** Implementar un `ResolutionEngine` que sugiera motores basados en la clase OR en las **Relaciones** del átomo (v6.1).

### 2.2 Auditoría de Motores Individuales (Identificación de Hardcoding)
- **DocumentDesigner:**
    - **Punto Crítico:** Presets de media (`MEDIA_PRESETS`) grabados en el código.
    - **Solución:** Deben ser configuraciones externas vinculadas vía relación `STYLE_CONFIG`.
- **Bridge/Workflow Designer:**
    - **Punto Crítico:** Listas manuales de `sources`, `targets` y `stations` en el payload.
    - **Solución:** Sustituir por consultas asíncronas a la malla relacional (`MEMBER_OF`, `EXECUTES_ON`).
- **SchemaDesigner:**
    - **Punto Crítico:** Estados `DRAFT/LIVE` hardcodeados en la UI.
    - **Solución:** Los estados deben ser proyectados desde el metadato del átomo según su flujo activo.

---

## ✅ 3. Plan de Verificación

1. **Check de Auditoría:** Verificar que el `App.jsx` puede levantar un motor alternativo mediante una prueba de concepto relacional.
2. **Review de Código:** Revisar que los comentarios en el Core cumplen con el estándar de "Manual de Instrucciones".

---
*Indra OS v6.2 — Sinceridad en el código, fluidez en la malla.*
