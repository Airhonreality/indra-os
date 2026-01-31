# 🏛️ INDRA OS: Systemic Logic (V3 - Semantic Handshake)

> **Axioma:** Semántica sobre Estructura.

## 1. El Protocolo de Contratos (The Handshake)

El sistema se basa en un intercambio constante de contratos de verdad dinámicos.

### 1.1 El Catálogo de Capacidades
El `Orbital Core` expone su topografía total vía `getSystemContracts`.

```json
{
  "NotionAdapter": {
    "createPage": {
      "intent": "WRITE",
      "io": {
        "inputs": {
           "accountId": { "role": "contact" }
        }
      }
    }
  }
}
```

### 1.2 Mapeo de Roles Semánticos
En lugar de tipos de datos estáticos, el sistema utiliza **Roles** para deducir el comportamiento visual:

| Rol (Semantic Role) | Interpretación UI | Ejemplo de Uso |
|:---|:---|:---|
| `key` / `id` | Mono Field / Icono Identidad | API Keys, UUIDs |
| `identity` | Selector de Identidad | accountId, userId |
| `data` | Schema Viewer / JSON Editor | Payloads complejos |
| `status` | Status Indicator / Badge | Estados de Job |
| `secret` | Sensitive Input | Passwords / Tokens |

## 2. Universal Connection (CoreBridge)
El frontend utiliza un único bus de comunicación agnóstico:

```javascript
// Única interfaz de comunicación
CoreBridge.call('Adapter.method', payload);
```

## 3. Capas de Persistencia

### 3.1 Proyección Espacial (`.project.json`)
Almacena la topología visual (posiciones de nodos, colores, cables).

### 3.2 Instrucción Lógica (`.flow.json`)
Almacena la cadena de ejecución pura procesable por el Core.

El `PersistenceManager` asegura la coherencia entre ambas capas durante el ciclo de vida del proyecto.
