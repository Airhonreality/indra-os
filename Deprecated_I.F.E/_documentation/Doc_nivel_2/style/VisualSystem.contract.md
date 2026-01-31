# VisualSystem.css - Atomic Contract (V3 - Pristine)

> **Ubicación:** `src/styles/VisualSystem.css`
> **Axioma:** Estética de proyección y visualización de nodos. Define la apariencia de superficies translúcidas y componentes de interfaz.

---

## 1. Axiomas (Invariantes)

1. **Glassmorphism**: Fondos translúcidos con desenfoque (`backdrop-filter`).
2. **Data Projection**: Estilos para la visualización de datos dentro de los nodos.
3. **Connectors**: Estilos consistentes para puertos de entrada/salida.
4. **Motion Heuristics**: Transiciones suaves alineadas con la temporización psicofisiológica.

---

## 2. Clases Principales

### `.node-entity`
Contenedor principal del nodo.

```css
.node-entity {
  background: rgba(10, 10, 12, 0.9);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  min-width: 200px;
}
```

### `.node-entity.selected`
Estado seleccionado.

```css
.node-entity.selected {
  border-color: var(--accent-primary);
  box-shadow: 0 0 50px rgba(0, 255, 136, 0.2);
}
```

### `.node-projection-body`
Cuerpo del nodo con visualización de datos.

### `.node-port`
Puertos de conexión.

```css
.node-port {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #0a0a0c;
  border: 2px solid rgba(255, 255, 255, 0.15);
  transition: all 0.2s;
}
```

### `.status-indicator`
Indicador de estado visual.

---

## 3. Protocolo de Uso

### En JSX (Ejemplo de Proyección)
```jsx
<div className="node-entity selected">
  <div className="node-header">
    <h4>Gmail Sender</h4>
    <div className="status-indicator active" />
  </div>
  <div className="node-projection-body">
    <div className="projection-field">
      <span className="field-label">SUBJECT</span>
      <div className="field-data">Weekly Report</div>
    </div>
  </div>
  <div className="node-port input" />
  <div className="node-port output" />
</div>
```

---

## 4. Relacionado
- [tokens.css](tokens.contract.md)
- [ProjectionKernel.md](../../Doc_nivel_1/05_projection_logic.md)
