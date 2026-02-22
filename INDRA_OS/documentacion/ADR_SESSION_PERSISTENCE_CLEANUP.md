# ADR: Limpieza Profunda del Flujo de Persistencia de Sesión

**Fecha:** 2026-02-16
**Estado:** PROPUESTA (Pendiente de aprobación)
**Motivación:** Bugs validados P-A y P-B causados por lógica zombie de persistencia

---

## AXIOMAS RECTORES (La Nueva Constitución)

### AXIOMA 1: `last_modified` es la VERDAD
- No hay revision hashes, no hay relojes suizos, no hay sellos cronológicos.
- Un solo timestamp: `last_modified`. El más reciente gana.

### AXIOMA 2: El Front SIEMPRE actúa a toda velocidad
- Cero bloqueos. Cero "esperar a que el hash se reifique".
- El Front opera con lo que tiene. Empaqueta snapshots al Core SOLO cuando hay una petición REAL.
- No hay "warm-up", no hay "reconciliación prospectiva", no hay "hidratación de fondo".

### AXIOMA 3: Un SOLO momento de sincronización
- **Al abrir/recargar:** Lee localStorage → monta instantáneo → UN solo fetch de validación al Core.
- **Durante la sesión:** El Front ES la verdad. El snapshot del Front sobreescribe el Core.
- **Solo excepción:** Si `last_modified` del Core es más reciente, el Core gana.

---

## MAPA FORENSE: LÓGICA ZOMBIE IDENTIFICADA

### ZONA 1: IDs Temporales y Filtro Soberano (ELIMINAR)

| Archivo | Línea(s) | Qué hace | Por qué es zombie |
|---------|----------|----------|-------------------|
| `AxiomaticStore.jsx` | 763-767, 779-784 | `isSovereignPointer()` — rechaza IDs que empiecen con `cosmos_`, `temp_`, `rel_`, `art_`, `loc_` | Los IDs de Cosmos SE CREAN con prefijo `cosmos_`. La función BLOQUEA el auto-mount. **CAUSA RAÍZ de P-B.** |
| `CosmosSelector.jsx` | 53 | Crea IDs como `cosmos_${randomUUID}_${timestamp}` | El prefijo `cosmos_` es innecesario. El backend asigna el ID real (Drive File ID). |
| `ContextClient.js` | 143 | Filtra artefactos que empiecen con `temp_` | Ya no se crean IDs temporales. Zombie. |
| `ChaosEngine.js` | 25 | Crea IDs `temp_chaos_*` | Módulo de testing. Evaluar si sigue activo. |

**ACCIÓN:** Eliminar `isSovereignPointer` completamente. Eliminar prefijo `cosmos_` de la generación de IDs. El ID es el que el backend devuelve, punto.

---

### ZONA 2: Guardias del LayerOrchestrator (REDISEÑAR)

| Archivo | Línea(s) | Qué hace | Por qué es zombie |
|---------|----------|----------|-------------------|
| `LayerOrchestrator.jsx` | 64-68 | useEffect: Si `cosmosIdentity` + `currentLayer === 'SELECTOR'` → forzar `null` | **CAUSA RAÍZ de P-A.** Impide volver al Selector. |
| `LayerOrchestrator.jsx` | 78-84 | setTimeout 1s: Mismo check pero con delay | Segundo guardia duplicado. **Doble bloqueo.** |

**ACCIÓN:** Eliminar ambas guardias. La lógica de "cerrar el Selector después del montaje" debe ser responsabilidad de `MOUNT_COSMOS` (ya lo hace con `liberateUI` → `SET_CURRENT_LAYER(null)`). No necesita un observador externo.

---

### ZONA 3: Sistema de Revision Hashes (SIMPLIFICAR)

