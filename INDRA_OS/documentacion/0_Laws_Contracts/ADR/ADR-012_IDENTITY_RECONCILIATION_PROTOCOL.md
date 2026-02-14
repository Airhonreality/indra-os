---
title: ADR-012: Authoritative Identity Protocol (Deterministic Genesis)
status: ACCEPTED (SUPERSEDES Optimistic Reconciliation)
date: 2026-02-13
author: Antigravity Agent
tags: [architecture, state, identity, determinism, data-integrity]

# 1. El Problema (Contexto)
El modelo anterior de **Optimismo Radical** utilizaba IDs temporales (`temp_...`) creados en el cliente para permitir interacciones inmediatas. Sin embargo, esto introducía **falla de entropía**:
1.  **Zombies de Identidad**: Si la confirmación del servidor fallaba o se duplicaba, quedaban artefactos con IDs temporales persistidos en caché o en Drive.
2.  **Complejidad de Reconciliación**: El sistema necesitaba una fase de "bautismo" (`RECONCILE_IDENTITY`) para buscar y reemplazar IDs en toda la arquitectura de memoria (O(n)).
3.  **Colisión de Realidades**: El backend recibía archivos temporales que luego se convertían en archivos reales en Drive, duplicando el consumo de recursos y memoria.

# 2. La Decisión: Identidad Autoritaria y Determinista
Indra OS migra hacia un modelo de **Identidad Autoritaria** (v14.2) donde el concepto de "temporal" es eliminado de la capa lógica central.

### El Nuevo Ciclo de Vida:
1.  **Génesis Cosmos (Autoridad Central)**: La creación de un Cosmos es una acción **bloqueante (Wait-for-Truth)**. La UI espera a que el Core (L0) asigne un ID real de Google Drive antes de proyectar o montar la realidad.
2.  **Génesis de Artefactos (Determinismo de Nacimiento)**: Los nodos y relaciones se generan con un ID final basado en `node_UUID` o `rel_UUID` desde el primer milisegundo. Este ID es persistente y no requiere reconciliación posterior.
3.  **Eliminación de la Fase de Reconciliación**: Se eliminan todas las acciones `RECONCILE_*`. La identidad es **inmutable** desde su manifestación.

# 3. Diseño Técnico

### Generación Determinista
En lugar de IDs temporales que caducan, usamos identidades finales:
```javascript
id: `node_${crypto.randomUUID().split('-')[0]}_${Date.now().toString(36)}`
```

### Flujo de Creación de Cosmos (v14.2):
1.  `CosmosSelector` envía `saveCosmos` con `cosmosId: null`.
2.  El Backend crea el archivo, obtiene el ID oficial y lo devuelve.
3.  El Frontend recibe la **Verdad** y ejecuta el `MOUNT_COSMOS` con el ID final.

# 4. Reglas de Engagement
*   **Prohibición de `temp_`**: Queda prohibido el uso de prefijos `temp_` para cualquier entidad que deba ser persistida en el Cosmos.
*   **UUID at Birth**: Todo objeto nuevo debe nacer con su identidad definitiva.
*   **Wait for Cosmos Identity**: Solo la identidad del Cosmos (el contenedor) requiere esperar al servidor para garantizar la paridad con el sistema de archivos del Core.

# 5. Consecuencias
*   **Positivas**: Eliminación total de archivos duplicados en Drive. Reducción drástica de la lógica de reducers. Consistencia absoluta en la navegación (Breadcrumbs estables).
*   **Negativas**: El usuario percibe una pequeña latencia (spinner) SÓLO al crear un Cosmos nuevo, compensada por la estabilidad total posterior.

---
