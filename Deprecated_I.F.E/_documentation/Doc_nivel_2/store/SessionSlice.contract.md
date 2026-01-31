# SessionSlice.js - Atomic Contract (V3 - Pristine)

> **Ubicación:** `src/core/state/slices/SessionSlice.js`
> **Axioma:** Gestionar el estado de la sesión UI: zoom, pan, selección, flags de estado.

---

## 1. Axiomas (Invariantes)

1. **Efímero**: Estado no persiste entre sesiones (excepto configuraciones de UX en LocalStorage).
2. **UI Puro**: Solo gestiona estado visual, no lógica de negocio.
3. **Normalización de Pan**: Pan se guarda como valores normalizados (0-1).
4. **Zoom Acotado**: Zoom entre 0.1x y 3.0x.

---

## 2. Interfaz Pública

### Estado
```typescript
{
  zoom: number;              // 0.1 - 3.0
  panNormalized: { x: number, y: number };  // 0-1
  selectedId: string | null;
  isWiping: boolean;
  lastActionId: string | null;
  lastUpdateTimestamp: number | null;
}
```

### Acciones

#### `setSession(updates)`
Actualiza múltiples campos de sesión.

---

## 3. Protocolo de Uso

```javascript
const { zoom, panNormalized, setSession } = useCoreStore();

// Actualizar zoom
setSession({ zoom: 1.2 });

// Seleccionar nodo
setSession({ selectedId: 'node_abc' });
```

---

## 4. Relacionado
- [CoreStore.js](../CoreStore.js)
- [ProjectionKernel.md](../../Doc_nivel_1/05_projection_logic.md)