| Archivo | Línea(s) | Qué hace | Por qué es zombie |
|---------|----------|----------|-------------------|
| `AxiomaticState.js` | 23, 73, 112-129, 149 | `hashInitialized`, `igniteHash()`, `currentRevisionHash` | Toda una máquina de estado para un hash que debería ser un simple `last_modified`. |
| `AxiomaticStore.jsx` | 118 | `igniteHash()` al montar | Gate innecesario si usamos `last_modified`. |
| `AxiomaticStore.jsx` | 229, 234-236 | Compara `_revisionHash` entre local y cloud | Reemplazar por comparación de `last_modified`. |
| `AxiomaticStore.jsx` | 751, 758, 774 | `hashInitialized` como gate del auto-mount | El auto-mount no necesita esperar un hash. Solo necesita `LAST_ACTIVE_COSMOS_ID`. |
| `InterdictionUnit.js` | 36-38, 86-87 | Espera `hashInitialized` antes de dispatchar; inyecta `revisionHash` en requests | El hash lo puede inyectar sin esperarlo. Si no existe, envía null. |
| `ContextClient.js` | 199, 207, 212, 264, 267-269 | Gestiona `lastRevisionHash` | Reemplazar por `last_modified`. |
| `SignalTransmuter.js` | 140, 150, 162 | Propaga `_revisionHash` en señales | Propagar `last_modified` en su lugar. |
| `SyncOrchestrator.js` | 53 | Inyecta `_revisionHash` | Inyectar `last_modified`. |

**ACCIÓN:** Reemplazar todo el sistema de `revisionHash` por comparación directa de `last_modified` (ISO 8601 timestamp). `hashInitialized` deja de ser un gate — se puede mantener para saber si ya hubo una lectura inicial pero NO debe bloquear el auto-mount.

---

### ZONA 4: Caché L7 en localStorage (ELIMINAR)

| Archivo | Línea(s) | Qué hace | Por qué es zombie |
|---------|----------|----------|-------------------|
| `ContextClient.js` | 174-183 | Lee `INDRA_COSMOS_${id}` de localStorage como "L7 Cache Hit" | Duplica la caché de IndexedDB (L2). localStorage tiene límite de 5-10MB. Genera "L7 Cache Full" fantasma. |
| `ContextClient.js` | 210-214 | Escribe en localStorage + referencia a `envelope` inexistente | **BUG ACTIVO:** `envelope.revision_hash` causa ReferenceError silencioso. |
| `ContextClient.js` | 240 | `saveCosmos` también escribe en localStorage | Doble escritura innecesaria. |
| `ContextClient.js` | 302 | `deleteCosmos` limpia localStorage | Limpieza de algo que no debería existir. |

**ACCIÓN:** Eliminar toda la capa L7 (localStorage como caché de cosmos). IndexedDB (L2 = `AxiomaticDB`) es suficiente y no tiene el límite de 5-10MB.

---

### ZONA 5: Doble Desempaquetado (UNIFICAR)

| Archivo | Línea(s) | Qué hace | Por qué es zombie |
|---------|----------|----------|-------------------|
| `ContextClient.js` | 190-204 | Desempaqueta `data.result`, unwrap array, valida esencia | PRIMER desempaquetado |
| `AxiomaticStore.jsx` | 211-216 | Desempaqueta `response.result`, unwrap array, unwrap `.payload` | SEGUNDO desempaquetado del mismo dato |

El dato se desempaqueta DOS VECES. `ContextClient` ya hace el unwrap completo. `AxiomaticStore` intenta hacerlo otra vez sobre datos ya limpios.

**ACCIÓN:** `ContextClient.mountCosmos()` devuelve datos LIMPIOS. `AxiomaticStore` los usa directamente sin re-desempactar.

---

### ZONA 6: Flujo liberateUI / Warm-up (SIMPLIFICAR)

| Archivo | Línea(s) | Qué hace | Por qué es zombie |
|---------|----------|----------|-------------------|
| `AxiomaticStore.jsx` | 180-194 | `liberateUI` — flag booleana para evitar doble liberación | Complejidad innecesaria si hay un solo flujo lineal. |
| `AxiomaticStore.jsx` | 196-206 | "Hidratación Prospectiva" — monta local ANTES del backend | Establece un estado que luego se sobreescribe. Causa renders intermedios. |

**ACCIÓN:** Un solo flujo lineal:
1. Leer de IndexedDB (instantáneo)
2. Si existe → `COSMOS_MOUNTED` → UI libre
3. Fetch al backend en background
4. Si `last_modified` del backend > local → actualizar y dispatch de nuevo
5. Si `last_modified` local >= backend → no hacer nada

