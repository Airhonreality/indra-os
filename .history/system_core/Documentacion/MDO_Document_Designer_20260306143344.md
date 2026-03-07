# MDO_Document_Designer — Plan Maestro de Operatividad y Refactorización

> **Estado:** Documento de Planificación y Diagnóstico (Paradigma Paramétrico AutoLayout)
> **Objetivo:** Construir el `DocumentDesigner` como un motor paramétrico estricto de UI/PDF, eliminando el caos de las coordenadas absolutas (Canvas 2D) y abrazando un modelo de diseño basado en Flexbox puro (Inspiración: Figma AutoLayout).

---

## 1. VISIÓN GENERAL Y ESTADO IDEAL DEL SISTEMA

El **Document Designer** rompe con el paradigma de los editores WYSIWYG clásicos o los lienzos 2D libres. En Indra, el diseño visual es **Matemática Paramétrica**. Se fundamenta en la previsibilidad de los componentes React y el ensamblaje tipo "Lego", asegurando que el diseño sea escalable, responsivo y agnóstico al dispositivo.

### El Dharma del Diseño Paramétrico (Adiós al Canvas Libre)
1. **Entradas Declarativas (Columna IN):** Exactamente igual que en el `BridgeDesigner`, el documento inicia declarando sus *Fuentes de Datos (Silos)* en un panel lateral. Un documento sin datos es solo un cascarón. Aquí se conectan las bases de Notion que alimentarán el contenido.
2. **Organización AutoLayout (Flexbox Puro):** No existen coordenadas `X` e `Y`. Todo es gestionado por contenedores estructurales (`FRAMES`). Un `FRAME` define su dirección (Vertical/Horizontal), espaciado (Gap), márgenes (Padding) y su comportamiento de tamaño:
    *   **Hug Content:** Se ajusta al tamaño de sus hijos.
    *   **Fill Container:** Toma el 100% del espacio disponible de su padre.
    *   **Fixed:** Tamaño rígido (usar con precaución).
3. **El Árbol de Renderización (The Node Tree):** En lugar de arrastrar elementos en un lienzo libre, el usuario ensambla un **Árbol Jerárquico** en un panel lateral o interactuando paramétricamente con las cajas. Mover un elemento significa cambiar su índice en el array de `children` de su padre.
4. **Proyección en Vivo:** El área central no es un "editor", es un *Monitor de Proyección*. Muestra en tiempo real cómo el AST se renderiza como UI React, intercalando los datos reales (del Sandbox/IN) dentro de la plantilla.

---

## 2. LISTADO DE MÓDULOS FUNCIONALES Y DIAGNÓSTICO ESTRUCTURAL

### 2.1 Módulo: Identificador de Datos (Columna A - IN)
*   **Rol:** Replicar el éxito del `PortManager` del BridgeDesigner. Permitir conectar bases de tabla para inocularle las variables dinámicas al documento.
*   **Carencia Operativa Principal:** Actualmente, los iteradores tienen que adivinar o buscar los datos en el momento. Si los datos no se pre-declaran, el documento carece de un "Esquema Local".
*   **Estado Ideal:** El panel izquierdo muestra los "SILOS" inyectados y sus "Alias". Proveen todos los `Slots` disponibles para que los componentes del documento los consuman.

### 2.2 Módulo: Árbol Jerárquico y Parámetros (El Inspector Vigorizado)
*   **Rol:** Panel de control de la métrica y anidamiento.
*   **Problema del Canvas:** Permitir que los usuarios manipulen *top/left/absolute* genera colapsos en la exportación a PDF y responsividad.
*   **Estado Ideal:** Un componente `LayoutInspector` universal. Cuando seleccionas un `FRAME`, no lo mueves con el mouse, le configuras: Direccionalidad (Fila/Columna), Alineación (Centro, Inicio, Espacio-Entre), Relleno (Padding), Separación (Gap) y Respaldo (Background/Border). 

### 2.3 Módulo: Motores Atómicos (Bloques)
*   **Tipos de Nodo Estrictos:**
    *   `FRAME`: El contenedor maestro (AutoLayout). Puede anidar iteradores, textos u otros frames.
    *   `TEXT`: Elemento terminal. Soporta inyección de `{{slots}}`. 
    *   `IMAGE`: Elemento terminal responsivo.
    *   `ITERATOR`: Es un `FRAME` especial que clona sus `children` por cada fila de datos de un origen (IN) conectado. 

### 2.4 Módulo: Conector de Variables (Interpolación vía SlotSelector)
*   **Problema:** Un campo de TEXTO en el Document Designer requiere que escribas a mano las variables o es mudo. 
*   **Estado Ideal:** El panel derecho, al seleccionar un bloque `TEXT`, muestra un botón "Inyectar Slot", el cual abre el `SlotSelector` (alimentado por la Columna IN). Al seleccionar, la variable entra al texto respetando el estilo definido.

---

## 3. MASTER PLAN DE ACCIÓN (Secuencia de Reparación)

Reconstruiremos el Document Designer basándonos en la arquitectura probada del `BridgeDesigner`, pero orientada a propiedades CSS Flexbox.

1.  **FASE ZERO: Abandono del Lienzo e Implementación del PortManager.**
    *   *Acción:* Desechar librerías o lógicas de Drag & Drop por coordenadas.
    *   *Acción:* Instalar `useBridgeHydration` y `PortManager` (reutilizados del Bridge) como la Columna A del Document Designer, para gestionar los orígenes de datos (Sensibilidad de Esquemas).

2.  **FASE UNO: El Motor AutoLayout (`FrameRenderer`).**
    *   *Acción:* Codificar el motor de renderizado recursivo puro usando propiedades Flex. Todo componente se envuelve en un contenedor Flex. 
    *   *Acción:* Establecer las propiedades universales base del AST: `layoutMode` (hug/fill/fixed), `direction` (row/column), `padding`, `gap`, `alignItems`, `justifyContent`.

3.  **FASE DOS: Panel Inspector Universal (Columna Derecha).**
    *   *Acción:* Crear la UI paramétrica inspirada en Figma. Dials, selects y text-inputs para controlar el AutoLayout del nodo seleccionado.
    *   *Acción:* Implementar el listado tipo árbol para reordenar bloques de forma deterministica (mover arriba/abajo en la lista de hermanos) en lugar del drag libre espacial.

4.  **FASE TRES: Enlace de Slots e Iteración.**
    *   *Acción:* Conectar el `SlotSelector` al motor de texto.
    *   *Acción:* Refinar la iteración real: Si conectas el Silo "Clientes" a un `ITERATOR_BLOCK`, el monitor proyecta N copias del layout basándose en los registros de prueba generados por el sandbox dinámico. 

---

*Diseño basado en el "Agnosticismo Paramétrico": Predecible, exportable de forma impecable y atado exclusivamente a la verdad de los datos dictados por el Core.*
