# SyncOrchestrator.js - Atomic Contract

> **Ubicación:** `store/orchestrators/SyncOrchestrator.js`  
> **Versión:** 10.0.0  
> **Última Actualización:** 2026-01-08

---

## Dharma (Propósito)
Coordinar la persistencia y sincronización del sistema. Orquesta la interacción entre slices y PersistenceAgent.

---

## Axiomas (Invariantes)

1. **Coordinación Pura**: No contiene lógica de persistencia, solo coordina.
2. **Validación Pre-Guardado**: Valida estado antes de delegar a PersistenceAgent.
3. **Feedback de Estado**: Actualiza flags de sincronía en SessionSlice.
4. **Manejo de Errores**: Captura errores y los reporta al usuario.

---

## Interfaz Pública

### Funciones

#### `saveSystemState()`
Coordina el guardado del sistema completo.

**Flujo:**
1. Lee estado de CosmosSlice y TopologySlice
2. Valida estructura
3. Llama a PersistenceAgent.saveSystemState()
4. Actualiza SessionSlice con resultado

**Retorna:** `Promise<{ success: boolean, error?: string }>`

---

## Protocolo de Uso

```javascript
import { saveSystemState } from './store/orchestrators/SyncOrchestrator';

async function handleSave() {
  const result = await saveSystemState();
  if (result.success) {
    console.log('✅ Guardado exitoso');
  } else {
    console.error('❌ Error:', result.error);
  }
}
```

---

## Relacionado
- [PersistenceAgent.contract.md](../../core-bridge/PersistenceAgent.contract.md)
- [CosmosSlice.contract.md](../CosmosSlice.contract.md)
