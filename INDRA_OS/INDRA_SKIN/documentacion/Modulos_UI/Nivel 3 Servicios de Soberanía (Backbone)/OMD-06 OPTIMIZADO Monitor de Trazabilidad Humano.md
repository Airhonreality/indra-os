 Blueprint Maestro OMD-06: Monitor de Trazabilidad (The Trace)

1. Identificación y Alcance (ID & Context)
- **ID Técnico**: `view_execution_monitor`
- **Nombre Funcional**: Monitor de Trazabilidad Humano (The Trace).
- **Naturaleza**: Servicio de Soberanía de Nivel 3 (Backbone).
- **Primitiva Vinculada**: `EXECUTION_TRACE` + `MonitoringService.gs`.
- **Axioma de Diseño**: "El error no es un fallo, es un rastro; la visibilidad es el antídoto de la incertidumbre."

2. Anatomía y Distribución de la Interfaz (UI Shell)
El OMD-06 reside habitualmente en el **Bottom Bar** (Pie de Pantalla), actuando como una "Caja Negra" en tiempo real.
- **A. El Pulso de Ejecución (The Live Feed)**: Línea de tiempo horizontal o lista compacta que muestra los eventos de sistema a medida que ocurren (ej: "Nodo Notion Disparado", "LLM Generando respuesta").
- **B. Inspector de Tránsito (Payload Viewer)**: Al hacer clic en un evento, se expande un panel que muestra el JSON exacto de entrada y salida (Payload/Result) de ese paso específico.
- **C. Semáforo de Integridad (Status Pillar)**: Indicadores de color según la `Visual_Grammar`:
  - **Verde**: Flujo óptimo.
  - **Naranja**: Latencia alta o reintentos (Retry).
  - **Rojo**: Excepción técnica o violación de contrato (`SECURITY_BLOCK`).

3. Definición Funcional (El "Qué")
- **Trazabilidad Forense**: Permite al usuario reconstruir "qué pasó" en un flujo después de que terminó. Indispensable para depurar lógicas complejas de IA.
- **Detección de Cuellos de Botella**: Muestra el tiempo de ejecución de cada nodo. Si un adaptador tarda 5 segundos, el monitor lo resalta.
- **Re-play Estratégico**: Opción para re-disparar una ejecución fallida con el mismo payload directamente desde el monitor.

4. Comportamiento Camaleónico (Adaptatividad)
- **Regla de Mutación 01 (Modo Silente)**: Cuando no hay actividad, el monitor se colapsa a un solo hilo de luz (`breathing-subtle`) indicando que el sistema está en espera.
- **Regla de Mutación 02 (Modo Pánico)**: Ante un `ARCHITECTURAL_HALT`, el monitor se expande automáticamente y tiñe la interfaz de rojo, presentando el diagnóstico detallado del `ErrorHandler`.

5. Estrategia de Scaffolding (Andamiaje)
- **Event Streaming**: Los eventos aparecen con un efecto de "escritura" o "desplazamiento lateral" para dar sensación de flujo continuo.
- **Ghost Trace**: Mientras un nodo está en `PENDING`, el monitor muestra un espacio reservado con animación de carga.

6. JSON del Artefacto: view_execution_monitor
```json
{
  "omd_06": {
    "id": "view_execution_monitor",
    "clase_ui": "REAL_TIME_TERMINAL",
    "sync_protocol": "TRACE_STREAM",
    "visual_config": {
      "position": "BOTTOM_FIXED",
      "max_history": 100,
      "density": "compact"
    },
    "interaction_rules": {
      "onEventClick": "EXPAND_PAYLOAD",
      "onCriticalError": "FORCE_EXPAND",
      "onRetry": "INVOKE_PUBLIC_API_PROCESS_SPECIFIC"
    }
  }
}
```

7. Análisis de Ergonomía Cognitiva (Auditoría de Valor)
- **Reducción de la Ansiedad**: El usuario ve que e sistema "está haciendo cosas". No hay cajas negras.
- **Aprendizaje Acelerado**: Al ver los payloads reales circulando, el usuario entiende mejor cómo estructurar sus datos y sus contratos.
- **Cierre del Bucle de Poder**: El monitor no solo dice que algo falló, sino que da el botón para arreglarlo (Retry/Inspect).

9. Vínculo de Integridad Axiomática (The Core Contract)
--------------------------------------------------
El monitor es la ventana a la salud metabólica del sistema.

| Dimensión | Artefacto de Referencia |
| :--- | :--- |
| **Artefacto Lógico (Logic)** | [JobQueueService.gs](file:///c:/Users/javir/Documents/DEVs/INDRA_FRONT_END/OrbitalCore_Codex_v1/2_Services/JobQueueService.gs) |
| **Monitoreo** | [MonitoringService.gs](file:///c:/Users/javir/Documents/DEVs/INDRA_FRONT_END/OrbitalCore_Codex_v1/2_Services/MonitoringService.gs) |
| **Fuentes de Ley (Laws)** | [System_Constitution.gs](file:///c:/Users/javir/Documents/DEVs/INDRA_FRONT_END/OrbitalCore_Codex_v1/0_Laws/System_Constitution.gs) |

### Métodos Expuestos (Public API)
- `listJobs()`: Trazabilidad completa de ejecuciones en curso y pasadas.
- `getMetrics()`: Visualización de latencia, consumo de tokens y salud de nodos.
- `abortJob(jobId)`: Comando de interrupción de emergencia (Inhibición).

---
**Veredicto Final del Arquitecto**: Con esta versión, el Monitor deja de ser un log pasivo para convertirse en una **Consola de Comando Metabólica**, permitiendo al usuario humano intervenir en la realidad de la automatización con precisión quirúrgica.
