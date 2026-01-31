# ADR-005: CSS Segmentation

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Arquitecto Principal + Design Lead  
**Tags:** #css #design-system #v10

---

## Context

En V9, `index.css` era un archivo monolítico de **2000+ líneas** que contenía:
- Variables CSS
- Layout de componentes
- Estilos de nodos
- Estilos de UI
- Animaciones
- Media queries

Esto creaba problemas:

1. **Difícil de Navegar**: Encontrar un estilo específico requería scroll infinito
2. **Conflictos**: Estilos de diferentes componentes mezclados
3. **No Reutilizable**: Imposible importar solo lo necesario
4. **Mantenimiento**: Cambios en un área podían romper otras

---

## Decision

Segmentar CSS en **3 archivos especializados**:

1. **`tokens.css`**: Variables CSS centralizadas (colores, espaciado, tipografía)
2. **`system_layout.css`**: Layout de componentes del sistema (Navigator, Reality, Ribbon)
3. **`liquid_anatomy.css`**: Estilos de nodos y puertos (glassmorphism, holografía)

Cada archivo tiene una **responsabilidad única** y puede importarse independientemente.

---

## Consequences

### Positivas
- ✅ **Separación de Concerns**: Cada archivo tiene un propósito claro
- ✅ **Mantenibilidad**: Cambios en nodos no afectan layout del sistema
- ✅ **Reutilización**: Tokens pueden usarse en cualquier componente
- ✅ **Performance**: Lazy loading de CSS por módulo (futuro)
- ✅ **Legibilidad**: Archivos más pequeños y enfocados

### Negativas
- ⚠️ **Más Archivos**: 3 archivos en lugar de 1
- ⚠️ **Orden de Importación**: Tokens debe cargarse primero

### Mitigaciones
- Documentación clara de la estructura
- Contratos atómicos para cada archivo CSS
- Validación de orden de importación en build

---

## Alternatives Considered

### Opción 1: CSS-in-JS (Styled Components)
**Rechazada**: Preferimos CSS puro para mejor performance y DX.

### Opción 2: Tailwind CSS
**Rechazada**: Demasiado genérico, preferimos tokens custom.

### Opción 3: CSS Modules
**Rechazada**: Añade complejidad innecesaria para nuestro caso.

---

## Implementation Details

### Estructura de Archivos
```
style/
├── tokens.css              # Variables (86 líneas)
├── system_layout.css       # Layout (175 líneas)
└── liquid_anatomy.css      # Nodos (145 líneas)
```

### Orden de Importación
```javascript
// main.jsx
import './style/tokens.css';         // 1. Primero: Variables
import './style/system_layout.css';  // 2. Segundo: Layout
import './style/liquid_anatomy.css'; // 3. Tercero: Nodos
```

### Tokens (Ejemplo)
```css
/* tokens.css */
:root {
  --bg-primary: #0a0a0c;
  --text-primary: #ffffff;
  --accent-primary: #00ff88;
  --spacing-md: 12px;
  --font-sans: 'Inter', sans-serif;
}
```

### Uso de Tokens
```css
/* liquid_anatomy.css */
.node-entity {
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: var(--spacing-md);
  font-family: var(--font-sans);
}
```

---

## Migration from V9

### Antes (V9)
```
index.css (2000+ líneas)
```

### Después (V10)
```
tokens.css (86 líneas)
system_layout.css (175 líneas)
liquid_anatomy.css (145 líneas)
Total: 406 líneas (80% reducción)
```

**Nota**: La reducción se debe a eliminación de código duplicado y estilos obsoletos.

---

## Related

- [ADR-001: Atomic State Slicing](ADR_001_atomic_state_slicing.md)
- [tokens.contract.md](../Doc_nivel_2/style/tokens.contract.md)
- [liquid_anatomy.contract.md](../Doc_nivel_2/style/liquid_anatomy.contract.md)
