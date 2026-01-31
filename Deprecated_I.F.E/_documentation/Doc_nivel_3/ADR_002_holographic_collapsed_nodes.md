# ADR-002: Holographic Collapsed Nodes

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Arquitecto Principal + UX Lead  
**Tags:** #ux #nodes #v10

---

## Context

En versiones anteriores, se consideró que los nodos pudieran **expandirse físicamente** en el canvas para mostrar más información o terminales embebidas. Esto presentaba problemas:

1. **Caos Visual**: Nodos expandidos empujan a otros nodos, creando un layout caótico
2. **Performance**: Recalcular posiciones de todos los nodos es costoso
3. **Ergonomía**: Usuario pierde contexto del canvas completo
4. **Complejidad**: Gestionar estados expandido/colapsado añade complejidad

---

## Decision

Implementar **"Holographic Collapsed View"**:

- **Nodos permanecen compactos** (~200px width) en todo momento
- **Preview de datos** se muestra en el cuerpo del nodo (holografía)
- **Interacción profunda** ocurre en **Focus Mode** (overlay/superposición)
- **Doble-click** abre terminal en overlay, no expande el nodo

---

## Consequences

### Positivas
- ✅ **Canvas Limpio**: Layout estable, sin reorganización caótica
- ✅ **Performance**: No hay recálculo de posiciones
- ✅ **Contexto Preservado**: Usuario ve todo el canvas mientras interactúa
- ✅ **Escalabilidad**: Funciona con 100+ nodos sin degradación

### Negativas
- ⚠️ **Información Limitada**: Preview solo muestra 2-3 campos
- ⚠️ **Doble Interacción**: Usuario debe hacer doble-click para ver todo

### Mitigaciones
- Preview muestra los campos **más relevantes** según tipo de nodo
- Hover puede mostrar tooltip con más información
- Terminal en overlay es rápida de abrir (doble-click)

---

## Alternatives Considered

### Opción 1: Expansión Física en Canvas
**Rechazada**: Crea caos visual y problemas de performance.

### Opción 2: Panel Lateral para Detalles
**Rechazada**: Reduce espacio del canvas y rompe el flujo espacial.

### Opción 3: Tooltips con Toda la Info
**Rechazada**: Tooltips no permiten interacción (edición de campos).

---

## Implementation Details

### Holografía por Tipo
```javascript
// Gmail: Muestra asunto
{ type: 'gmail', data: { subject: 'Reporte' } }
→ Preview: "ASUNTO RECIENTE: Reporte"

// Notion: Muestra título
{ type: 'notion', data: { title: 'Mi Página' } }
→ Preview: "PÁGINA ACTIVA: Mi Página"
```

### Focus Mode
- Trigger: Doble-click en nodo
- Renderizado: Overlay con backdrop oscuro
- Contenido: Terminal especializada (GmailTerminal, NotionTerminal, etc.)
- Cierre: Esc, click fuera, o botón [X]

---

## Related

- [ADR-003: Linear Flow Enforcement](ADR_003_linear_flow_enforcement.md)
- [NodeEntity.contract.md](../Doc_nivel_2/graph-editor/NodeEntity.contract.md)
- [03_ux_logic.md](../Doc_nivel_1/03_ux_logic.md)
