# INDRA SYSTEM: ESTRATEGIA DE SINCRONÍA AXIAL
Objetivo: Eliminar la deuda técnica de desincronía contractual y asegurar la soberanía de datos.

## FASE 1: UNIFICACIÓN DE VERDAD (Centralización)
- **Creación de `IndraConstants.js`**:
  - Centralizar llaves de almacenamiento (`STORAGE_KEYS`).
  - Definir nomenclaturas de protocolos estándar (`PROTOCOLS`).
  - Versión mínima de contrato aceptada.

## FASE 2: NORMALIZADOR DE RESPUESTA (Middleware)
- Modificar `TransportLayer.js` para inyectar una capa de **Sanitización de Respuesta**:
  ```javascript
  const result = JSON.parse(rawText);
  return IndraProtocol.normalize(result);
  ```
- Este normalizador asegura que:
  - `result.items` siempre sea un Array (aunque esté vacío).
  - `result.metadata` siempre tenga un campo `status`.
  - Los errores atómicos se conviertan en Excepciones de JS automáticamente.

## FASE 3: CONTRATO DINÁMICO (Auto-Discovery)
- Evolucionar el protocolo `SYSTEM_MANIFEST` para devolver un `contract_map`.
- El Satélite usará este mapa para resolver rutas de datos en tiempo real (ej: `universe_path: "metadata.universe"`).

## FASE 4: AUDITORÍA DE SINCERIDAD (Active Testing)
- Implementar en el HUD un **"Dashboard de Resonancia"** que permita ejecutar tests de contrato (como el Sonde Pro) directamente desde la UI con un solo clic.

---
**Resultado esperado**: Un sistema donde el Satélite es agnóstico a los cambios internos del Core, siempre y cuando el contrato se cumpla.
