# Sistema de Logeo Canónico y Consola de Debugging (DHARMA)

> **AXIOMA:** "La observabilidad no es una característica añadida, es la consciencia del sistema sobre sí mismo."

Este documento define la arquitectura, flujos y estándares para el sistema de logging unificado de INDRA OS, abarcando desde el Backend (Apps Script) hasta el Frontend (React) y la Interfaz de Debugging (DevConsole).

---

## 1. Arquitectura de Capas de Logging

El sistema clasifica los eventos en 5 capas semánticas para facilitar la triaje y el análisis:

| Capa | Descripción | Origen Principal |
| :--- | :--- | :--- |
| **[SYSTEM]** | Eventos de ciclo de vida, ignición, ensamblaje y errores fatales de infraestructura. | `SystemAssembler`, `main.jsx` |
| **[BACKEND]** | Operaciones del lado del servidor, interacción con Drive, Sheets, LLM. | `FrontContextManager`, `DriveAdapter`, `MonitoringService` |
| **[NETWORK]** | Tráfico de datos entre cliente y servidor, latencia, payloads. | `Sovereign_Adapter`, `ContextClient` |
| **[FRONTEND]** | Lógica de estado, stores, persistencia local, orquestación de capas. | `AxiomaticStore`, `LevelLoader` |
| **[UI]** | Interacciones de usuario, renderizado de componentes, eventos de widgets. | `AccessPortal`, `CosmosSelector` |

---

## 2. Flujo de Datos de Logging

### 2.1. Backend (Apps Script) -> Frontend
El desafío principal en Apps Script es la falta de una consola en tiempo real. Solucionamos esto con un **Buffer de Logs**.

1.  **Captura:** `MonitoringService` actúa como el logger central.
    ```javascript
    monitoringService.logInfo('FrontContextManager', 'Mensaje');
    ```
2.  **Buffering:** Los logs se almacenan temporalmente en `frontendLogBuffer`.
    ```javascript
    // MonitoringService.gs
    let frontendLogBuffer = []; // Almacena últimos 50 logs
    ```
3.  **Transporte:** Al finalizar una ejecución (ej. `listAvailableCosmos`), se inyecta el buffer en la respuesta.
    ```javascript
    return {
        artifacts: [...],
        _logs: monitoringService.flushFrontendLogs() // Se vacía el buffer aquí
    };
    ```
4.  **Rehidratación:** En el Frontend, `BackendLogger` intercepta la respuesta, extrae `_logs` y los "reproduce" en la consola del navegador.
    ```javascript
    // BackendLogger.js
    response._logs.forEach(log => console.log(`[BACKEND] ${log.message}`));
    ```

### 2.2. Frontend & UI
El Frontend utiliza `console.log/warn/error` estandarizados, que son **interceptados** por la `DevConsole`.

---

## 3. DevConsole: La Interfaz de Debugging

La `DevConsole` es un componente React que vive en `main.jsx` y proporciona una ventana visual al estado del sistema.

### Características Clave:
*   **Interceptación Automática:** Captura todo `console.log` sin necesidad de cambiar el código existente.
*   **Filtrado Inteligente:** Por Capa, Nivel (DEBUG, INFO, ERROR), Componente o Búsqueda de texto.
*   **Focus Mode:** Permite aislar logs de una función específica para eliminar el ruido.
*   **Log Exporter:** Copia logs al portapapeles o descarga JSON para compartir reportes de errores.
*   **Timeline View:** Visualización alternativa para analizar la secuencia temporal y latencia entre eventos.

---

## 4. Estándares de Implementación

### 4.1. Uso en Backend
Utilizar siempre `monitoringService` inyectado, nunca `Logger.log` ni `console.log` nativo si se quiere visibilidad en el frontend.

```javascript
// ✅ CORRECTO
monitoringService.logInfo('MiComponente', 'Mensaje de depuración', { dato: 123 });

// ❌ INCORRECTO
console.log('Mensaje'); // Solo visible en consola de GCP
```

### 4.2. Uso en Frontend
Utilizar etiquetas de componente en los mensajes para facilitar el parseo automático.

```javascript
// ✅ CORRECTO
console.log('[CosmosSelector] Usuario seleccionó universo: "uno"');

// ❌ INCORRECTO
console.log('Click'); // Difícil de rastrear
```

---

## 5. Debug Adapter (Control Remoto)

El sistema incluye un `DebugAdapter` (System Utility) que expone capacidades para controlar el logging en tiempo real sin redeploy.

*   **toggleBackendLogs:** Activa/Desactiva el envío de logs del backend.
*   **setLogLevel:** Ajusta la verbosidad (DEBUG, INFO, WARN, ERROR).
*   **clearLogBuffer:** Limpia la memoria de logs acumulados.

Este adapter se renderiza automáticamente en el frontend como un panel de control gracias a su definición en `UI_LAYOUT`.





