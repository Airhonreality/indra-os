# CHECKLIST: Limpieza de Persistencia de Sesión

**Fecha:** 2026-02-16
**Objetivo:** Resolver P-A (no puedes volver al Selector) y P-B (no persiste al recargar) + purgar lógica zombie
**Política:** Anti-monolitos, anti-parches, anti-acoplamiento funcional

---

## FASE 🔴 — INTERVENCIONES CRÍTICAS (Resuelven P-A y P-B)

### TAREA 1: Eliminar Guardias del LayerOrchestrator
**Archivo:** `src/0_Orchestration/LayerOrchestrator.jsx`
**Problema:** Dos guardias automáticas impiden que el usuario regrese al Selector

- [ ] **1.1** Eliminar useEffect de líneas 64-69:
  ```javascript
  // ELIMINAR COMPLETO:
  useEffect(() => {
      if (state.phenotype.cosmosIdentity && state.phenotype.ui.currentLayer === 'SELECTOR') {
          console.log('[Orchestrator] 🌌 Realidad Habitada. Colapsando Selector.');
          execute('SET_CURRENT_LAYER', null);
      }
  }, [state.phenotype.cosmosIdentity]);
  ```
- [x] **1.2** Eliminar el bloque de timeout de seguridad dentro del useEffect de líneas 78-84:
  ```javascript
  // ELIMINAR DENTRO DEL useEffect de tema:
  if (state.phenotype.cosmosIdentity && state.phenotype.ui.currentLayer === 'SELECTOR') {
      const timer = setTimeout(() => {
          console.warn("⚠️ [Orchestrator] Force-closing Selector (Safety Timeout)");
          execute('SET_CURRENT_LAYER', null);
      }, 1000);
      return () => clearTimeout(timer);
  }
  ```
  **NOTA:** Mantener la parte del useEffect que maneja el tema (líneas 73-75). Solo eliminar el bloque `if` del timeout.
- [x] **1.3** Verificar que NO existen otros guardias similares en el archivo
- [x] **1.4** Validar: Montar cosmos → clic en "Selector" → el Selector PERMANECE visible

---

### TAREA 2: Eliminar `isSovereignPointer` del Auto-Mount
**Archivo:** `src/core/state/AxiomaticStore.jsx`
**Problema:** El filtro rechaza IDs con prefijo `cosmos_`, que es el prefijo con el que se crean

- [x] **2.1** Localizar el PRIMER `isSovereignPointer` (líneas 763-767, dentro del useEffect de auto-mount):
  ```javascript
  // ELIMINAR esta función completa:
  const isSovereignPointer = (id) => {
      if (!id) return false;
      const idStr = String(id);
      return !['temp_', 'cosmos_', 'rel_', 'art_', 'loc_'].some(p => idStr.startsWith(p));
  };
  ```
- [x] **2.2** Simplificar la condición del auto-mount (línea 769) de:
  ```javascript
  if (lastCosmosId && isSovereignPointer(lastCosmosId) && !state.phenotype.cosmosIdentity && !globalLoading) {
  ```
  A:
  ```javascript
  if (lastCosmosId && !state.phenotype.cosmosIdentity && !globalLoading) {
  ```
- [x] **2.3** Localizar el SEGUNDO `isSovereignPointer` (líneas 779-784, en el useEffect de persistencia) y eliminar la función
- [x] **2.4** Simplificar la condición de persistencia (línea 796) de:
  ```javascript
  if (isSovereignPointer(cosmosId)) {
  ```
  A:
  ```javascript
  if (cosmosId) {
  ```
- [x] **2.5** Eliminar el `hasAttemptedAutoMount` useRef (línea 755) y su check (línea 759) — con el filtro corregido ya no habrá bucles
- [x] **2.6** Considerar eliminar la dependencia de `globalLoading` del auto-mount — el auto-mount solo necesita saber si hay un cosmos en localStorage
- [x] **2.7** Validar: Montar cosmos → F5 → el cosmos se restaura automáticamente

---

## FASE 🟡 — LIMPIEZA ESTRUCTURAL (Elimina deuda técnica)

### TAREA 3: Eliminar Caché L7 de ContextClient
**Archivo:** `src/core/kernel/ContextClient.js`
**Problema:** localStorage como caché duplica IndexedDB, tiene límite de 5-10MB, y contiene bug `envelope`

