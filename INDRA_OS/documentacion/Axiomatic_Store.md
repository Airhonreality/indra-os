# Axiomatic Store: El Templo de la Consciencia Distribuida

El **AxiomaticStore** es el orquestador del Fenotipo. Su Dharma es la gestión de la existencia sistémica y la resonancia con el entorno del usuario.

## Aspectos Axiomáticos de la Memoria de Hierro

### 1. Persistencia L2 (AxiomaticDB / IndexedDB)
*   **Axioma:** La realidad no debe evaporarse al cerrar el observador.
*   **Implementación:** El Store captura "Snapshots" del fenotipo completo y los ancla en **Iron Memory** (IndexedDB). Esto permite una hidratación inmediata en el siguiente arranque sin depender de la latencia del Core.

### 2. Auto-Montaje de Sesión
*   **Axioma:** El sistema recuerda la última realidad habitada.
*   **Implementación:** Al iniciar, el Store busca el `LAST_ACTIVE_COSMOS_ID` y dispara el `RealityManager` automáticamente para re-construir el puente cuántico con el servidor.

### 3. Trama Visual (Sovereign Themes)
*   **Axioma:** La estética es una capa de soberanía.
*   **Implementación:** El Store inyecta el tema (`Dark/Light`) directamente en el DOM (`data-theme`), asegurando que la visualidad sea consistente antes del primer frame de render de los componentes.

### 4. Logs de Auditoría Forense
*   **Axioma:** Toda acción deja una huella en el Dharma.
*   **Implementación:** El reductor maestro audita cada despacho, vigilando colisiones de identidad y fugas de datos antes de comprometer el estado.

### 5. Bloqueo de Navegación (Guardia Pre-Vuelo)
*   **Axioma:** El sistema protege la integridad de los datos en tránsito.
*   **Implementación:** El Store gestiona el evento `beforeUnload` para evitar que el usuario cierre el portal mientras hay una secuencia de sincronización crítica en curso.
