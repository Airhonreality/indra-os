# 🧩 INDRA OS: Projection Logic (High-Performance Rendering)

> **Axioma:** La UI no es el sistema, es una proyección calculada de éste.

## 1. El Projection Kernel
El `Projection Kernel` es el motor encargado de transformar las entidades abstractas (nodos, conexiones) en representaciones visuales eficientes. Su responsabilidad es puramente geométrica y visual, desacoplada de la lógica de negocio.

### 🏛️ Arquitectura de 3 Capas
Para garantizar 60 FPS consistentes, el renderizado se divide en tres planos independientes:

1.  **Static Layer (Fondo):** Contiene la grilla, guías y elementos que rara vez cambian. Se renderiza en un canvas persistente.
2.  **Dynamic-Passive Layer (Nodos):** Contiene los nodos y elementos de la topología. Solo se redibuja ante cambios en el `TopologyStore`.
3.  **Active-Interaction Layer (Feedback):** Contiene elementos de alta frecuencia: cursores, cables en arrastre, selecciones y tooltips. Esta capa se redibuja en cada ciclo de `requestAnimationFrame` mientras haya actividad.

---

## 2. Optimizaciones Críticas

### Dirty Flag Management
Cada elemento visual posee un estado de "limpieza":
- **Clean:** El elemento coincide con su última representación.
- **Dirty:** Algún atributo visual ha cambiado.
- **Process:** El `ProjectionKernel` solo procesa elementos *Dirty*, ahorrando ciclos de CPU.

### Adaptive LOD (Level of Detail)
El renderizado se adapta dinámicamente al nivel de zoom:
- **LOD High (Zoom > 1x):** Texto completo, iconos detallados, sombras.
- **LOD Medium (0.5x < Zoom < 1x):** Texto resumido, iconos simplificados.
- **LOD Low (Zoom < 0.5x):** Rectángulos de color (Proxy visual), sin texto.

### Spatial Indexing (Hit-Testing)
Para interactuar con miles de nodos sin latencia:
- Se utiliza un **R-Tree** o **KD-Tree** para indexar las coordenadas de los nodos.
- El Hit-Testing pasa de `O(n)` a `O(log n)`.
- Esto permite detectar colisiones y "Snapping" magnético en menos de 1ms.

---

## 3. Temporización Psicofisiológica
La UI debe alinearse con el Modelo del Procesador Humano para sentirse natural:

| Interacción | Tiempo | Justificación |
| :--- | :--- | :--- |
| **Hover Feedback** | 150 ms | Percepción de instantaneidad. |
| **State Transition** | 300 ms | Tiempo de asimilación cognitiva. |
| **Execution Pulse** | 500-800 ms | Visibilidad de ciclos de sincronización. |

---

## 5. Infusión Axiomática y Ontología Dinámica
El frontend no posee una identidad visual propia; la adquiere del Core durante el Handshake. Esto elimina la necesidad de registros estáticos y reduce la fragilidad del sistema.

### El OntologyService
Ubicado en `src/core/integrity/OntologyService.js`, este servicio es el traductor entre la gramática del Core (`MasterLaw`) y la estética del Skin.

- **Mapeo Automático**: Relaciona roles semánticos (ej: `identity/url`) con iconos específicos (Lucide) y comportamientos de input.
- **Autodescubrimiento**: Si el Core introduce un nuevo Arquetipo o Intent en su `MasterLaw.gs`, el Satélite lo renderiza automáticamente usando una política de "Sovereign Default" sin necesidad de actualizar el código React.
- **Zero Mocks**: Al descargar la gramática en el handshake, se garantiza que el Skin es una proyección 100% fiel a la realidad del Core en ese instante.
