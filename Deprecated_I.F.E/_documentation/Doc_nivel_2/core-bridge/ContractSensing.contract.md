# Discovery.js - Atomic Contract (V2 - Dynamic)

> **Ubicación:** `src/brain/bridge/Discovery.js` [Propuesta]
> **Dharma:** Cartógrafo del Core. Actualiza el mapa de capacidades en tiempo real.

## 1. Axiomas (V2)

1.  **Mapas Vivos**: No existe un mapa estático. El mapa se dibuja al iniciar.
2.  **Schema Hydration**: Convierte JSON Schema en objetos `Blueprint` utilizables por la UI.
3.  **Resiliencia**: Si el Core añade una capacidad, Discovery la registra sin romper la app.

## 2. Interfaz Pública

#### `hydrateSystem()`
Inicia la secuencia de descubrimiento completa.
1. Define token de sesión.
2. Llama a `Neutron.callSystem('getSystemContracts')`.
3. Llama a `Neutron.callSystem('getSystemContext')`.
4. Almacena resultados en `SchemaRegistry` (Store).

#### `getCapability(executorName)`
Retorna el contrato de un adaptador específico.

#### `validatePayload(executor, method, payload)`
(Futuro) Valida localmente un payload contra el esquema antes de enviarlo, ahorrando un round-trip.

## 3. Estructura de Datos (SchemaRegistry)

El Store debe guardar:

```typescript
interface SchemaRegistry {
  contracts: {
    [adapterName: string]: {
      methods: {
        [methodName: string]: {
          description: string;
          params: { [paramName: string]: ParamDefinition }
        }
      }
    }
  };
  context: {
    environment: string;
    version: string;
    configuration: Record<string, string>;
  };
  status: 'IDLE' | 'LOADING' | 'READY' | 'ERROR';
}
```
