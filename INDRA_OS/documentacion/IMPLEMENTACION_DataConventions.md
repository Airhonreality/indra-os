# IMPLEMENTACIÓN COMPLETADA: DataConventions & Persistencia Selectiva

## ✅ Archivos Creados

### 1. `DataConventions.js`
**Ubicación**: `INDRA_SKIN/src/core/state/schemas/DataConventions.js`

**Responsabilidad**: Registro canónico de convenciones de persistencia

**Exportaciones**:
- `PERSISTENCE_RULES` - Reglas de qué campos persisten
- `cleanArtifactForSnapshot(artifact)` - Limpia un artefacto
- `cleanRelationshipsForSnapshot(relationships)` - Limpia relaciones
- `shouldPersistField(fieldName, artifactType)` - Valida si un campo persiste
- `getCleaningReport(artifact)` - Genera reporte de limpieza (debugging)

---

## 🔌 Archivos Modificados

### 1. `SyncOrchestrator.js`
**Cambio**: Integración de DataConventions

**Antes**:
```javascript
// Limpieza manual (solo _isDirty, _simulated)
const cleanArtifacts = artifacts.map(art => {
    const clean = { ...art };
    delete clean._isDirty;
    delete clean._simulated;
    return clean;
});
```

**Después**:
```javascript
// Limpieza semántica completa (usa DataConventions)
import { cleanArtifactForSnapshot } from './schemas/DataConventions';

const cleanArtifacts = artifacts.map(art => 
    cleanArtifactForSnapshot(art)
);
```

**Campos ahora eliminados**:
- `_isDirty`, `_simulated`, `_tombstoned` (flags de UI)
- `_liveData`, `_cache`, `_fetching`, `_error` (datos volátiles de terceros)
- `_lastFetched`, `_adapterState`, `_uiState` (estados temporales)

**Campos preservados**:
- `id`, `type`, `identity`, `position`, `layer` (estructura INDRA)
- `config`, `capabilities` (configuración de adapters)
- `userContent` (anotaciones y datos del usuario)

---

### 2. `ADR_003_Soberanía_Snapshot_Piggybacking.md`
**Cambio**: Documentación de arquitectura de persistencia

**Secciones añadidas**:
- Arquitectura de Responsabilidades (diagrama de flujo)
- Campos Persistidos vs Volátiles (tabla)
- Justificación de por qué DataConventions vive en el Front

---

## 🧪 Tests Creados

### `DataConventions.test.js`
**Ubicación**: `INDRA_SKIN/src/core/state/schemas/__tests__/DataConventions.test.js`

**Tests**:
1. ✅ Limpieza de campos volátiles
2. ✅ Preservación de campos core
3. ✅ Limpieza de relaciones
4. ✅ Validación de shouldPersistField
5. ✅ Generación de reportes de limpieza
6. ✅ Preservación de userContent
7. ✅ Preservación de config del adapter

---

## 🎯 Flujo Completo Implementado

```
Usuario muta estado → dispatch(action)
  ↓
Estado actualiza en RAM
  ↓
Usuario hace acción funcional (trigger piggybacking)
  ↓
InterdictionUnit.call() → acumula en buffer
  ↓
InterdictionUnit._flushBatch()
  ↓
SyncOrchestrator.prepareSnapshot()
  ↓ (usa)
DataConventions.cleanArtifactForSnapshot()
  ↓ (elimina)
_liveData, _cache, _fetching, _isDirty, etc.
  ↓ (preserva)
id, type, position, config, userContent
  ↓
Snapshot limpio → inyectado en batch
  ↓
HTTP POST → Backend
  ↓
CognitiveSensingAdapter.stabilizeAxiomaticReality()
  ↓
Drive.store() → Persiste snapshot limpio
```

---

## 🚨 Casos de Uso Validados

### Caso 1: Nodo de Notion con datos volátiles
```javascript
// Estado en RAM
{
  id: 'art_notion_001',
  type: 'NOTION_ADAPTER',
  config: { databaseId: 'xyz' },     // ✅ Persiste
  _liveData: { lastPrice: 1500 },   // ❌ Se elimina
  _fetching: false                   // ❌ Se elimina
}

// Snapshot enviado al Core
{
  id: 'art_notion_001',
  type: 'NOTION_ADAPTER',
  config: { databaseId: 'xyz' }      // Solo esto
}
```

**Resultado**: Al recargar (F5), el nodo se muestra con su geometría y configuración, pero SIN datos obsoletos. El adapter re-consulta Notion para obtener el precio actual.

---

### Caso 2: Nota con anotación del usuario
```javascript
// Estado en RAM
{
  id: 'art_note_001',
  type: 'NOTE',
  userContent: {                     // ✅ Persiste
    note: 'Precio aprobado: $1500',
    approvedBy: 'Javier'
  },
  _uiState: { collapsed: false }     // ❌ Se elimina
}

// Snapshot enviado al Core
{
  id: 'art_note_001',
  type: 'NOTE',
  userContent: {
    note: 'Precio aprobado: $1500',
    approvedBy: 'Javier'
  }
}
```

**Resultado**: La anotación del usuario persiste en Drive. Al recargar, la nota se muestra exactamente como la dejó el usuario.

---

## 🔍 Ventajas de esta Arquitectura

### 1. **Soberanía Local**
- El Front no depende del Backend para saber qué limpiar
- Funciona offline sin consultar BlueprintRegistry

### 2. **Separación de Responsabilidades**
- **Blueprint** (Backend): Valida estructura
- **DataConventions** (Front): Dicta comportamiento de persistencia

### 3. **Escalabilidad**
- Fácil agregar nuevos campos volátiles
- Diferentes contextos pueden usar reglas distintas:
  - `prepareSnapshotForDrive()` - limpieza estricta
  - `prepareSnapshotForDebug()` - preserva todo
  - `prepareSnapshotForExport()` - incluye metadata

### 4. **Trazabilidad**
- `getCleaningReport()` permite debugging
- Logs claros de qué se eliminó y qué se preservó

---

## 📋 Próximos Pasos

1. ✅ **DataConventions creado y cableado**
2. ⏭️ **Implementar SovereignSphere (Latido de Sincronía)**
3. ⏭️ **Implementar Protocolo de Retry Exponencial**
4. ⏭️ **Añadir Badge "Trabajo sin conexión"**
5. ⏭️ **Hook beforeunload para persistencia de emergencia**

---

**Estado**: ✅ IMPLEMENTADO Y CONECTADO
**Fecha**: 2026-02-10
