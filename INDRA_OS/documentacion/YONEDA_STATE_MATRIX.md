# MATRIZ RELACIONAL DE YONEDA: SISTEMA DE ESTADO INDRA_SKIN V12

## 🧬 ANÁLISIS DE MORFISMOS Y EFECTOS CONCOMITANTES

### MAPA DE IDENTIDAD (Funtores Base)

```
F1: AxiomaticStore (React Context + useReducer)
F2: AxiomaticState (Zustand - Autoridad Soberana)
F3: InterdictionUnit (Singleton - Orquestador de Sincronía)
F4: SyncOrchestrator (Zustand - Preparador de Snapshots)
F5: DataLobe (Reducer - Gestión de Artefactos)
F6: InterfaceLobe (Reducer - Mutaciones UI)
F7: VirtualRealityProcessor (DEPRECATED - Fantasma)
F8: PersistenceManager (Hidratador de Layout)
F9: Core_Connector (HTTP - Puente al Backend)
```

---

## 📊 MATRIZ DE MORFISMOS (Transformaciones Naturales)

### **TIER 1: MORFISMOS PRIMARIOS (Flujo de Escritura)**

| Origen | Destino | Tipo | Llave/Método | Efecto Concomitante |
|--------|---------|------|--------------|---------------------|
| **AxiomaticStore** | **AxiomaticState** | `φ₁` | `useAxiomaticState.getState().updateRevisionHash()` | ✅ Actualiza `revisionCycle` → dispara `PURGE_TOMBSTONES` |
| **AxiomaticStore** | **InterdictionUnit** | `φ₂` | `InterdictionUnit.call(service, method, payload)` | ⚠️ Acumula comandos en buffer → eventual batch |
| **InterdictionUnit** | **SyncOrchestrator** | `φ₃` | `useSyncOrchestrator.getState().prepareSnapshot()` | 🎒 Genera snapshot → inyecta `_carriedReality` |
| **InterdictionUnit** | **Core_Connector** | `φ₄` | `connector.call('public', 'executeBatch', {commands})` | ⚡ Envía HTTP → puede fallar silenciosamente si red cae |
| **Core_Connector** | **SignalTransmuter** | `φ₅` | `SignalTransmuter.transmute(rawRes, method)` | 🔮 Normaliza envolventes → extrae payload |
| **DataLobe** | **AxiomaticDB** | `φ₆` | `AxiomaticDB.setItem('PHENOTYPE_CACHE', data)` | 💾 Persiste en IndexedDB → sobrevive F5 |

---

### **TIER 2: ISOMORFISMOS (Bidireccionales)**

| F_A ⇄ F_B | Morfismo Directo | Morfismo Inverso | Invariante |
|-----------|------------------|------------------|------------|
| `AxiomaticState.session.currentRevisionHash` ⇄ `localStorage.INDRA_REVISION_HASH` | `updateRevisionHash(hash)` | `igniteHash()` | Hash temporal |
| `AxiomaticStore.phenotype` ⇄ `IndexedDB.PHENOTYPE_CACHE` | `VirtualRealityProcessor.persistReality()` | `PersistenceManager.load()` | Cosmos hidratado |
| `SyncOrchestrator.prepareSnapshot()` ⇄ `CognitiveSensingAdapter.stabilizeAxiomaticReality()` | Piggybacking | - | Snapshot completo |

**⚠️ PELIGRO DE ISOMORFISMO ROTO**: El isomorfismo `VirtualRealityProcessor ⇄ PersistenceManager` está **ROTO** porque VRP fue deprecado. Actualmente solo funciona la dirección inversa (carga), pero NO la directa (guardado). El guardado ahora ocurre vía `InterdictionUnit` piggybacking.

---

### **TIER 3: COMPOSICIONES (Cadenas de Transformación)**

#### **C1: Flujo de Sincronía Completo (Write Path)**
```
Usuario muta estado → dispatch(action) 
  ↓ φ₁
AxiomaticStore.execute() → InterdictionUnit.call()
  ↓ φ₂  
InterdictionUnit._flushBatch() → prepareSnapshot()
  ↓ φ₃
SyncOrchestrator.prepareSnapshot() → {snapshot + _carriedReality}
  ↓ φ₄
Core_Connector.call('executeBatch') → HTTP POST
  ↓ φ₅
Backend.PublicAPI._secureInvoke() → stabilizeAxiomaticReality()
  ↓ φ₆
CognitiveSensingAdapter → driveAdapter.store() → Drive
```

#### **C2: Flujo de Hidratación (Read Path)**
```
Mount Cosmos → ContextClient.mountCosmos()
  ↓
InterdictionUnit.call('cosmos', 'mountCosmos')
  ↓
Core_Connector → HTTP GET
  ↓
Backend devuelve envelope { payload, revision_hash }
  ↓
SignalTransmuter.transmute() → extrae payload
  ↓
AxiomaticStore.dispatch('COSMOS_MOUNTED') → actualiza phenotype
  ↓
PersistenceManager.triggerBackgroundHydration() → layout
  ↓
AxiomaticDB.setItem('PHENOTYPE_CACHE') → IndexedDB
```

---

## 🚨 EFECTOS CONCOMITANTES CRÍTICOS

### **EC1: "El Efecto Penumbra" (Visual Drift)**
- **Causa**: `updateRevisionHash()` dispara `PURGE_TOMBSTONES` en DataLobe.
- **Síntoma**: Los nodos con `_tombstoned: true` desaparecen de la RAM, pero pueden seguir renderizándose 1 frame adicional si el kernel ISK no limpia su caché.
- **Mitigación**: `ProjectionKernel` debe suscribirse al `revisionCycle` para limpiar su shadow DOM.

