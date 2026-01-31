# ADR-004: Legacy Isolation Strategy

**Status:** Accepted  
**Date:** 2026-01-07  
**Deciders:** Arquitecto Principal  
**Tags:** #refactoring #legacy #v10

---

## Context

`RendererCanvas.jsx` es un componente monolítico de **53KB** (600+ líneas) que implementa un motor de diseño visual tipo Figma. Es funcional pero:

1. **Monolítico**: Mezcla lógica de rendering, interacción y estado
2. **Difícil de Mantener**: Cambios requieren entender todo el archivo
3. **Bloquea Innovación**: Imposible iterar sin romper proyectos existentes
4. **No Atómico**: Viola los principios de V10

Sin embargo, **no podemos eliminarlo** porque:
- Proyectos existentes dependen de él
- Usuarios tienen `.layout` files que lo usan
- Reescribirlo completamente tomaría semanas

---

## Decision

Implementar **"Legacy Isolation Strategy"**:

1. **Mover** todo el código legacy a `graph-editor/legacy_v1/`
2. **Mantener** funcionalidad existente sin cambios
3. **Preparar** puerto vacante para Renderer V2
4. **Deprecar** oficialmente pero mantener soporte temporal
5. **Migración Gradual**: Proyectos pueden coexistir con V1 y V2

---

## Consequences

### Positivas
- ✅ **No Rompe Proyectos**: Código existente sigue funcionando
- ✅ **Aislamiento Claro**: Legacy no contamina el código nuevo
- ✅ **Innovación Desbloqueada**: Podemos desarrollar V2 en paralelo
- ✅ **Migración Gradual**: Usuarios migran a su ritmo

### Negativas
- ⚠️ **Doble Mantenimiento**: Temporal, hasta que V2 esté listo
- ⚠️ **Tamaño de Bundle**: Legacy añade peso al bundle

### Mitigaciones
- Lazy loading de `legacy_v1` (solo carga si se usa)
- Documentación clara de deprecación
- Timeline de sunset (6 meses post-V2)

---

## Alternatives Considered

### Opción 1: Reescribir Renderer Inmediatamente
**Rechazada**: Tomaría semanas y rompería proyectos existentes.

### Opción 2: Refactorizar Renderer Actual
**Rechazada**: Demasiado acoplado, mejor empezar de cero.

### Opción 3: Mantener Renderer en Lugar Original
**Rechazada**: Contamina la arquitectura atómica de V10.

---

## Implementation Details

### Estructura de Aislamiento
```
graph-editor/
├── Reality.jsx              # ✅ V10 Atómico
├── NodeEntity.jsx           # ✅ V10 Atómico
├── hooks/                   # ✅ V10 Atómico
└── legacy_v1/               # ⚠️ Legacy Aislado
    ├── RendererCanvas.jsx   # Monolito (53KB)
    ├── live-preview/        # Ejecutor de .layout
    ├── renderer-engine/     # Motor de rendering
    └── properties/          # Paneles de propiedades
```

### Lazy Loading
```javascript
// Solo carga si el nodo requiere RendererCanvas
const RendererCanvas = lazy(() => import('./legacy_v1/RendererCanvas'));
```

### Deprecation Notice
```javascript
/**
 * @deprecated Este componente será reemplazado por Renderer V2.
 * Mantener solo para compatibilidad con proyectos existentes.
 * Sunset: 6 meses post-V2 release.
 */
```

---

## Migration Path

### Fase 1: Aislamiento (Completada)
- ✅ Mover a `legacy_v1/`
- ✅ Actualizar imports
- ✅ Añadir deprecation notices

### Fase 2: Renderer V2 (Pendiente)
- [ ] Diseñar arquitectura atómica
- [ ] Implementar componentes base
- [ ] Migrar un proyecto de prueba

### Fase 3: Migración (Pendiente)
- [ ] Herramienta de migración automática
- [ ] Documentación de migración
- [ ] Soporte para usuarios

### Fase 4: Sunset (6 meses post-V2)
- [ ] Remover `legacy_v1/`
- [ ] Actualizar bundle size

---

## Related

- [ADR-001: Atomic State Slicing](ADR_001_atomic_state_slicing.md)
- [04_system_structure.md](../Doc_nivel_1/04_system_structure.md)
