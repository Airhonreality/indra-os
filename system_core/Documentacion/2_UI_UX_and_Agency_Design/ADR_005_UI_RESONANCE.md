# ADR-005: Sistema de Resonancia de UI e Inteligencia de Persistencia

> **Versión:** 1.0
> **Estado:** VIGENTE
> **Relación:** Extensión de [ADR_003 — APP STATE](file:///c:/Users/javir/Documents/DEVs/INDRA%20FRONT%20END/system_core/Documentacion/ADRs/ADR_003_APP_STATE.md)

---

## 1. CONTEXTO
En sistemas complejos como INDRA, la persistencia de datos en el Core (Google Drive) puede tener latencias variables. Anteriormente, el usuario no recibía feedback visual claro sobre si un cambio (como el nombre de un bridge o un nuevo operador) se había confirmado en el "tejido" del sistema. Cerrar un motor prematuramente o editar campos mientras el Core procesaba una escritura previa generaba "Entropía Identitaria" e IDs corruptos.

Se requería una solución industrializada que:
1. Proporcionara feedback de carga sin hardcodear spinners en cada componente.
2. Bloqueara la interacción de forma reactiva para prevenir condiciones de carrera.
3. Respetara el **Axioma de la Intención** (no autoguardado agresivo).

## 2. DECISIÓN
Implementar un **Sistema de Resonancia Sistémica** basado en "Herencia de Gravedad" y "Propagación de Atributos".

### 2.1 Nivel de Estado (Capa de Conciencia)
Se introduce el mapa `pendingSyncs` en el `app_state.js`. Este registro centralizado rastrea qué átomos están en proceso de sincronización con el Core, independientemente de si el motor visual está abierto o cerrado.

### 2.2 Nivel de Protocolo (Capa de Comunicación)
El `CapabilityBridge.js` actúa como el emisor del pulso. Cualquier llamada al método `save()` dispara automáticamente un evento de resonancia que se registra en la Shell Global a través de los callbacks `onSyncStart` y `onSyncEnd`.

### 2.3 Nivel de Orquestación (Capa de Inyección)
En `App.jsx`, el contenedor raíz de cada Macro-Engine se envuelve en un componente consciente del pulso. Si el átomo está en resonancia, se inyecta el atributo `data-resonance="active"` en el DOM.

### 2.4 Nivel de Estética Axiomática (Capa de Reacción)
Se eliminan los estados de carga por componente. La UI reacciona mediante selectores CSS globales:
- **Respiración**: Elementos como la cabecera pasan de `stable` a `syncing` visualmente mediante animaciones de pulso.
- **Bloqueo Físico**: Los inputs y botones dentro de un contenedor en resonancia desactivan sus `pointer-events` automáticamente.
- **Transparencia**: El "ruido visual" se reduce bajando la opacidad de los elementos cuya realidad está en proceso de escritura.

## 3. CONSECUENCIAS

### 🟢 Positivas
- **Cero Código en Motores**: Un desarrollador puede crear un nuevo motor y obtendrá feedback de carga y bloqueo de seguridad sin escribir una sola línea de lógica de carga.
- **Integridad Total**: Se elimina la posibilidad de que el usuario "rompa" un átomo editándolo mientras se está guardando.
- **Sinceridad UI**: La interfaz refleja fielmente el estado de la materia en el Core.

### 🔴 Riesgos y Mitigaciones
- **Latencia de Bloqueo**: En conexiones lentas, la UI puede sentirse "congelada". Se mitiga mediante un **Watchdog de Red** (Auto-purgado tras 30s) en el `app_state.js`.
- **Feedback de Fallo**: Si la sincronización falla, el sistema debe revertir el estado visual para evitar la "Caja Fantasma".

## 4. AXIOMAS DE RESONANCIA Y LEYES INDUSTRIALES

### 4.1 Leyes de Exclusión (Cumplimiento Obligatorio)
Para evitar la degradación del sistema por "artesanía de UI", se establecen las siguientes prohibiciones:
1.  **PROHIBIDO: Gestión de Carga en Componente.** Ningún componente debe definir un estado interno de `loading` para sincronización. La carga es una propiedad del **Campo de Resonancia** inyectado externamente.
2.  **PROHIBIDO: Estilos Inline para Estados.** No se permite usar `style={{ opacity: 0.5 }}` para indicar bloqueo o relaciones. Se DEBE delegar al motor de CSS mediante `data-attributes`.
3.  **PROHIBIDO: Interferencia de Highlight.** El sistema de navegación (highlights por hover) nunca debe sobreescribir la opacidad de la resonancia.

### 4.2 Jerarquía de Realidades (Sinceridad de Interfaz)
La UI debe comunicar prioritariamente la "Verdad de la Materia". Se establecen los siguientes niveles de visibilidad:
*   **Nivel 1: Resonancia (Materia en Escritura)**: Atributo `data-resonance="active"`. Opacidad: **0.5**. Bloqueo total de interacción.
*   **Nivel 2: Highlight (Navegación/Relación)**: Atributo `data-highlighted="false"`. Opacidad: **0.7**. Indica que el elemento no es el foco actual.

**Regla de Oro**: La opacidad de Resonancia (`0.5`) tiene prioridad absoluta. Si un elemento está en resonancia, no importa su estado de highlight; debe mostrar el bloqueo de materia.

### 4.3 Axiomas Fundamentales
- **A1**: "Si la materia no es ley en el Core, no es editable en el Cliente".
- **A2**: "Ningún componente de UI debe saber *cómo* cargar; solo debe saber *sentir* cuando el sistema está cargando" (Patrón Hollow Component).
- **A3**: "La redundancia visual es mejor que el silencio de red".
