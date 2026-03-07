# MDO_Document_Designer — Plan Maestro de Operatividad y Refactorización

> **Estado:** Documento de Planificación y Diagnóstico
> **Objetivo:** Elevar el `DocumentDesigner` (Motor de Renderizado Recursivo y Proyección PDF/UI) de un estado experimental a un nivel 100% operativo, estable y usable en producción (Alineado con ADR-007 v4.0).

---

## 1. VISIÓN GENERAL Y ESTADO IDEAL DEL SISTEMA

El **Document Designer** no es un simple editor de texto tipo "Word". En la arquitectura Indra, es un **Motor de Proyección AST (Abstract Syntax Tree)** diseñado para acoplar Layouts (Diseño Visual) con un Motor de Proyección de Datos Dinámicos. 

### El Flujo Ideal (The Dharma of Rendering)
1. **El Lienzo AST (Estructura de Bloques):** El documento es un árbol JSON donde cada "Block" tiene un propósito atómico: `TEXT`, `IMAGE`, `FRAME` (Contenedor anidado), `ITERATOR` (Proyección de datos tipo bucle), `PAGE_BREAK`.
2. **Navegación y Mutación Recursiva:** El usuario puede seleccionar cualquier bloque, sin importar qué tan profundo esté anidado dentro de un `FRAME` o un `ITERATOR`, y el sistema proporciona un rastro de migas de pan (Breadcrumbs) para navegar la jerarquía con exactitud.
3. **Inyección de Datos Dinámicos:** Los bloques tipo `TEXT` o `ITERATOR` permiten abrir un `SlotSelector` (o `ArtifactSelector`) para anclarse a variables externas o resultados de un `Bridge`. El contenido no está "hardcodeado", es una plantilla reactiva.
4. **Persistencia Bloqueante (Seguridad Estricta):** Al guardar los cambios (`ATOM_UPDATE`), el sistema bloquea interacciones para garantizar que el nuevo AST sea escrito íntegramente en el Gateway sin cortes, con estados visuales claros (SYNCING... -> SAVED).

---

## 2. LISTADO DE MÓDULOS FUNCIONALES Y DIAGNÓSTICO (Bugs & Carencias)

### 2.1 Módulo: El Motor de Renderizado Recursivo (`RecursiveRenderer`)
*   **Rol:** Parsear el AST almacenado en `atom.payload.blocks` y dibujarlo en el DOM respetando anidamientos (`children`).
*   **Problema/Carencia Operativa:** El renderizado a veces pierde el rastro de la profundidad. Los `FRAMES` (contenedores divisores de pantalla tipo Flexbox) no gestionan correctamente sus proporciones o márgenes cuando tienen varios hijos.
*   **Solución Requerida:** Establecer un motor de iteración puro. Cada bloque debe ser envuelto en un `BlockWrapper` que escuche eventos de OnClick para seleccionarse a sí mismo, independientemente de su nivel de anidamiento.

### 2.2 Módulo: Mutadores del AST (Gestión de Estado)
*   **Rol:** Funciones para Añadir, Eliminar, Mover y Actualizar propiedades de un bloque específico dentro del árbol de JSON.
*   **Carencias Operativas Graves:**
    *   **Punteros Perdidos:** Actualmente es difícil mover un bloque de raíz y meterlo *adentro* de un `FRAME`. Falta una mecánica de "Move To" o arrastrar/soltar (Drag & Drop) que respete la inmutabilidad del estado.
    *   **El Infierno del `ITERATOR`:** Un iterador espera recibir una directiva tipo "Repite este bloque por cada fila en esta base de datos". Actualmente la asignación de su "Fuente de Datos" (Source) está rota o no vinculada al `ArtifactSelector` que hicimos en el Bridge.

### 2.3 Módulo: Panel Inspector (`PropertyInspector` / Panel Lateral)
*   **Rol:** El menú lateral derecho que aparece al darle click a un bloque para alterar su fuente, color, márgenes o contenido dinámico.
*   **Carencia Operativa Fundamental:**
    *   **Interpolación Muda:** Si un usuario escribe una fórmula o un `{{variable_name}}` en un TextBox, el inspector no brinda una herramienta clara para inyectar dichas variables. Falta conectar el `SlotSelector` al Inspector de Texto.
    *   **Estilos no normalizados:** El inspector utiliza inputs genéricos en vez de depender de los "Design Tokens" de Indra. Debería obligar a usar las variables CSS normativas (`--color-accent`, `--space-4`) para mantener el "Agnosticismo del Motor".

### 2.4 Módulo: Persistencia y Core Sync (`ATOM_UPDATE`)
*   **Rol:** Enviar el AST final de vuelta al servidor (Core GAS).
*   **Problema Real (Histórico):** La UI a veces asume que guardó (Optimistic Update) pero en realidad tronó, causando "Fallo al guardar: undefined".
*   **La Solución:** El protocolo de guardado del Document Designer DEBE ser una **Operación Bloqueante**. No debe haber optimismo cuando se trata de la estructura de un compilador de documentos. El botón debe decir explícitamente "SYNCING" e inhabilitar cambios temporales hasta recibir un acuse de `status: 'OK'` del backend.

---

## 3. MASTER PLAN DE ACCIÓN (Secuencia de Reparación)

Reconstruiremos el Document Designer priorizando la estabilidad del Árbol de Sintaxis Abstracta (AST) primero.

1.  **FASE ZERO: Estabilización Estructural (AST Mutators).**
    *   *Acción:* Consolidar funciones puras para buscar, actualizar y eliminar nodos dentro del árbol recursivo mediante su `block_id`. 
    *   *Acción:* Asegurar que la función de Guardar (`ATOM_UPDATE`) sea síncrona, robusta y muestre alertas de "Error-as-Data" si la red falla.

2.  **FASE UNO: Renderizado y Selección de Punteros.**
    *   *Acción:* Fabricar un componente `RecursiveBlockContainer` que sepa iterar sobre sus `children`.
    *   *Acción:* Implementar el sistema de selección activa (Border Glowing / Hover) que resalte con color de acento el bloque exacto que tiene el foco, indicando si es un `FRAME`, `TEXT` o `ITERATOR`.

3.  **FASE DOS: El Inspector y Vínculos de Datos.**
    *   *Acción:* Enriquecer el Panel Lateral. Si el bloque seleccionado es `TEXT`, ofrecer un botón para invocar el `SlotSelector` e incrustar variables.
    *   *Acción:* Si el bloque es `ITERATOR`, obligar al usuario a abrir el `ArtifactSelector` para escoger qué Silo / Base tabular va a iterar.

4.  **FASE TRES: Maquetación Avanzada (Layouting).**
    *   *Acción:* Darle dignidad a los bloques `FRAME` para que soporten direcciones Flex (Row/Column), alineamientos y espacios usando puramente los *Tokens* del Design System Stark/Solar Punk.

---

*Diseño alienado con los principios M.C.A (Micro-Container Architecture) estipulados en los ADR fundacionales.*
