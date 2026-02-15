# Plan de Implementación: Motor Gráfico (Graph Editor)
## Contexto
El usuario requiere que la vista de "Cosmos" funcione como un **Graph Editor** de nodos y conexiones, similar a herramientas como Miro o React Flow, pero gobernado por el Canon de Indra.

## Arquitectura Propuesta (Lógica V8.0)

### 1. Nuevo Motor: `GraphEngine.jsx`
Ubicación: `src/2_Engines/GraphEngine.jsx`
Este motor será responsable de renderizar un lienzo infinito (Canvas) donde viven los Artefactos como Nodos.

**Capacidades:**
- **Pan & Zoom**: Navegación espacial infinita.
- **Node Rendering**: Cada nodo es un `ComponentProjector` en miniatura (modo `CARD` o `NODE`).
- **Edge Rendering**: Las conexiones (Links) se dibujan como curvas SVG dinámicas.
- **Drag & Drop**: Los nodos pueden reordenarse libremente (o ajustarse magnéticamente).

### 2. Integración en `DynamicLayoutEngine`
Actualmente, `DynamicLayoutEngine` divide la pantalla en Slots (Sidebar, Main, etc.).
Para el modo Graph Editor, el slot `CANVAS_MAIN` debe renderizar el `GraphEngine`.

**Modificación en `DynamicLayoutEngine.jsx`:**
```javascript
// Si el layout define VIEW_MODE: 'GRAPH' o 'GALAXY'
{/* SLOT: CANVAS_MAIN */}
{layoutSchema.VIEW_MODE === 'GRAPH' ? (
    <GraphEngine 
        nodes={cosmosContext.artifacts} 
        edges={cosmosContext.relationships} 
    />
) : (
    <SlotRenderer slotId="CANVAS_MAIN" ... />
)}
```

### 3. Definición en el Canon (JSON)
El Cosmos debe declarar explícitamente su naturaleza gráfica en su Semiótica.

**Ejemplo de Canon (Cosmos):**
```json
{
  "LABEL": "Manifestación de Indra",
  "ARCHETYPE": "COSMOS",
  "UI_LAYOUT": {
    "VIEW_MODE": "GRAPH",  // <--- Detonador del GraphEngine
    "PHYSICS": "ENABLED",  // Habilita auto-layout
    "BACKGROUND": "GRID"   // Fondo de rejilla
  }
}
```

## Pasos de Ejecución

1.  **Instalar Librería Gráfica**: Recomiendo `@xyflow/react` (antes React Flow) por su robustez y rendimiento, o construir uno ligero con SVG si se prefiere cero dependencias (Soberanía). *Recomendación: SVG nativo para total control.*
2.  **Crear `GraphEngine.jsx`**:
    -   Manejar estado `viewBox` (x, y, zoom).
    -   Renderizar lista de `artifacts` como `<div absolute />`.
    -   Renderizar lista de `relationships` como `<svg><path /></svg>`.
3.  **Conectar Acciones de la Esfera**:
    -   `ADD_NODE`: Crea un nuevo artefacto en el centro del viewport.
    -   `AUTO_LAYOUT`: Ejecuta un algoritmo de fuerza (D3-force) para ordenar los nodos.
    -   `FIT_VIEW`: Ajusta el `viewBox` para abarcar todos los nodos.

## Integración con ComponentProjector
Cada nodo en el grafo NO es un div tonto. Es una instancia de `ComponentProjector` con `perspective="NODE"`.
Esto asegura que un "Correo", un "Archivo" y un "Usuario" se vean diferentes en el grafo automáticamente.

```jsx
// GraphNode.jsx
<ComponentProjector 
    componentId={node.id} 
    perspective="NODE" 
/>
```





