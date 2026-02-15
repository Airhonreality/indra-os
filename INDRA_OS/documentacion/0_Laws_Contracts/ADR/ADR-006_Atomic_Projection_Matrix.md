# ADR-006: Atomic Projection Matrix (Desintegración del Monolito del Proyector)

*   **Status:** ACEPTADO
*   **Date:** 2026-02-04
*   **Deciders:** INDRA Architecture Team
*   **Context:** v8.0 AXIOM Refactor

## Contexto y Problema
El componente `ComponentProjector.jsx` estaba evolucionando hacia un "Objeto Divino" (God Object).
Concentraba tres responsabilidades críticas violando la TGS:
1.  **Selección Lógica:** Decidir qué motor usar con un `switch` o mapa hardcodeado.
2.  **Gestión de Estado:** Controlar la navegación entre pestañas (Poly-Archetype).
3.  **Fallback & Error Handling:** Decidir qué hacer si un motor fallaba.

Esto creaba un **Cuello de Botella de Entropía**. Añadir un nuevo tipo de artefacto (ej. "3D_MODEL") requería abrir y modificar el núcleo del Proyector, arriesgando la estabilidad de todo el sistema.

## Decisión
Desintegrar el `ComponentProjector` utilizando el **Patrón de Registro (Registry Pattern)** y **Estado Derivado**.

1.  **Crear `Archetype_Registry.js`:** Un archivo estático y soberano que mapea `STRING -> REMOTE_IMPORT`. Es la única fuente de verdad.
2.  **Transformar `ComponentProjector` en `ProjectionMatrix`:** El componente de React pasa a ser una "Matriz de Proyección". No toma decisiones; solo itera sobre el array `CANON.ARCHETYPES`, consulta el Registro y renderiza lo que encuentra.
3.  **Prohibición de Lógica Condicional:** Se prohíbe terminantemente el uso de `if (type === 'MI_ARQUETIPO')` dentro del Proyector. Toda lógica específica debe vivir dentro del `Engine` correspondiente o en el `Registry`.

## Consecuencias

### Positivas (Negentropía)
*   **Escalabilidad Infinita:** Para añadir un motor, solo se añade una línea en el Registry. No se toca el Proyector.
*   **Carga Atómica (Performance):** Al usar `React.lazy` en el registro, el código del motor `VaultEngine` nunca se carga si el usuario solo visita artefactos `ADAPTER`.
*   **Robustez:** El estado derivado impide errores de "Fantasma de Estado" (renderizar un Vault en un artefacto que no lo soporta).

### Negativas
*   La complejidad se mueve de "código espagueti" a "estructura de archivos". Requiere disciplina para mantener el Registro limpio.
*   Menos "magia": Si un arquetipo no está en el registro, fallará explícitamente (Fallback generico) en lugar de intentar adivinar.

## Status de Cumplimiento
*   [x] Documentado en Andamiaje Canónico.
*   [ ] Implementación de `Archetype_Registry.js`.
*   [ ] Refactor de `ComponentProjector` a `ProjectionMatrix`.





