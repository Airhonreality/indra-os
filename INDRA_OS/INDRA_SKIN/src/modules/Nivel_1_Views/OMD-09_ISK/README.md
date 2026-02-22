# OMD-09: ISK DESIGNER (Escenario Espacial)

El **Axiom Spatial Kernel (ISK)** es el módulo de vista especializado en la manipulación de realidades gráficas y proyecciones.

## 📐 Filosofía del Escenario
Bajo la arquitectura **Axiom OS v6.0**, el ISK no es una aplicación monolítica, sino un **Consumidor de Servicios Globales**.

### 1. Componentes Internos (The Engine)
Viven en `src/modules/isk`:
*   **SpatialCanvas**: Motor de renderizado (DOM/WebGL). Gestiona la creación y selección de entidades.
*   **StateHUD**: Barra de herramientas de dibujo y vitals del sistema.
*   **LogicBridge**: Puente USSP para comunicación con el Core.

### 2. Servicios Inyectados (The Shared Tools)
Consumidos desde `src/modules/shared`:
*   **Context Explorer (OMD-10)**: Ocupa la Zona A para proveer variables.
*   **Context Inspector (OMD-05)**: Ocupa la Zona C para configurar entidades.
*   **Reactive Mapper (OMD-11)**: Integrado en el Inspector para mapeo de datos.

## 📡 Protocolo de Comunicación
El ISK se comunica con los servicios globales mediante un bus de eventos agnóstico:
*   `isk-spawn-entity`: Emitido por HUD, escuchado por Canvas.
*   `isk-entity-selected`: Emitido por Canvas, escuchado por el Context Inspector.
*   `axiom/variable`: Draggable desde el Context Explorer hacia cualquier slot del Inspector.




