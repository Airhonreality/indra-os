# Guía Quirúrgica de Implementación: Indra OS v6.0

Este documento define la purificación absoluta del Core para la transición al paradigma Micelar Relacional. **Axioma:** No se mantienen fallbacks por miedo; se construye la perfección desde el origen.

## 1. Artefactos Afectados y Transformación

### 1.1 `provider_system_ledger.gs` (El Núcleo Polimórfico)
- **Transformación:** Pasa de gestor de "La Hoja" a gestor de "Cualquier Hoja".
- **Nuevas Funciones:** `ledger_sync_relation()`, `ledger_list_relations()`, `_ledger_get_target_sheet(context)`.
- **Purificación:** Eliminar `_ledger_get_sheet()` como endpoint único. Toda consulta debe ser interceptada por el selector de contexto.

### 1.2 `mount_manager.gs` (La Sinapsis JIT)
- **Transformación:** Implementación de un pool de conexiones efímeras.
- **Patrón:** Cache LRU (Least Recently Used) para no re-abrir la misma Spreadsheet en peticiones encadenadas.
- **Purificación:** Desactivar el uso de `PropertiesService` para mounts que no sean el ROOT. El resto se descubre por Gossip.

### 1.3 `protocol_router.gs` (El Orquestador de Consciencia)
- **Transformación:** Se convierte en un "Tejedor de Flechas". 
- **Lógica:** Al retornar un átomo, el Router debe disparar una consulta paralela a la tabla de `RELATIONS` para enviar el "contexto relacional" al front-end.
- **Purificación:** Eliminar validaciones de seguridad basadas en "Master Bypass". El Router ahora solo confía en el registro oficial de la ACL.

### 1.4 `provider_system_infrastructure.gs` (La Fábrica Micelar)
- **Transformación:** Las funciones de creación ahora retornan el ID de la Célula y su Manifiesto vinculado.
- **Purificación:** Amputar la lógica de creación de archivos JSON planos sin su correspondiente registro en el Ledger local.

## 2. Patrones de Diseño Axiomático (TGS)

1. **Axioma de Localidad (Soberanía):** El registro de una relación vive en el nodo donde se origina. (Si A conoce a B, la flecha está en el Ledger de A).
2. **Axioma de Sinceridad Total:** El Core no inventa datos. Si un puerto JIT falla, el sistema reporta `RESONANCE_LOST` en lugar de un array vacío.
3. **Axioma de Identidad por Registro:** La identidad de un usuario se valida contra el Ledger de la célula a la que intenta entrar, no contra una base de datos central de "usuarios".

## 3. Anti-patrones a Evitar (Pecados Capitales)

- **Shadow Monolith:** Crear 1000 sheets pero seguir consultando una tabla central para todo. (Solución: Usar los `manifest.json` locales para el descubrimiento).
- **Relational Loops:** Flechas infinitas que causan recursión en el Router. (Solución: Límite de salto de grafo profundidad = 1 por petición).
- **State Bleeding:** No usar variables globales fuera de funciones para evitar que datos de una petición "manchen" la siguiente en el entorno multi-hilo de GAS.

## 4. Manual de Purificación (Código Legacy a Eliminar)

- `system_config.gs`: Eliminar fallback `anonymous@indra-os.com` en `readCoreOwnerEmail`.
- `api_gateway.gs`: Eliminar bloque `_authorizeGateway_` que usaba el email del dueño como bypass.
- `provider_system_ledger.gs`: Eliminar `MASTER_LEDGER_COLUMNS` viejos (sin ACL ni RELATIONS).

---
*Indra OS v6.0 — Sin rastro del pasado, dueños del futuro.*
