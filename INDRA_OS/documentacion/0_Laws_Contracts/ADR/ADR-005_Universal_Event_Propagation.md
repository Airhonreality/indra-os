# ADR-005: Universal Event Propagation in Axiomatic Store

**Fecha:** 2026-02-04
**Estado:** ACEPTADO
**Contexto:** Diagnóstico de "Booting Perpetuo" (Incidente #2640)

## Contexto
El sistema INDRA OS utiliza una arquitectura flux-like con `AxiomaticStore` como fuente única de verdad. La función `execute` actúa como fachada para acciones asíncronas (efectos secundarios) y síncronas.
Durante la implementación del `Fat Client`, se observó que acciones críticas del sistema como `IGNITE_SYSTEM` (emitida por el `SystemAssembler` y orquestada por `LayerOrchestrator`) eran ignoradas silenciosamente.
El sistema arrancaba en backend, pero el frontend permanecía en estado `STANDBY` indefinidamente.

**Causa Raíz:**
La función `execute` fue implementada inicialmente solo para interceptar acciones asíncronas específicas (e.g., `MOUNT_COSMOS`). Al no coincidir con estos casos especiales, la función retornaba sin ejecutar `dispatch`, rompiendo la cadena de propagación para acciones síncronas estándar.

## Decisión
Se establece el **Axioma de Propagación Universal**:

1.  **Dispatch por Defecto (Default Dispatch):** La función `execute` DEBE garantizar que cualquier acción no interceptada explícitamente (handled & returned) sea despachada al `reducer` final. No se permite "tragar" acciones silenciosamente.
    
    ```javascript
    const execute = async (actionType, payload) => {
        // ... interceptores asíncronos ...
        
        // AXIOMA: Dispatch por Defecto
        dispatch({ type: actionType, payload });
    };
    ```

2.  **Explicitud en Reducers:** Todas las señales de control de estado (`IGNITE_SYSTEM`, `SYSTEM_LOCKED`) deben tener casos explícitos en el `axiomaticReducer`.

## Consecuencias
*   **Positivo:** Garantiza que todas las señales del sistema tengan efecto o al menos lleguen al log de "Unknown Axiom" del reducer, facilitando el debug.
*   **Positivo:** Restaura la funcionalidad de arranque y transición de estados del sistema.
*   **Riesgo:** Si un interceptor asíncrono olvida poner `return`, la acción podría despacharse dos veces (una manual y otra por el default).
*   **Mitigación:** Se debe auditar que todo bloque `if` en `execute` que haga `dispatch` manualmente finalice con `return`.

## Estado Técnico Actual
*   [x] Fix aplicado en `AxiomaticStore.jsx`.
*   [x] Caso `IGNITE_SYSTEM` implementado en `axiomaticReducer`.
*   [x] Validación de arranque exitosa.





