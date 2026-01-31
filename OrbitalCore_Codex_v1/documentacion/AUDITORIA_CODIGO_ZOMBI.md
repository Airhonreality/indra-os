# 🔍 MATRIZ DE AUDITORÍA: Código Zombi y Dependencias Obsoletas

**Fecha**: 2026-01-30  
**Sistema**: OrbitalCore Codex v1  
**Objetivo**: Identificar y purgar código legacy, dependencias obsoletas y archivos deprecados

---

## 📊 RESUMEN EJECUTIVO

| Categoría | Cantidad | Acción Recomendada |
|-----------|----------|-------------------|
| Aliases Legacy | 5 | ✅ Mantener (compatibilidad) |
| Funciones de Migración | 2 | ⚠️ Revisar necesidad |
| Archivos `.spec.js` | 52 | ✅ Mantener (tests) |
| Referencias a `SYSTEM_MANIFEST` | 2 | ✅ OK (alias válido) |
| Referencias a `MasterLaw` | 6 | ✅ OK (alias válido) |
| Código de Rollback Legacy | 1 | ❌ **ELIMINAR** |

---

## 🗑️ ARCHIVOS Y FUNCIONES A ELIMINAR

### 1. **AdminTools.gs - Función `rollbackToLegacyTokens`**
**Ubicación**: `7_Diagnostics/AdminTools.gs` (líneas 167-272)

**Razón**: Esta función permite revertir tokens del `TokenManager` a `ScriptProperties` (sistema legacy). Ya no es necesaria porque:
- El sistema ya migró completamente a `TokenManager`
- Mantener esta función crea deuda técnica
- Nadie debería necesitar volver al sistema antiguo

**Acción**:
```javascript
// ❌ ELIMINAR estas líneas:
function rollbackToLegacyTokens() { ... }
// Y sus referencias en el objeto de schemas
```

---

### 2. **SystemInitializer.gs - Función `migrateLegacyTokens`**
**Ubicación**: `1_Core/SystemInitializer.gs` (líneas 227-277)

**Razón**: Esta función migra tokens de `ScriptProperties` al `TokenManager`. Evaluar si:
- ¿Todos los usuarios ya migraron?
- ¿Hay algún entorno que aún use el sistema antiguo?

**Acción Sugerida**:
- ⚠️ **Mantener por 1 versión más** (por seguridad)
- Agregar log de deprecación
- Eliminar en v2.0.0

---

### 3. **Configurator.gs - Lógica de Fallback Legacy**
**Ubicación**: `4_Infra/Configurator.gs` (líneas 129-159)

**Razón**: Busca claves sin prefijo `ORBITAL_SYSTEM_` como fallback. Esto es útil durante la migración, pero genera complejidad.

**Acción Sugerida**:
- ⚠️ **Mantener** (útil para migración gradual)
- Agregar contador de uso para saber cuándo eliminar

---

## ✅ ALIASES LEGACY VÁLIDOS (Mantener)

Estos aliases son **compatibilidad intencional** y deben mantenerse:

### Capa 0 (Laws)

| Archivo | Línea | Alias | Razón |
|---------|-------|-------|-------|
| `System_Constitution.gs` | 89 | `SYSTEM_MANIFEST` | Compatibilidad con código existente |
| `Logic_Axioms.gs` | 87 | `MasterLaw` | Compatibilidad con tests |
| `Visual_Grammar.gs` | 46 | `VISUAL_AXIOMS` | Compatibilidad con UI |
| `UI_Distribution.gs` | 68 | `UI_AXIOMS` | Compatibilidad con front-end |
| `Spatial_Physics.gs` | 67 | `SPATIAL_AXIOMS` | Compatibilidad con ISK |

**Acción**: ✅ **Mantener** - Estos aliases facilitan la migración gradual y no generan deuda técnica.

---

## 🧪 ARCHIVOS DE TEST (52 archivos `.spec.js`)

**Estado**: ✅ **Mantener todos**

Estos archivos son tests unitarios y de integración. Son esenciales para:
- Validar contratos
- Prevenir regresiones
- Documentar comportamiento esperado

**Acción**: Ninguna. Los tests son activos valiosos.

---

## 🔗 DEPENDENCIAS OBSOLETAS

### Búsqueda de Imports/Requires No Utilizados

**Resultado**: No se encontraron `require()` o `import` statements en archivos `.gs` (Google Apps Script no usa módulos ES6).

---

## 📋 PLAN DE PURGA RECOMENDADO

### Fase 1: Eliminación Inmediata (Ahora)
```bash
# 1. Eliminar función rollbackToLegacyTokens de AdminTools.gs
# 2. Eliminar referencias en schemas del mismo archivo
```

### Fase 2: Deprecación con Aviso (v1.2.0)
```javascript
// Agregar en SystemInitializer.gs
function migrateLegacyTokens(actionsTaken) {
  console.warn('[DEPRECATED] migrateLegacyTokens será eliminado en v2.0.0');
  // ... resto del código
}
```

### Fase 3: Eliminación Final (v2.0.0)
- Eliminar `migrateLegacyTokens` completamente
- Eliminar lógica de fallback legacy en `Configurator.gs`
- Actualizar documentación

---

## 🎯 MÉTRICAS DE LIMPIEZA

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Líneas de código legacy | ~150 | ~50 | 66% ↓ |
| Funciones de migración | 2 | 0 | 100% ↓ |
| Complejidad ciclomática | Media | Baja | ✅ |

---

## ✅ ACCIONES INMEDIATAS

1. **Eliminar `rollbackToLegacyTokens`** de `AdminTools.gs`
2. **Agregar deprecation warning** a `migrateLegacyTokens`
3. **Documentar** aliases legacy como intencionales
4. **Ejecutar tests** para confirmar que nada se rompe

---

## 📝 NOTAS ADICIONALES

- **Aliases Legacy**: Son compatibilidad intencional, NO código zombi
- **Tests**: 52 archivos `.spec.js` están activos y son valiosos
- **Migración**: La lógica de migración puede eliminarse en v2.0.0
- **Rollback**: La función de rollback es código muerto y debe eliminarse YA

---

**Auditoría completada por**: Antigravity AI  
**Próxima revisión**: v2.0.0 (Eliminar migración legacy)
