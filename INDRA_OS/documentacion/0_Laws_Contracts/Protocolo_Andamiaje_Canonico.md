# 📜 Protocolo de Andamiaje Canónico (Indra OS Stark)

> **Mantra:** "Un módulo no ocupa espacio, habita un estado de atención."

Este protocolo establece las reglas inmutables para la inyección de componentes React en el ecosistema **Indra OS**, garantizando que la jerarquía visual sea un reflejo exacto de la jerarquía ontológica del sistema.

---

## 🏗️ 1. La Matriz de Estratos (Z-Hierarchy)

Todo componente inyectado debe declararse en uno de los cuatro estratos de realidad definidos. Queda prohibido el uso de `z-index` arbitrarios fuera de estos rangos.

| Estrato | Nivel | Perfil de Atención | Propósitos Canónicos | Efecto en el Fondo |
| :--- | :--- | :--- | :--- | :--- |
| **E0: Sustrato** | `z-[0]` | `DEEP_FOCUS` | Canvas, Lab, Editores, Visualizadores de Datos. | Ninguno (Es la base). |
| **E1: Ambiente** | `z-[10]` | `AMBIENT` | Esfera de Indra, Widgets flotantes, Notificaciones, Status. | Transparencia total. |
| **E2: Navegación** | `z-[20]` | `NAVIGATIONAL` | Seletores de Cosmos, Portales de transición, Modales de búsqueda. | `Blur (15px)` + `Grayscale`. |
| **E3: Soberanía** | `z-[100]` | `OVERLAY` | Gatekeeper, Pantallas de bloqueo, Errores críticos. | `Blackout` (Opacidad 1). |

---

## 🧬 2. Reglas de Acoplamiento de Módulos

Para evitar conflictos de lógica y renderizado circular, el acoplamiento debe seguir estos axiomas:

### AXIOMA I: La Intención de Proyección
Antes de inyectar un módulo, se debe definir su **Perfil de Atención** en el `Indra_Canon_Registry.js`. 
*   **Error Común:** Un módulo de "Ambient" (como el Token Manager) bloqueando la pantalla con un modal.
*   **Protocolo:** Si el módulo no requiere "Pausa del Contexto", debe ser proyectado como un `FloatingWidget` en el estrato **E1**.

### AXIOMA II: El Dispatcher del Orchestrator
Ningún módulo debe intentar renderizarse a sí mismo directamente sobre el `body`. Todo debe pasar por el `LayerOrchestrator`.
1.  El módulo emite una acción al `AxiomaticStore`.
2.  El `LayerOrchestrator` detecta el cambio de estado.
3.  El `LayerOrchestrator` aplica el **Perfil de Atención** correspondiente al estrato.

### AXIOMA IV: Homeostasis de la Trinity (v9.6)
Ningún módulo debe intentar persistir datos volátiles ("Carne") dentro de la estructura ("Semilla") del Cosmos, ni forzar búsquedas de descubrimiento si el **Córtex** ya las inició.
*   **Regla:** El archivo `.cosmos.json` debe mantenerse $<100KB$. 
*   **Protocolo:** Los componentes deben usar el patrón **SWR** (Stale-While-Revalidate). Primero renderizan la memoria del Córtex y luego se actualizan silenciosamente.

### AXIOMA V: Ignición Autónoma
La hidratación crítica (descubrimiento de Cosmos, perfiles, etc.) no depende del renderizado de la UI. 
*   **Regla:** El `System_Assembler` dispara la ignición del `ContextClient` antes de que el primer píxel sea proyectado.
*   **Propósito:** Eliminar las pantallas de carga al abrir selectores y buscadores.

## 🛠️ 3. Pasos para la Integración de un Nuevo Módulo

1.  **Registro Ontológico:** Añadir la definición del módulo en `SYSTEM_MODULES` (`Indra_Canon_Registry.js`) asignándole un `ATTENTION_PROFILE`.
2.  **Definición de Slot:** Identificar en cuál de los slots canónicos (`TOP_BAR`, `SIDE_PRI`, `CANVAS`, `FOOTER`, `OVERLAY`) se manifestará.
3.  **Inyección en Orchestration:** Modificar la función `renderLayer()` del `LayerOrchestrator` para que respete la convivencia basada en el Z-Stacking del protocolo.

---

## 🚫 4. Prácticas Prohibidas (Heresía Técnica)

*   ❌ **Hardcoding de Colores:** Uso de colores fuera de las variables del `theme.css`.
*   ❌ **Overlay-Only Mentality:** Tratar cada herramienta nueva como una "pantalla completa".
*   ❌ **State-Pollution:** Actualizar el estado del Store directamente desde la fase de renderizado de un módulo (genera bucles infinitos con la `DevConsole`).
*   ❌ **Z-Clashing:** Forzar `z-index: 9999` para "ganar" visibilidad. Si un módulo necesita estar arriba, debe pertenecer al Estrato E3.

---

## 📐 5. Tabla de Referencia de Componentes Existentes

| Módulo | Estrato Canónico | Comportamiento Esperado |
| :--- | :--- | :--- |
| **The Vault** | E1 (Ambient) | Flota en la esquina, expande un Drawer. |
| **The Archivist** | E0 (Sustrato) | Habita el lateral, empuja el Canvas. |
| **Cosmos Selector** | E2 (Navigational) | Suspende la realidad con Blur. |
| **Gatekeeper** | E3 (Sovereignty) | Niega la realidad hasta que hay éxito. |

---
*Este protocolo es auditado periódicamente. Cualquier desviación se considera una ruptura de la Soberanía Cognitiva de Indra OS.*
