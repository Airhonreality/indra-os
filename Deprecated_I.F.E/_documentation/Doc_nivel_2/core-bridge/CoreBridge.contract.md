# CoreBridge.js - Atomic Contract (V3 - Pristine)

> **Ubicación:** `src/core/bridge/CoreBridge.js`
> **Axioma:** Bus Universal de Ejecución (UnEx). Transporta intenciones puras hacia el Core.

## 1. Axiomas (V3)

1.  **Canal Único**: Solo existe una vía de comunicación (`callCore`).
2.  **Payload Estructurado**: Siempre viaja `{ executor, method, payload }` o `{ action }`.
3.  **Agnosticismo de Transporte**: `CoreBridge` abstrae si se usa `fetch`, `google.script.run` o `WebSockets`.

## 2. Interfaz Pública

#### `callCore(executor, method, payload)`
Ejecuta un método específico en un adaptador o servicio del Core.

**Parámetros:**
- `executor` (string): Nombre del adaptador/servicio (ej: `NotionAdapter`, `JobQueueService`).
- `method` (string): Nombre del método (ej: `createPage`).
- `payload` (object): Objeto con los parámetros definidos en el esquema.

**Ejemplo:**
```javascript
const result = await CoreBridge.callCore('NotionAdapter', 'createPage', {
  databaseId: 'xyz',
  properties: { Title: 'Hello' }
});
```

#### `callSystem(action, payload)`
Ejecuta una acción sistémica (no vinculada a un adaptador específico).

**Parámetros:**
- `action` (string): Acción reservada (ej: `getSystemContracts`, `getSystemContext`).
- `payload` (object): Opcional.

**Ejemplo:**
```javascript
const contracts = await CoreBridge.callSystem('getSystemContracts');
```

## 3. Implementación de Transporte (Fetch Adapter)

`CoreBridge` debe detectar el entorno. Si es "Indra Console" (Web App externa):

```javascript
const ENDPOINT = "https://script.google.com/macros/s/.../exec"; // Configurado via ENV

async function transport(body) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  });
  return await response.json();
}
```

## 4. Manejo de Errores V3

El Core devuelve errores estandarizados (`{ success: false, error: { code, message } }`). `CoreBridge` debe interceptarlos y lanzar `CoreError` tipados para que la UI reaccione (ej: mostrar notificación visual).