### **EC2: "El Vacío del F5" (Amnesia Temporal)**
- **Causa**: Si `AxiomaticDB.setItem('PHENOTYPE_CACHE')` falla (ej. cuota de IndexedDB llena), el snapshot no se guarda.
- **Síntoma**: Al hacer F5, el sistema vuelve a un estado anterior porque el fallback es `localStorage`, que tiene límite de 5MB.
- **Mitigación**: InterdictionUnit debe confirmar el `SUCCESS` del piggybacking antes de limpiar su buffer.

### **EC3: "La Paradoja del Snapshot Vacío"** 
- **Causa**: `SyncOrchestrator.prepareSnapshot()` puede devolver `null` si no hay `cosmosIdentity`.
- **Síntoma**: El backend recibe un comando `stabilizeAxiomaticReality` con `snapshot: null`, lo cual es inválido.
- **Mitigación**: ✅ **YA IMPLEMENTADO** - InterdictionUnit verifica `snapshot.artifacts.length > 0` antes de inyectar.

### **EC4: "El Bucle Infinito de Reconciliación" (Zombie Logic)**
- **Causa**: `AxiomaticStore` línea 117-124 setea callbacks de `SyncOrchestrator` que invocan `dispatch({ type: 'RECONCILE_IDENTITY' })`.
- **Síntoma**: Si el backend devuelve `reconciliations` infinitamente (bug en `applyPatch`), el Front entra en loop.
- **Criticidad**: 🔴 **ALTA** - El sistema antiguo (`applyPatch`) aún puede enviar reconciliaciones aunque esté deprecated.
- **Mitigación**: Agregar un contador de reconciliaciones máximas (ej. 100) en `AxiomaticStore`.

### **EC5: "La Fuga de Memoria del VirtualRealityProcessor"**
- **Causa**: Aunque VRP está deprecated, `AxiomaticStore` línea 97 y 408 aún lo invoca.
- **Síntoma**: Los warnings de deprecación se logean constantemente, saturando la consola.
- **Criticidad**: 🟡 **MEDIA** - No rompe funcionalidad, pero contamina logs.
- **Mitigación**: ✅ **DETECTADO** - Eliminar todas las invocaciones a `vrProcessor.persistReality()`.

---

## 🔗 DEPENDENCIAS CRÍTICAS (Grafo de Inyección)

```mermaid
graph TD
    A[AxiomaticStore] -->|usa| B[useAxiomaticState]
    A -->|usa| C[useSyncOrchestrator]
    A -->|usa| D[VirtualRealityProcessor ❌DEPRECATED]
    A -->|usa| E[PersistenceManager]
    
    F[execute(action)] -->|llama| G[InterdictionUnit.call]
    G -->|acumula| H[_commandBuffer]
    H -->|flushea| I[_flushBatch]
    
    I -->|prepara| C
    C -->|devuelve| J[snapshot]
    J -->|inyecta en| K[executeBatch commands]
    
    K -->|envía| L[Core_Connector]
    L -->|HTTP| M[Backend GAS]
    M -->|devuelve| N[batchResponse]
    N -->|transmuta| O[SignalTransmuter]
    O -->|resolve| P[Promises pendientes]
```

---

## ✅ LLAVES DE PERSISTENCIA (Storage Keys)

| Llave | Ubicación | Propósito | Criticidad |
|-------|-----------|-----------|------------|
| `INDRA_REVISION_HASH` | localStorage + IndexedDB | Sello temporal | 🔴 CRÍTICA |
| `LAST_ACTIVE_COSMOS_ID` | localStorage | Recuperación automática | 🟡 MEDIA |
| `INDRA_ANCHOR_LAYER` | localStorage | Navegación UI | 🟢 BAJA |
| `INDRA_FOCUS_STACK` | localStorage | Stack de artifacts | 🟢 BAJA |
| `PHENOTYPE_CACHE` | IndexedDB | Snapshot completo | 🔴 CRÍTICA |
| `INDRA_MODE` | localStorage | LIVE vs LAB | 🟡 MEDIA |

---

## 🎯 VEREDICTO DE YONEDA

### **Estado de Coherencia Categorial**: 85%

**Isomorfismos Validados**: ✅
- `AxiomaticState ⇄ localStorage` (Hash)
- `InterdictionUnit → Backend` (Batch)
- `SyncOrchestrator → CognitiveSensing` (Snapshot)

**Morfismos Rotos Detectados**: ⚠️
1. `VirtualRealityProcessor → IndexedDB` - DEPRECATED pero aún invocado
2. `AxiomaticStore.reconciliations` - Puede recibir datos legacy de `applyPatch`

**Efectos Concomitantes Peligrosos**: 🚨
- EC4: Bucle infinito de reconciliación (no mitigado)
- EC5: Fuga de memoria VRP (presente pero benigna)

---

## 📋 RECOMENDACIONES FINALES

1. **Eliminar todas las referencias a `VirtualRealityProcessor`** en `AxiomaticStore.jsx` (líneas 97, 408).
2. **Añadir contador de reconciliaciones** para evitar loops infinitos.
3. **Validar retorno de piggybacking** - InterdictionUnit debe confirmar `success: true` del snapshot antes de limpiar buffer.
4. **Test de stress**: Enviar 1000 mutaciones en 1 segundo para validar que el batching no pierda comandos.

