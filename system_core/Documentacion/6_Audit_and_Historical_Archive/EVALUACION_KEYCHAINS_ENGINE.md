# Evaluación Arquitectónica: Indra Keychains Engine (Fase II)

Basado en el estado actual del código, el sistema de Tokens (Llaves de Satélite) funciona, pero opera bajo el paradigma de "Confianza Monolítica" (un solo token almacenado en `PropertiesService`). Para escalar Indra como un "Sistema Operativo", la capa de identidad de máquina debe evolucionar hacia un sistema polimórfico y auditable.

A continuación, presento el análisis sistémico y la propuesta de mejora continua para el Motor de Keychains.

---

## 1. Persistencia y Base de Datos (Ledger Evolution)

**Estado Actual:**
El token se almacena en `PropertiesService.getScriptProperties().getProperty('SATELLITE_TOKEN')`. Es frágil, invisible al usuario y no permite multiplicidad.

**Mejora Propuesta (The Keychain Ledger):**
Migrar la gobernanza de llaves a la **Hoja de Configuración del Core** (o un archivo dedicado en el Drive llamado `INDRA_KEYCHAIN_LEDGER.json`).

*   **Modelo de Datos (Schema):**
    ```json
    {
      "key_montechico_9A2b": {
        "name": "Frontend Montechico - Ingesta Pública",
        "status": "ACTIVE",
        "rate_limit_mb": 5000, 
        "scopes": ["ATOM_CREATE:FOLDER", "TRANSFER_HANDSHAKE"],
        "target_locks": ["1A3kVrjzYFI5r0LbeJM4PoswTvLzLQRq1"], 
        "created_at": "2026-04-10T12:00:00Z",
        "last_used_at": "2026-04-10T12:05:00Z"
      }
    }
    ```
*   **Beneficio Biológico:** Si un satélite se vuelve "infeccioso" (comprometido o spam), el Core puede seccionar el tejido (revocar la llave) sin paralizar el sistema entero. El `target_locks` asegura que, aunque tengan la llave, solo puedan escribir en la carpeta asignada y no borrar el Core entero.

---

## 2. Contratos de Datos (Data Contracts)

**Estado Actual:**
El Gateway simplemente valida un condicional estático en línea 45 de `api_gateway.js`.

**Mejora Propuesta:**
El sistema debe formalizar nuevos UQOs (Universal Query Objects) en sus protocolos internos para la gestión de las llaves, gestionados por `provider_system_infrastructure.js`:

1.  `SYSTEM_KEYCHAIN_GENERATE`: Solicita una nueva llave.
2.  `SYSTEM_KEYCHAIN_REVOKE`: Mata una llave.
3.  `SYSTEM_KEYCHAIN_AUDIT`: Extrae los logs de uso de todos los satélites.

*Integración con el UI Manifest:* Estas acciones se mapearán directamente al Dashboard de Indra en una pestaña de "Configuración de Sistema > Satélites".

---

## 3. Flujo Sistémico (Aduana de Alta Seguridad)

**Estado Actual:**
Una llave maestra confiere poderes absolutos sobre cualquier proveedor y cualquier protocolo.

**Mejora Propuesta (Validación de Scope):**
El Gateway no solo validará si el Token existe, sino que validará *lo que el Token intenta hacer*.

```javascript
// Propuesta de Flujo en el Gateway (api_gateway.js)
const keychain = _system_getKeychainLedger();
const satelliteContext = keychain[payload.satellite_token];

if (satelliteContext && satelliteContext.status === 'ACTIVE') {
   // 1. Validar Scope
   if (!satelliteContext.scopes.includes(payload.protocol)) {
       throw new Error("Sovereignty Violation: El satélite no tiene permiso para este protocolo.");
   }
   
   // 2. Validar Frontera (Target Lock)
   if (payload.protocol === 'ATOM_CREATE' && !satelliteContext.target_locks.includes(payload.context_id)) {
       throw new Error("Sovereignty Violation: Intento de escritura en un territorio no autorizado.");
   }

   // 3. Dejar Pasar y Loguear Entrada
   _system_logSatelliteEntry(payload.satellite_token, payload.protocol);
   isAuthenticated = true;
}
```

---

## 4. Orquestación Frontend (Dashboard y Setup UI)

Para que el modelo "Keychains" sea real, el usuario humano necesita una interfaz.
1.  **En Indra UI (Forge/Admin):** Una tabla que liste todos los tokens emitidos. 
2.  Un botón de "Crear Satélite" que pida: Nombre del Proyecto, Carpeta donde puede escribir (Lock), y Límites. Emitiendo finalmente la Llave Maestra para copiar y pegar.
3.  **En el Satélite Público (Montechico):** El `useIngestBridge` ya está listo. Solo lee la llave y la adjunta. La carga técnica pesada estará en el backend.

---

## Conclusión y Evaluación General

La arquitectura desplegada hoy (v4.0) es **funcionalmente pura y agnóstica**, pero es el "Modelo T". La propuesta de *Keychains con LEDGER y Scopes* (v4.1) será el "Tesla". 

Al transformar el token de una Variable de Entorno global a un **Objeto Criptográfico de Base de Datos**, Indra pasará de ser una herramienta de un solo instalador a un **Backend Multitenant Genuino**. Todo esto manteniendo el Zero-Hardcoding, ya que los `target_locks` serán UUIDs puros configurables.
