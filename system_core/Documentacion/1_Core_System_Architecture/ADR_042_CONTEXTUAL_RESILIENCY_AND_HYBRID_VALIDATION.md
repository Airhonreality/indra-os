# ADR-042: Contextual Resiliency and Hybrid Validation (Escudo de Indra)

- **Estado**: APROBADO / EN IMPLEMENTACIÓN
- **Fecha**: 2026-04-11
- **Autores**: Antigravity + Usuario Soberano
- **Relacionado**: ADR-001, ADR-003, ADR-008, ADR-041

---

## 1. Contexto y Hallazgo

Durante la nativización del Satélite Montechico (ADR-041), al abandonar los protocolos de "emergencia" (basura espacial) e intentar adoptar protocolos nativos de Indra (`ATOM_CREATE`), se descubrió una **Rigidez Sistémica** en la validación central del Core.

El `protocol_router.gs` aplicaba una validación binaria e indiscriminada de "The Return Law" (ADR-003): exigía que todas las respuestas de todos los proveedores incluyeran un array de `items`, incluso en protocolos de **Acción/Negociación** donde no hay datos que devolver todavía (p.ej. Handshakes).

Este hallazgo reveló que:
1. Muchos proveedores (como Drive) violaban el contrato silenciosamente en el backend.
2. El sistema anterior "parecía" funcionar porque los protocolos legacy no pasaban por la aduana central.
3. El Core estaba acoplado a la forma de las respuestas de lectura, lo que impedía el crecimiento de acciones puras.

---

## 2. Decisión: Civismo Contextual (ADR-003-C)

Se implementa una solución de **Resiliencia Híbrida** para desacoplar el rigor de la validación del propósito del protocolo.

### Axioma de Contexto:
> "La ley debe ser ciega al emisor (agnosticismo), pero consciente de la intención (contextualismo)."

### Mecanismo:
El `protocol_router` clasifica los protocolos en dos grupos funcionales:
1. **DATA_INTENSIVE (Lectura)**: El campo `items` es el corazón del átomo. Sigue siendo **Obligatorio**.
2. **ACTION_INTENSIVE (Escritura/Negociación)**: El campo `items` es secundario. El sistema **autocompleta** el contrato inyectando un array vacío si el proveedor lo omite, siempre que el status sea exitoso.

---

## 3. Hoja de Ruta Futura: Validación por Esquema (v6.0+)

Para garantizar la escalabilidad infinita sin inflar el router central con listas de protocolos, se propone una **Arquitectura de Validación Híbrida**:
- **Fase 1**: Cada protocolo llevará adosado un **Esquema de Validación de Retorno**.
- **Fase 2**: El Core se convierte en un **Kernel Puro** que no conoce protocolos, solo ejecuta la validación que el protocolo trae consigo.

---

## 4. DEUDA TÉCNICA Y PENDIENTES (INDRA)

Basado en la pulverización del protocolo de emergencia, quedan pendientes las siguientes acciones:

- [ ] **Limpieza de Cables Muertos (Backend)**: Eliminar físicamente el handler de `EMERGENCY_INGEST` del Core para asegurar que nadie pueda volver a usar ese túnel ilegal.
- [ ] **Educación de Providers**: Actualizar los proveedores de `drive`, `sheets` y `notion` para que devuelvan `items: []` explícitamente, eliminando la dependencia del "Civismo Contextual" (Resiliencia en el origen).
- [ ] **Aduana de Montechico**: Confirmar que la v5.1.8.7 del IngestBridge es estable en condiciones reales de baja señal.
- [ ] **Refactor de Router (Fase 2)**: Reemplazar el array hardcodeado `ACTION_PROTOCOLS` por un Registry de capacidades dinámico.
- [ ] **Validación Veta de Oro**: Aplicar estos mismos axiomas al satélite de Veta de Oro para asegurar que no contenga rastros de protocolos legacy.

---

*Este hallazgo transforma a Indra de un sistema que impone reglas rígidas a un sistema que orquesta propósitos con rigor inteligente.*
