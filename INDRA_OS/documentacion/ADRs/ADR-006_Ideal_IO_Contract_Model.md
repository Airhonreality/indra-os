# ADR-006: Modelo de Reificación Canónica y Contratos IO Explícitos

## Estado
**VIGENTE** (V15.0 - Zen Alignment)

## Contexto
En las versiones anteriores, el `SignalTransmuter` (Alquimista Semántico) intentaba "dar sentido" a los datos mediante heurísticas dinámicas. Esto creaba un **Espejismo Arquitectónico**, donde el sistema asumía que podía entender cualquier señal sin un contrato riguroso. Este modelo ha sido **erradicado** en favor del purismo absoluto del ADR-022.

## Decisión
Implementar un modelo de **Reificación Canónica** donde el sistema no intenta interpretar la señal, sino que exige que sea emitida bajo un formato explícito reificado por el `Law_Compiler`.

### 1. La Erradicación del SignalTransmuter
El componente `SignalTransmuter` ha sido eliminado. La lógica de "traducción" post-fetch desaparece. La materia recibida del backend se considera la **Verdad Cruda** y se inyecta directamente en el Fenotipo tras su paso por la refinería del `Law_Compiler`.

### 2. El Contrato de Reificación (Traits y Capabilities)
El adaptador no envía "hints" de rutas, sino que declara su **Naturaleza Ontológica** mediante:
1.  **CAPABILITIES**: Puertos explícitos con `io` y `type` definido.
2.  **TRAITS**: Rasgos funcionales (ej: `VAULT`, `DATABASE`, `COMPOSITOR`) que informan al UI sobre cómo proyectar el artefacto.

### 3. Sincronización IO Estricta
El `SynapticDispatcher` abandona toda lógica de transmutación o extracción de campos (poesía). El dato viaja íntegro desde el origen al destino. Si se requiere una transformación, esta debe ocurrir en un Nodo de Transformación explícito o ser emitida ya depurada desde el backend.

## Consecuencias

### Positivas
*   **Agnosticismo Radical**: Eliminación total de heurísticas en el núcleo del sistema.
*   **Determinismo**: El comportamiento del sistema es 100% predecible según el contrato del backend.
*   **Rendimiento**: Se elimina el overhead de procesamiento dinámico de paths en cada pulso de señal.

### Riesgos (Mitigados)
*   **Rigidez Contractual**: Un contrato mal definido inhabilita la funcionalidad. Se mitiga mediante el `DIAG_SOVEREIGNTY_CHECK` que detecta incoherencias antes de la ejecución.

## Axioma de Soberanía Asociado
> "La materia no se transmuta, se reifica. La verdad de un dato no reside en cómo la interpretas, sino en cómo el origen la declara."

---
**Firmado bajo el Sello de Verdad Viva:**
*El Arquitecto de Indra OS - V15.0*
