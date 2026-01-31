# Blueprint: Suite de Verificación Multicapa (MCEP v11.0 - Zero Debt)

Este documento describe la arquitectura de integridad absoluta del OrbitalCore v11.0. El sistema ha alcanzado el hito de "Deuda Cero", eliminando todo rastro de patrones legacy para priorizar la soberanía criptográfica y la pureza estructural.

## 0. Canon Arquitectónico: El Sol Negro

El Orbital Core es el motor de orquestación soberana. Si el Satélite es la cabina de mando (Energía), el Core es la ingeniería (Materia) que interactúa con la realidad física.

### Axiomas Inmutables
1.  **El Flujo JSON es el Cerebro**: El Core es un Intérprete Agnóstico; la lógica reside en el mapa `.flow`.
2.  **Director de Orquesta**: El Core coordina Adaptadores mediante Inyección de Dependencias. No posee lógica de negocio.
3.  **Soberanía por Anclaje**: Toda persistencia debe estar anclada en el entorno del usuario (Google Drive).
4.  **Agnosticismo de Interfaz**: El Core sirve a cualquier Satélite federado validando solo el contrato.
5.  **Identidad Soberana (Yoneda)**: Todo resultado se ancla perpetuamente en el árbol `nodes` bajo el ID del paso.

### Arquitectura de Capas
*   **Capa 0 (Entrypoints)**: Puertas de entrada (Triggers). Validan la intención.
*   **Capa 1 (Orchestration)**: El motor `CoreOrchestrator`. Administra el contexto y los snapshots.
*   **Capa 2 (Logic Services)**: Nodos puros (`math`, `text`, `date`, `collection`, `flow`).
*   **Capa 3 (Adapters)**: Puentes físicos (`Drive`, `Notion`, `LLM`, `Indra`).

---

## 1. Escalamiento de Verificación (Niveles)

1.  **Nivel 0: Pre-Flight & Hardening (Vault & Bridge)**
    *   **Objetivo:** Garantizar que los cimientos criptográficos y estructurales son sólidos antes del arranque.
    *   **Artefactos:** `SystemInitializer.gs` (Vault Probe), `SystemAssembler.gs` (Registry Proxy).
    *   **Garantía:** El sistema aborta si el Vault es inaccesible o si hay un fallo de inicialización circular.

2.  **Nivel 🥇: Atómico (Unit Tests)**
    *   **Objetivo:** Validar adaptadores y lógica pura.
    *   **Garantía:** Los componentes cumplen su contrato `io_interface`.

3.  **Nivel 🥈: Pureza Semántica (AI-Gatekeeper)**
    *   **Objetivo:** Validar la soberanía del branding y la intención semántica.
    *   **Garantía:** Bloqueo de léxico prohibido e impurezas léxicas detectadas por IA.

4.  **Nivel 🥉: Morfismos L5+ (FlowCompiler)**
    *   **Objetivo:** Compatibilidad profunda de esquemas anidados.
    *   **Garantía:** Integridad de tipos recursivos en el grafo de ejecución.

5.  **Nivel 🎗️: Handshake Reactivo (validateTopology)**
    *   **Objetivo:** Sincronización instantánea UI-Core.
    *   **Garantía:** Zero-lag en el feedback de diseño del canvas.

---

## 2. Matriz Dharma de la Suite

| Suite / Artefacto | Dharma (Propósito Sagrado) | Garantía Industrial |
| :--- | :--- | :--- |
| **Registry Proxy** | Centinela de Arranque | Previene accesos prematuros en DI circular. |
| **Vault Probe** | Guardián del Secreto | Asegura que el canal cifrado está operativo. |
| **ContractGatekeeper** | Auditor de Pureza | Centraliza toda la lógica semántica y formal. |
| **CoreOrchestrator** | Director Inmutable | Snapshots deterministas sin rastro de legacy hacks. |

---

## 3. Garantías y Resiliencia

### Garantías
*   **Zero Speculation:** Ejecución estricta sobre contratos verificados.
*   **Identidad Soberana:** Identificadores únicos y persistentes (Yoneda Core).
*   **Determinismo Radical:** Eliminación de variables manuales (`outputAs`); el `id` es el contrato.

### Gestión de Riesgos (Residual Debt Managed)
*   **Metabolismo de Heap:** Controlado vía poda de historial (5 steps).
*   **Async Reactivity:** Se recomienda ejecutar auditorías Yoneda tras cambios masivos en Spatial.

---

## 4. Cómo escalar los Testeos
1.  **Ejecutar `RunAllTests()`**: Verificación global.
2.  **Validar con `validateTopology`**: Usar el endpoint de Handshake para prototipar flujos.
3.  **Higiene Metabólica**: Verificar que los nuevos adaptadores no publiquen `adjacent_nodes` ni dependan de `outputAs`.
