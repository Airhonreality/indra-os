# MDO_Bridge_Designer — Plan Maestro de Operatividad y Refactorización

> **Estado:** Documento de Planificación y Diagnóstico
> **Objetivo:** Elevar el `BridgeDesigner` de un estado de "boceto estructural" a un nivel 100% operativo y usable en la vida real.

---

## 1. VISIÓN GENERAL Y ESTADO IDEAL DEL SISTEMA

El **Logic Bridge** es el cerebro de Indra. Su función no es solo "dibujar cajas", sino establecer un flujo estricto y seguro de datos: **Traer datos (IN) → Transformar (PIPELINE) → Enviar datos (OUT)**.

### El Flujo Ideal (The Dharma of Flow)
1. **INPUT_SOURCES:** El usuario conecta una base de datos externa (ej. Notion). La UI le permite seleccionar *exactamente* qué columnas quiere introducir al motor, evitando ahogar la memoria. Además, le permite asignar un ALIAS contextual a esta fuente ("Contactos_CRM") y definir un ID de prueba para testear.
2. **PIPELINE (Operadores):** El usuario engrana operadores (`MATH`, `TEXT`, `RESOLVER`, `EXPRESSION`). Cada operador tiene acceso a un `SlotSelector` *jerárquico* que le permite bucear en objetos JSON anidados devueltos por los pasos anteriores.
3. **OUTPUT_TARGETS:** El usuario conecta una base de datos destino. El sistema le exige declarar si la acción es un `APPEND` (crear) o un `UPDATE` (mutar). A continuación, mediante el `FieldMapper`, el usuario "conecta los cables" de las variables del pipeline hacia los campos obligatorios del esquema destino, con validaciones visuales de tipos de datos para prevenir errores en tiempo de ejecución.
4. **SANDBOX:** Un entorno de pruebas vivo que no requiere escribir JSON a mano. Se nutre automáticamente de los esquemas de las fuentes y permite ejecutar simulaciones precisas.

---

## 2. LISTADO DE MÓDULOS FUNCIONALES Y DIAGNÓSTICO (Bugs & Carencias)

### 2.1 Módulo: Hidratación de Esquemas (`useBridgeHydration.js`)
*   **Rol:** El encargado de solicitar a los proveedores (Drive, Notion, System) los esquemas o columnas de las bases conectadas.
*   **Problema/Bug Crítico:** Actualmente el código "quema" el `provider: 'system'` en sus llamadas de `TABULAR_STREAM`. No puede inferir el origen real, por lo que colapsa al intentar leer datos externos. Además, asume que los campos vienen en `result.fields`, violando el ADR_001 que estipula que vienen en `metadata.schema.columns`.
*   **Consecuencia:** Mostrar IDs crudos inútiles en pantalla y bloquear por completo la herramienta de mapeo (`FieldMapper`).

### 2.2 Módulo: Gestión de Puertos IN/OUT (`PortManager.jsx`)
*   **Rol:** El panel lateral para añadir y gestionar paneles de fuentes y destinos.
*   **Carencias Operativas Graves:**
    *   **Falta Selectividad (IN):** Descarga obligatoriamente todo el esquema. Debe poseer un sistema de checkboxes para que el usuario elija "Activar/Desactivar" campos y así no ensuciar el contexto.
    *   **Falta Declaración de Alias (IN):** Sin `EditableLabel` para renombramientos ("Contactos_A" vs "Contactos_B").
    *   **Falta Intención de Operación (OUT):** Para un destino, ¿vas a Crear fila nueva o Actualizarla? Falta este dropdown y, en caso de Update, el requerimiento ineludible de la llave de anclaje matemática.
    *   **Manejo de Errores Roto (IN/OUT):** Si un ID fuente ha muerto en la vida real, el panel lo carga silenciosamente. Viola la regla del *Error-as-Data*. Debería volverse de color rojo (`WARN`/`ERROR`) e invitar al usuario a removerlo.

### 2.3 Módulo: Pipeline Lineal & Selector de Nodos (`SlotSelector.jsx` y `OperatorCard.jsx`)
*   **Rol:** La cinta transportadora lógica y el mecanismo para seleccionar variables anteriores.
*   **Carencia Operativa Fundamental:**
    *   **El Slot Selector Plano:** Si entra un esquema complejo, el usuario no puede seleccionar un sub-campo `usuario > finanzas > total`. El `SlotSelector` debe evolucionar a un navegador de árbol jerárquico.
    *   **El Mentiroso RESOLVER:** El menú de la barra principal promete añadir un operador tipo `RESOLVER`, pero inyecta un `EXTRACTOR` en blanco. Un extractor real requiere obligatoriamente poder vincular su propio "Silo" en la tarjeta y definir qué columna devolverá de la búsqueda externa.

### 2.4 Módulo: Ejecución de Ensayos (`SandboxPanel.jsx`)
*   **Rol:** Área inferior de validación de lógica antes de mandar todo a producción.
*   **Problema Real:** El bloque de JSON de prueba inyecta `{"sample_key": "sample_value"}` de manera harcodeada.
*   **La Solución:** El *Sandbox* necesita leer el árbol del Pipeline y construir un formulario u objeto auto-sugestionado cruzando los Alias de la Columna A (IN). 

### 2.5 Módulo: Emparejado de Destinos (`FieldMapper.jsx` - Pendiente/Oculto)
*   **Rol:** Interfaz para el mapeo explícito de campos salientes.
*   **Carencia Operativa:** El componente está sembrador en el código pero la hidratación actual le impide renderizarse. Una vez vivo, necesita **Checks de Pre-Flight**: si quieres enchufar un output `MATH` (Number) en una celda `TEXT` de Notion, la UI debe encender una alerta ámbar de incoherencia de Tipos de Datos y evitar que llores en tiempo de ejecución.

---

## 3. MASTER PLAN DE ACCIÓN (Secuencia de Reparación)

El orden dictamina el éxito. No podemos arreglar el mapeador final sin que operen los tubos principales.

1.  **FASE ZERO: Corrección del Flujo de Datos Base.**
    *   *Acción:* Refactorizar `useBridgeHydration.js` para que identifique dinámicamente el `provider` a partir del URN del ID o de un mapeo en el store.
    *   *Acción:* Leer los metadatos fiel a la Return Law (`metadata.schema.columns`).

2.  **FASE UNO: Operatividad de Entradas (Column A).**
    *   *Acción:* Enriquecer `PortManager` y `PortCard` para que apliquen alias editables en las entradas.
    *   *Acción:* Crear el UI para activar/desactivar qué campos del esquema origen "viajarán" por el tubo logístico.

3.  **FASE DOS: Cirugía al Corazón Logístico (Columna B).**
    *   *Acción:* Reconstruir el `SlotSelector` integrando herrajes jerárquicos (desplegables en árbol).
    *   *Acción:* Construir la `OperatorCard` correcta para `RESOLVER`, incluyendo el dropdown de "Columna a Extraer".

4.  **FASE TRES: La Salida Segura (Columna C & FieldMapper).**
    *   *Acción:* Incorporar los botones de intención en Target: "INSERT (APPEND) | UPDATE".
    *   *Acción:* Rehabilitar el renderizado del `FieldMapper` con validación de matching side-by-side de Tipos.

5.  **FASE FINAL: Consolidación del Banco de Pruebas (Sandbox).**
    *   *Acción:* Dinamizar el `SandboxPanel` leyendo las llaves de las Entradas.

---

*Diseño guiado por la asunción de control humano y el cumplimiento exacto del ADR_001 (Return Law) y ADR_002 (UI Manifest).*