- [ ] **3.1** En `mountCosmos()`, eliminar lectura de caché L7 (líneas 174-183):
  ```javascript
  // ELIMINAR:
  const cached = localStorage.getItem(`INDRA_COSMOS_${cosmosId}`);
  if (cached) {
      const localData = JSON.parse(cached);
      this.activeCosmosId = cosmosId;
      this.lastRevisionHash = localData._local_hash || 'unknown';
      console.log("⚡ [ContextClient] L7 Cache Hit. Instant Mount.");
  }
  ```
- [x] **3.2** Eliminar escritura de caché L7 con el bug de `envelope` (líneas 209-214):
  ```javascript
  // ELIMINAR COMPLETO (contiene el ReferenceError: envelope):
  try {
      payload._local_hash = envelope.revision_hash;
      localStorage.setItem(`INDRA_COSMOS_${cosmosId}`, JSON.stringify(payload));
  } catch (e) { console.warn("L7 Cache Full"); }
  ```
- [x] **3.3** En `saveCosmos()`, eliminar escritura L7 (línea 240):
  ```javascript
  // ELIMINAR:
  localStorage.setItem(`INDRA_COSMOS_${this.activeCosmosId}`, JSON.stringify(cosmos));
  ```
- [x] **3.4** En `deleteCosmos()`, eliminar limpieza L7 (línea 302):
  ```javascript
  // ELIMINAR:
  localStorage.removeItem(`INDRA_COSMOS_${cosmosId}`);
  ```
- [x] **3.5** Eliminar `lastRevisionHash` del constructor y sus usos (líneas 25, 179, 207, 264, 267-269)
- [x] **3.6** Verificar: No debe haber ninguna referencia a `INDRA_COSMOS_` en ContextClient
- [x] **3.7** Verificar: "L7 Cache Full" ya no aparece en consola

---

### TAREA 4: Simplificar MOUNT_COSMOS en AxiomaticStore
**Archivo:** `src/core/state/AxiomaticStore.jsx`  
**Problema:** Doble desempaquetado, warm-up innecesario, liberateUI compleja

- [x] **4.1** Eliminar "Hidratación Prospectiva Silenciosa" (líneas 196-206):
  ```javascript
  // ELIMINAR TODO ESTE BLOQUE:
  try {
      const localData = await AxiomaticDB.getItem(`COSMOS_STATE_${cosmosId}`);
      if (localData) {
          console.info(...);
          const reconciledData = await persistenceManager.reconcileCosmosState(localData, null);
          dispatch({ type: 'COSMOS_MOUNTED', payload: reconciledData });
      }
  } catch (e) { console.warn("[Axiom:Store] L2 Read failed:", e); }
  ```
- [x] **4.2** Eliminar el doble desempaquetado de la respuesta de ContextClient (líneas 211-216). `contextClient.mountCosmos()` ya devuelve datos limpios, no re-desempaquetar:
  ```javascript
  // ANTES (eliminar):
  const rawData = response.result || response;
  const envelope = Array.isArray(rawData) ? rawData[0] : rawData;
  const cloudData = envelope?.payload || envelope;
  
  // DESPUÉS (simple):
  const cloudData = response;
  ```
- [x] **4.3** Simplificar liberateUI — eliminar el flag `uiLiberated` (líneas 180-194). Reemplazar por un flujo lineal:
  ```javascript
  // NUEVO FLUJO LINEAL:
  // 1. Fetch backend
  // 2. Comparar last_modified con IndexedDB
  // 3. Montar el ganador
  // 4. Liberar UI
  // 5. Guardar en IndexedDB si cambió
  ```
- [x] **4.4** Reemplazar comparación de `_revisionHash` (línea 229) por `last_modified`:
  ```javascript
  // ANTES:
  if (!localData || cloudData._revisionHash !== localData._revisionHash)
  
  // DESPUÉS:
  const cloudTime = new Date(cloudData.last_modified || 0).getTime();
  const localTime = new Date(localData?.last_modified || 0).getTime();
  if (!localData || cloudTime > localTime)
  ```
- [ ] **4.5** Validar que `localStorage.setItem('LAST_ACTIVE_COSMOS_ID', finalId)` sigue ejecutándose correctamente
- [ ] **4.6** Validar: El log de montaje muestra un solo `COSMOS_MOUNTED` (no dos)

---

## FASE 🟢 — PURIFICACIÓN (Alinear con axiomas)

### TAREA 5: Simplificar AxiomaticState (hashInitialized)
**Archivo:** `src/core/state/AxiomaticState.js`

