# 🌌 INDRA SPATIAL KERNEL (ISK) - INFRAESTRUCTURA DE SINCRONIZACIÓN

Para que el **ISK-USSP (Unified State Synchronization Protocol)** sea operativo y auditable, el `SpatialBridge.js` no puede actuar solo. Necesita una infraestructura de soporte que gestione el ciclo de vida del dato desde la intención del usuario hasta el almacenamiento físico.

---

## 1. Artefactos de Lógica y Control (Front-End)

### A. USSP_Dispatcher.js (El Emisor de UI)
*   **Función**: Es un Wrapper o Hook que utilizan los componentes de React (el Inspector de Lógica).
*   **Responsabilidad**: Captura los eventos de la UI, les asigna un `msg_id` y un `timestamp`, y los envía al `SpatialBridge`. Realiza el Throttling inicial para evitar saturar el puente con eventos de ratón innecesarios.

### B. USSP_StateStore.js (La Verdad Local)
*   **Función**: Un almacén de estado en memoria (tipo Redux o Zustand, pero optimizado para alto rendimiento).
*   **Responsabilidad**: Mantiene un Snapshot del `.layout.json` actual en el cliente. Permite que el sistema realice comparaciones (Diffing) para enviar solo cambios mínimos y gestiona el historial de Undo/Redo a nivel de protocolo.

### C. USSP_PersistenceBuffer.js (El Gestor de Tráfico al Core)
*   **Función**: Un buffer de salida asíncrono.
*   **Responsabilidad**: Implementa la lógica de `persistence: DEFERRED`. Acumula cambios volátiles y, tras un periodo de inactividad (Debounce), emite un único paquete de persistencia hacia el `VectorAdapter` en el Core. Evita que el sistema colapse por exceso de peticiones HTTP/GAS.

---

## 2. Artefactos de Ejecución (Spatial Worker)

### D. USSP_WorkerHandler.js (El Receptor de GPU)
*   **Función**: Un módulo que vive dentro del `SpatialWorker.js`.
*   **Responsabilidad**: Escucha los mensajes del canal HFS (High-Frequency Sync). Su tarea es mapear el `target_id` y la `property` directamente a los índices de la Data Texture o los Uniform Buffers de WebGL. Es el encargado de que el cambio se vea en pantalla en < 16ms.

---

## 3. Artefactos de Definición y Validación (Esquemas)

### E. USSP_ContractRegistry.json (El Diccionario de Tipos)
*   **Función**: Un archivo de configuración estático.
*   **Responsabilidad**: Define qué propiedades son válidas para cada tipo de objeto. 
*   *Ejemplo*: Si el objeto es un `CIRCLE`, el registro dice que `u_radius` es un `f32`. El `SpatialBridge` consulta este archivo para validar cada mensaje antes de procesarlo.

---

## 4. Artefactos de Persistencia (Back-End / Core)

### F. VectorAdapter.gs (El Receptor de Persistencia)
*   **Función**: Script en Google Apps Script.
*   **Responsabilidad**: Expone el endpoint que recibe los paquetes del `PersistenceBuffer`. Su única tarea es realizar el Merge de los cambios recibidos en el archivo `.layout.json` físico almacenado en Drive.

---

## 🔄 Resumen de la Cadena de Suministro del Mensaje

| Paso | Artefacto | Acción |
| :--- | :--- | :--- |
| 1 | **USSP_Dispatcher** | Captura intención -> Crea Paquete USSP. |
| 2 | **SpatialBridge** | Valida contra ContractRegistry -> Enruta. |
| 3 | **USSP_WorkerHandler** | Actualiza Píxel (GPU) -> Feedback Inmediato. |
| 4 | **USSP_StateStore** | Actualiza Snapshot Local -> Preparar Persistencia. |
| 5 | **USSP_PersistenceBuffer** | Agrupa cambios -> Envía al Core tras pausa. |
| 6 | **VectorAdapter** | Escribe en Disco (Drive) -> Persistencia Final. |

---

## 🔍 ¿Qué falta por definir? (Puntos de Auditoría)

Para que un desarrollador pueda ensamblar esto, necesitamos el **"Esquema de Validación de Contratos" (USSP_ContractRegistry.json)**. Este archivo es el que evita que el sistema intente enviar un color a una propiedad que solo acepta números, rompiendo el motor de renderizado.

> **ESTADO**: Pendiente de generación del `USSP_ContractRegistry.json` inicial con los 10 Roles Canónicos.
