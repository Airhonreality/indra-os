# 🏛️ INDRA OS: UX Logic (V6 - Sovereign Aesthetics & Atomic Rendering)

> **Axioma de Abstracción Visual:** Ningún píxel de INDRA OS tiene "estilo propio". Cada propiedad visual es un **Token** derivado de un contrato central. La UI es agnóstica a la estética; solo obedece a la semántica.

---

## 1. El Sistema de Tokens (Zero Hard-Coding)

Se prohíbe terminantemente el uso de valores CSS literales (hexadecimales, pixeles, espaciados) dentro de los componentes. La UI debe ser una cáscara vacía que se "llena" de significado mediante un **Motor de Temas**.

### 1.1 Arquitectura de Tokens
Todos los componentes deben consumir variables CSS (`--indra-variable`) definidas en el artefacto central `SovereignTheme.css`. 
*   **Neutralidad**: Los componentes no conocen el color "rojo"; conocen la variable `--color-status-error`.
*   **Geometría**: Los componentes no tienen un `margin: 10px`; tienen un `--spacing-standard`.

---

## 2. Tema Canon: "Schematic White" (Newspaper Dev Mode)

El tema por defecto para el desarrollo y auditoría de INDRA es el **"Schematic White"**. Su propósito es eliminar distracciones estéticas para enfocar al operador en la pureza de los datos.

### 2.1 Especificación Visual
*   **Base Escalar**: Estrictamente monocromático (Blanco puro `#FFFFFF`, Negro absoluto `#000000` y escala de grises sistemática).
*   **Estética**: Estilo de periódico clásico o plano técnico de ingeniería. Tipografía mono-espaciada para datos y Serif para etiquetas descriptivas.
*   **Uso del Color (Uso Restrictivo)**: El color solo está permitido cuando es **Determinante para la Comunicación de Estado**:
    1.  **Rojo Eléctrico**: Violación de Contrato / `ARCHITECTURAL_HALT`.
    2.  **Verde Neón (Glow)**: Match perfecto del `SemanticBridge`.
    3.  **Ámbar**: Advertencia de integridad o riesgo de latencia.
    4.  **Azul Tinta**: Referencias a hipervínculos o documentos externos.

---

## 3. Axioma de Auto-Renderizado Atómico

Ningún elemento interactivo (Botones, Inputs, Toggles) puede ser "hardcodeado" en el JSX/HTML de la UI.

### 3.1 El Nodo como Fábrica de Interacción
*   **Invocación**: Un botón de "Ejecutar" no existe por diseño; existe porque el esquema del Core define un `intent: "EXECUTE"`.
*   **Inputs**: Un campo de texto no existe por diseño; existe porque el `io.inputs` define un tipo `string` con un rol semántico.
*   **Renderizado Recursivo**: Si el Core añade un nuevo campo a un contrato, la UI debe generarlo instantáneamente. Si no hay contrato, no hay elemento visual.

---

## 4. El "Veto Visual" y la Conexión Semántica

### 4.1 La Física del Imán (Tokens de Movimiento)
La conexión de nodos consume tokens de `MasterLaw.gs` (`MOTION_TOKENS`):
*   **`glitch`**: Se activa visualmente cuando un cable está cerca de un puerto incompatible.
*   **`pulse`**: Se activa en el puerto receptor cuando la afinidad es > 0.8.
*   **`orbit`**: Animación de carga circular mientras se espera el `AsyncHandler`.

---

## 5. Tabla de Auditoría Visual (Zero Coding)

| Elemento | Origen del Diseño | Restricción CSS |
| :--- | :--- | :--- |
| **Botón de Acción** | `contract.intent` | Solo `--btn-base-tokens` |
| **Color de Cable** | `bridge.affinityScore` | Solo `--affinity-color-scale` |
| **Layout de Nodo** | `contract.visual_modeling` | Solo `--node-geometry-tokens` |
| **Iconografía** | `contract.visual_intent` | Solo `--icon-mapping` |

---

## 6. Requisitos de Humanización (Axioma M - Human Interface) 🚧

> **Objetivo:** Democratizción del modelo mental sin sacrificar la verdad técnica (Sin "Black Boxes").

### 6.1 Capa Narrativa (Metadata Injection)
El sistema debe soportar un "Modo de Lectura Humana" donde los tokens técnicos son traducidos a intención de negocio.
*   **Requisito UI-01:** Tooltips y etiquetas deben consumir `contract.human_label` si existe.
*   **Requisito UI-02:** Los métodos RPC (`store`, `retrieve`) deben mostrarse como verbos de acción (`Guardar`, `Obtener`) en el contexto del usuario.

### 6.2 El Canvas Semántico (Visual Frames)
*   **Requisito UI-03:** El `TopologyStage` debe renderizar una capa de "Anotaciones" desacoplada de la lógica de flujo.
*   **Requisito UI-04:** Soportar "Frames" (contenedores visuales) que agrupen nudos lógicamente (ej. "Módulo de Facturación").
*   **Requisito UI-05:** Los Frames deben poseer propiedades de arrastre magnético (mover Frame mueve sus nodos hijos).

### 6.3 Asistencia Cognitiva (Blueprint & AI)
*   **Requisito UI-06:** Sidebar dedicada para `Blueprints` (Plantillas JSON).
*   **Requisito UI-07:** Panel de Chat Contextual para el "Asistente AI" que sugiera flujos.

---

**Soberanía Estética:** El "Schematic White" es la representación visual de la verdad técnica. Si algo se ve "bonito" pero no está anclado a un token o a un contrato del Core, es una fisura en la integridad y debe ser destruida.