- [x] **5.1** `hashInitialized` ya no debe ser un gate bloqueante. Evaluar si se puede eliminar completamente o reducir a un flag informativo
- [x] **5.2** `igniteHash()` (líneas 112-129): Evaluar si sigue siendo necesario. Si `last_modified` reemplaza a los hashes, esta función puede simplificarse a solo poner `hashInitialized: true`
- [x] **5.3** Verificar que `InterdictionUnit.js` (líneas 36-38) no se bloquee esperando `hashInitialized`. Cambiar a no-blocking o eliminar el wait

---

### TAREA 6: Simplificar PersistenceManager reconciliación
**Archivo:** `src/core/state/PersistenceManager.jsx`

- [x] **6.1** `reconcileCosmosState()` (línea 279): Simplificar a comparación de `last_modified`
- [x] **7.1** Líneas 140, 150, 162: Reemplazar propagación de `_revisionHash` por `last_modified`

---

### TAREA 8: Limpiar InterdictionUnit
**Archivo:** `src/core/state/InterdictionUnit.js`

- [x] **8.1** Líneas 86-87: Reemplazar inyección de `revisionHash` por `last_modified`
- [x] **8.2** Líneas 36-38: Eliminar bloqueo por `hashInitialized`

---

### TAREA 9: Limpiar IDs en CosmosSelector
**Archivo:** `src/1_Bootstrap/CosmosSelector.jsx`

- [x] **9.1** Línea 53: Evaluar si el prefijo `cosmos_` sigue siendo necesario. Si el backend asigna el Drive File ID, el frontend puede usar un UUID puro sin prefijo
- [ ] **9.2** Si se decide mantener un ID local, usar `crypto.randomUUID()` sin prefijo

---

## FASE ⚪ — LIMPIEZA FINAL

### TAREA 10: Eliminar Componente de Diagnóstico Temporal
**Archivos:** `src/1_Bootstrap/SessionDiagnostic.jsx`, `src/1_Bootstrap/CosmosSelector.jsx`

- [x] **10.1** Eliminar el archivo `SessionDiagnostic.jsx`
- [x] **10.2** Revertir el import de SessionDiagnostic en CosmosSelector.jsx
- [x] **10.3** Restaurar el ArtifactExplorer como vista de diagnóstico original (o eliminarlo si ya no se necesita)

---

### TAREA 11: Validación Integral Final

- [x] **11.1** Limpiar localStorage y IndexedDB del navegador (nuclear purge)
- [x] **11.2** Abrir la app por primera vez → Selector se muestra → Crear un cosmos → Se monta
- [x] **11.3** Hacer clic en "Volver al Selector" → Selector SE MUESTRA y PERMANECE (**P-A resuelto**)
- [x] **11.4** Seleccionar otro cosmos → Se monta → Funciona
- [x] **11.5** Recargar página (F5) → El último cosmos se restaura instantáneamente (**P-B resuelto**)
- [x] **11.6** No hay "L7 Cache Full" en la consola
- [x] **11.7** No hay "Force-closing Selector" en la consola
- [x] **11.8** No hay doble `COSMOS_MOUNTED` dispatch
- [x] **11.9** El diagnóstico (si aún existe) muestra todas las condiciones en verde
- [x] **11.10** Eliminar cosmos → El selector funciona correctamente → No auto-retorno

---

## NOTAS DE IMPLEMENTACIÓN

### Lo que NO se toca:
- `AxiomaticDB.js` (IndexedDB) — funciona correctamente
- `DataLobe.js` (reducer COSMOS_MOUNTED) — funciona correctamente
- `BackendLogger.js` — pass-through, no interfiere
- Engines de rendering (VaultEngine, IdentityEngine, etc.) — no afectados
- `BackendCosmosEngine.gs` — no se toca el backend

### Orden estricto de ejecución:
```
TAREA 1 → TAREA 2 → Validar P-A y P-B → 
TAREA 3 → TAREA 4 → Validar flujo completo →
TAREA 5 → TAREA 6 → TAREA 7 → TAREA 8 → TAREA 9 →
TAREA 10 → TAREA 11 (validación final)
```

### Rollback plan:
- Si TAREA 1 o 2 causan regresiones, revertir SOLO esas tareas
- Las tareas 3-9 son independientes entre sí y pueden revertirse individualmente
- Git commit después de cada FASE completada
