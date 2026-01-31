# ADR-001: Atomic State Slicing

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Arquitecto Principal  
**Tags:** #state-management #refactoring #v10

---

## Context

En V9, `Amnesia.js` era un store monolítico de 800+ líneas que gestionaba todo el estado del sistema: nodos, conexiones, sesión UI, flags de estado, etc. Esto creaba varios problemas:

1. **Complejidad Cognitiva**: Difícil de entender qué parte del código gestiona qué estado
2. **Acoplamiento**: Cambios en una parte del estado afectaban otras partes
3. **Testing**: Imposible testear responsabilidades de forma aislada
4. **Performance**: Re-renders innecesarios cuando cambiaba cualquier parte del estado

---

## Decision

Dividir `Amnesia.js` en **slices atómicos**, cada uno con una responsabilidad única:

- **CosmosSlice**: Gestión de nodos (CRUD, hidratación)
- **TopologySlice**: Gestión de conexiones y file library
- **SessionSlice**: Estado de sesión UI (zoom, pan, selección)

`Amnesia.js` se convierte en un **orquestador** que compone estos slices usando el patrón de Zustand.

---

## Consequences

### Positivas
- ✅ **Separación de Concerns**: Cada slice tiene una responsabilidad clara
- ✅ **Testabilidad**: Slices pueden testearse de forma aislada
- ✅ **Mantenibilidad**: Cambios en un slice no afectan otros
- ✅ **Performance**: Re-renders más granulares
- ✅ **Escalabilidad**: Fácil añadir nuevos slices

### Negativas
- ⚠️ **Complejidad Inicial**: Más archivos que gestionar
- ⚠️ **Curva de Aprendizaje**: Desarrolladores nuevos deben entender el patrón

### Mitigaciones
- Documentación clara en contratos atómicos
- Nomenclatura consistente (`createXSlice`)
- Ejemplos de uso en cada contrato

---

## Alternatives Considered

### Opción 1: Mantener Store Monolítico
**Rechazada**: La deuda técnica eventualmente paraliza el desarrollo.

### Opción 2: Usar Context API de React
**Rechazada**: Zustand ofrece mejor performance y DX.

### Opción 3: Usar Redux Toolkit
**Rechazada**: Demasiado boilerplate para nuestras necesidades.

---

## Related

- [ADR-002: Holographic Collapsed Nodes](ADR_002_holographic_collapsed_nodes.md)
- [Amnesia.contract.md](../Doc_nivel_2/store/Amnesia.contract.md)
- [CosmosSlice.contract.md](../Doc_nivel_2/store/CosmosSlice.contract.md)
