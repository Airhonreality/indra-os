# PERSISTENCE CONTRACT SCHEMA
**Version:** 1.0  
**Status:** CANONICAL LAW  
**Author:** INDRA Core Team  
**Date:** 2026-02-03

---

## **Ontología**

El **Persistence Contract** es una declaración canónica que define qué datos de un Adapter deben persistir en el `flow_state` del Cosmos y bajo qué condiciones.

### **Principios Axiomáticos**

1. **Declaratividad**: Los adapters declaran qué persisten, no cómo.
2. **TTL Inteligente**: Cada dato tiene un tiempo de vida (Time To Live).
3. **Scope Flexible**: Los datos pueden ser `SESSION` (volátil) o `COSMOS` (persistente).
4. **Hidratación Automática**: El Store se puebla desde `flow_state` al montar el Cosmos.
5. **Sincronización Bidireccional**: Cambios en Store → flow_state y viceversa.

---

## **Schema del Contrato**

```typescript
PERSISTENCE_CONTRACT: {
  [dataKey: string]: {
    ttl: number,              // Tiempo de vida en segundos
    scope: "SESSION" | "COSMOS",  // Dónde persiste
    hydrate: boolean,         // Auto-hidratar al montar Cosmos
    compute?: "EAGER" | "LAZY",   // Cómo calcular (opcional)
    validator?: string        // Función de validación (opcional)
  }
}
```

### **Campos**

- **`dataKey`**: Identificador único del dato (ej: `vault_tree`, `inbox_cache`)
- **`ttl`**: Tiempo en segundos antes de considerar el dato obsoleto
- **`scope`**: 
  - `SESSION`: Se guarda en memoria, se pierde al recargar
  - `COSMOS`: Se guarda en `flow_state`, persiste entre sesiones
- **`hydrate`**: Si `true`, el dato se carga automáticamente al montar el Cosmos
- **`compute`**: 
  - `EAGER`: Se calcula inmediatamente al solicitar
  - `LAZY`: Se calcula bajo demanda (default)
- **`validator`**: Nombre de función que valida la integridad del dato

---

## **Ejemplo: DriveAdapter**

```javascript
PERSISTENCE_CONTRACT: {
  vault_tree: {
    ttl: 300,           // 5 minutos
    scope: "COSMOS",
    hydrate: true
  },
  folder_sizes: {
    ttl: 3600,          // 1 hora
    scope: "COSMOS",
    hydrate: false,
    compute: "LAZY"
  },
  recent_files: {
    ttl: 60,            // 1 minuto
    scope: "SESSION",
    hydrate: true
  }
}
```

---

## **Mapeo a flow_state**

Los datos declarados en el contrato se mapean a:

```json
{
  "flow_state": {
    "persistence": {
      "drive": {
        "vault_tree": {
          "data": { ... },
          "timestamp": "2026-02-03T22:55:00Z"
        },
        "folder_sizes": {
          "data": { ... },
          "timestamp": "2026-02-03T21:00:00Z"
        }
      },
      "email": {
        "inbox_cache": { ... }
      }
    }
  }
}
```

---

## **Flujo de Hidratación**

1. **Usuario monta Cosmos** → `MOUNT_COSMOS` action
2. **PersistenceManager** lee `PERSISTENCE_CONTRACT` de cada adapter activo
3. Para cada `dataKey` con `hydrate: true`:
   - Verificar si existe en `flow_state.persistence[adapterId][dataKey]`
   - Verificar TTL: `now - timestamp < ttl`
   - Si válido → hidratar Store
   - Si expirado → fetch + actualizar flow_state
4. **Store poblado** sin llamadas redundantes

---

## **Flujo de Sincronización**

1. **Usuario ejecuta acción** (ej: `DELETE_VAULT_ITEM`)
2. **Store se actualiza** (reducer)
3. **PersistenceManager** detecta cambio en dato con `scope: "COSMOS"`
4. **Actualiza flow_state** → `cosmosSync.update()`
5. **Cosmos se guarda** en Drive

---

## **Validación del Contrato**

El `SchemaRegistry` debe validar que:
- Todos los `dataKey` sean únicos por adapter
- `ttl` sea un número positivo
- `scope` sea `SESSION` o `COSMOS`
- `hydrate` sea booleano
- `compute` (si existe) sea `EAGER` o `LAZY`

---

## **Implementación**

Ver:
- `PersistenceManager.jsx` (Frontend)
- `SchemaRegistry.gs` (Backend - validación)
- `AxiomaticStore.jsx` (Integración)
