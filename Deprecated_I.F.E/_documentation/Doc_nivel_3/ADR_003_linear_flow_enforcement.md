# ADR-003: Linear Flow Enforcement (DAG)

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Arquitecto Principal + Core Team  
**Tags:** #topology #data-flow #v10

---

## Context

Los usuarios podrían querer crear **ciclos de retroalimentación** directos:
```
Notion → Email → Notion (mismo nodo)
```

Esto presenta problemas críticos:

1. **Bucles Infinitos**: Riesgo de ejecución infinita sin control
2. **Debugging Complejo**: Difícil rastrear el flujo de datos
3. **Deadlocks**: Nodos esperando datos de sí mismos
4. **Complejidad de Ejecución**: El Core debe detectar y prevenir ciclos

---

## Decision

Prohibir **ciclos directos** y forzar **flujo lineal (DAG - Directed Acyclic Graph)**:

- Una conexión **no puede** formar un ciclo que regrese al mismo nodo
- Para feedback loops, el usuario debe usar **nodos separados**:
  ```
  Notion Read → Email Send → Notion Write
  ```
- Validación en `useRealityWiring.js` antes de crear conexión
- Feedback visual (cable rojo) si se intenta un ciclo

---

## Consequences

### Positivas
- ✅ **Prevención de Bucles**: Imposible crear bucles infinitos
- ✅ **Debugging Simplificado**: Flujo siempre es lineal y rastreable
- ✅ **Ejecución Predecible**: El Core puede ejecutar en orden topológico
- ✅ **UX Clara**: Usuario entiende que el flujo es unidireccional

### Negativas
- ⚠️ **Menos Flexibilidad**: No se pueden crear ciclos directos
- ⚠️ **Más Nodos**: Feedback loops requieren nodos adicionales

### Mitigaciones
- Documentación clara sobre cómo implementar feedback loops
- Templates de patrones comunes (ej: "Loop con Estado")
- Mensaje de error descriptivo al intentar crear ciclo

---

## Alternatives Considered

### Opción 1: Permitir Ciclos con Límite de Iteraciones
**Rechazada**: Complejo de implementar y propenso a errores.

### Opción 2: Detección de Ciclos en Runtime
**Rechazada**: Mejor prevenir que detectar tarde.

### Opción 3: Ciclos Opcionales con Flag
**Rechazada**: Añade complejidad innecesaria.

---

## Implementation Details

### Validación de Ciclos
```javascript
function willCreateCycle(from, to) {
  // DFS para detectar si 'to' puede alcanzar 'from'
  const visited = new Set();
  const stack = [to];
  
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === from) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    
    // Añadir nodos conectados a la pila
    const outgoing = getOutgoingConnections(current);
    stack.push(...outgoing.map(c => c.to));
  }
  
  return false;
}
```

### Feedback Visual
- Cable fantasma se vuelve **rojo** si crearía un ciclo
- Tooltip: "⚠️ Esta conexión crearía un ciclo"
- Cable no se crea al soltar

---

## Related

- [ADR-002: Holographic Collapsed Nodes](ADR_002_holographic_collapsed_nodes.md)
- [useRealityWiring.contract.md](../Doc_nivel_2/graph-editor/hooks/useRealityWiring.contract.md)
- [TopologySlice.contract.md](../Doc_nivel_2/store/TopologySlice.contract.md)
