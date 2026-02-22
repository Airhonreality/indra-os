# DHARMA: Capa 1 - Axiomatic Store 🏦
## Misión: El Templo de la Verdad Fenotípica

El **Axiomatic Store** es el custodio único del estado del sistema en el Frontend. No es un simple contenedor de datos; es una membrana inteligente que asegura la coherencia entre el **Genotipo** (Contratos soberanos del Core) y el **Fenotipo** (Manifestación en React).

### Axiomas de Operación (V14 - Protocolo de Honestidad Radical)

1.  **Soberanía de Identidad**: Ningún componente del Store tiene permitido "adivinar" la naturaleza de un objeto. Si el Core no envía un `ARCHETYPE` o un `LABEL`, el Store lo trata como materia inerte (`null`), obligando a la transparencia.
2.  **Fragmentación por Lóbulos**: El conocimiento se divide en órganos especializados (Identity, Topology, Continuity, Interface, Navigation), cada uno responsable de una parcela de la realidad.
3.  **Memoria de Hierro (L2)**: Todo cambio en el Store se persiste asíncronamente en `AxiomaticDB` (IndexedDB), permitiendo "Instant-Mounts" mientras se espera la verdad final del Backend (L8).
4.  **World Lock (Interdicción)**: El Store es reactivo a la interdicción. Si el sistema está en un ciclo de borrado o migración, el Store bloquea toda escritura saliente.

### Estructura Canónica (`src/core/1_Axiomatic_Store/`)

*   **AxiomaticStore.jsx**: Orquestador principal y proveedor del contexto.
*   **AxiomaticState.js**: Singleton de autoridad sobre la validez de la sesión (Zustand).
*   **PersistenceManager.jsx**: Gestor de la hidratación y persistencia L2/L8.
*   **Lobes/**: Reducers especializados (Identity, Data, Interface, etc.).
*   **Infrastructure/**: Motores de persistencia física (IndexedDB).

### Erradicación de Zombies (ADR-021)

Se prohíbe explícitamente cualquier rastro de:
*   **DevLab**: El modo laboratorio ha sido erradicado del código de producción.
*   **Mock Data**: El sistema debe fallar honestamente ante la ausencia de datos antes que mostrar mentiras estáticas.
*   **Inferencia Heurística**: No se permiten "promociones" automáticas de tipos de datos basadas en strings parciales.