---

## NUEVO FLUJO PROPUESTO: "Velocidad Pura"

### Al Recargar / Abrir:
```
1. localStorage.getItem('LAST_ACTIVE_COSMOS_ID')
   → ¿Existe? → Sí → Paso 2
   → ¿No existe? → Mostrar Selector. FIN.

2. AxiomaticDB.getItem(`COSMOS_STATE_${id}`)
   → ¿Existe? → dispatch('COSMOS_MOUNTED', localData) → UI LIBRE (0ms de espera)
   → ¿No existe? → Mostrar loading

3. contextClient.mountCosmos(id) → fetch al Core (background)
   → ¿last_modified del Core > last_modified local? → dispatch('COSMOS_MOUNTED', cloudData) → Actualizar IndexedDB
   → ¿last_modified local >= Core? → No hacer nada (ya proyectamos lo correcto)
   → ¿Error de red? → Si ya montamos local → modo degradado. Si no → Selector.
```

### Al Navegar al Selector:
```
1. dispatch('SET_CURRENT_LAYER', 'SELECTOR')
2. SIN guardias que lo reviertan
3. cosmosIdentity PERMANECE (no se borra, solo se oculta la vista)
4. Al volver al Cosmos: dispatch('SET_CURRENT_LAYER', null) → cosmos sigue ahí
```

### Al Guardar:
```
1. Actualizar state local (instantáneo)
2. Actualizar `last_modified = new Date().toISOString()`
3. Guardar snapshot en IndexedDB
4. Enviar snapshot al Core (fire & forget, o queued)
```

---

## ARCHIVOS AFECTADOS (Orden de intervención)

| Prioridad | Archivo | Acción | Riesgo |
|-----------|---------|--------|--------|
| 🔴 1 | `LayerOrchestrator.jsx` | Eliminar guardias líneas 64-68 y 78-84 | BAJO — Solo elimina lógica reactiva |
| 🔴 2 | `AxiomaticStore.jsx` (auto-mount) | Eliminar `isSovereignPointer`, simplificar condiciones | BAJO — Solo quita filtro |
| 🟡 3 | `ContextClient.js` (mountCosmos) | Eliminar L7 cache, fix `envelope` bug, limpiar desempaquetado | MEDIO — Afecta todo mount |
| 🟡 4 | `AxiomaticStore.jsx` (MOUNT_COSMOS) | Eliminar doble desempaquetado, eliminar warm-up, simplificar a flujo lineal | MEDIO — Flujo crítico |
| 🟢 5 | `AxiomaticState.js` | Simplificar `hashInitialized` (mantener como flag pero no como gate) | BAJO |
| 🟢 6 | `PersistenceManager.jsx` | Simplificar `reconcileCosmosState` a comparación de `last_modified` | BAJO |
| ⚪ 7 | `InterdictionUnit.js` | Dejar de bloquear por `hashInitialized` | BAJO |
| ⚪ 8 | `SignalTransmuter.js` | Propagar `last_modified` en vez de `_revisionHash` | BAJO |
| ⚪ 9 | `CosmosSelector.jsx` | Eliminar generación de IDs `cosmos_*` (usar UUID puro o delegar al backend) | BAJO |

---

## LO QUE NO SE TOCA

- `AxiomaticDB` (IndexedDB) — funciona bien, es la caché correcta
- `DataLobe.js` (reducer) — funciona bien, procesa `COSMOS_MOUNTED` correctamente
- `BackendLogger.js` — pass-through, no interfiere
- Frontend rendering (engines, projections) — no afectados

---

## MÉTRICAS DE ÉXITO

1. ✅ Montar cosmos → Clic en "Selector" → El Selector SE MUESTRA y PERMANECE
2. ✅ Montar cosmos → F5 → El cosmos se restaura INSTANTÁNEAMENTE desde IndexedDB
3. ✅ No hay "L7 Cache Full" en la consola
4. ✅ No hay doble `COSMOS_MOUNTED` dispatch
5. ✅ El diagnóstico muestra todas las condiciones en verde
