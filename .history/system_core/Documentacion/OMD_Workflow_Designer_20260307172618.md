# OMD — Workflow Designer (El Sistema Nervioso de Indra)

> **Estado:** Plan Maestro de Operatividad (Fase de Diseño Axiomático)
> **Objetivo:** Orquestar la ejecución secuencial de Átomos (Schemas, Bridges, Documents) y gestionar efectos laterales (Side-Effects) de forma radicalmente agnóstica.

---

## 1. PRINCIPIOS Y AXIOMAS DE DISEÑO

### A1 — Axioma de Pura Orquestación
El Workflow **NUNCA** transforma los datos internamente. Su responsabilidad es únicamente el transporte y la activación de otros Átomos. Si se requiere una transformación, se debe invocar a un `BRIDGE`.

### A2 — Axioma de Aislamiento de Efectos (Terminales)
Los efectos laterales (Enviar Email, Guardar en Drive) se tratan como "Nodos Terminales". Reciben una carga de datos (`payload`) y ejecutan una acción, pero no conocen el origen ni el destino del flujo.

### A3 — Agnosticismo de Disparo (Triggers)
Un Workflow puede ser disparado por tres fuentes equivalentes:
1.  **Evento Web:** (Submit de un formulario en el AEE).
2.  **Evento Cron:** (Ejecución programada en el Core).
3.  **Evento Externo:** (Hook de Notion o respuesta de una API).

---

## 2. REQUERIMIENTOS FUNCIONALES (RFs)

*   **RF-1 (Pipeline de Pasos):** Definir una secuencia lineal de "Estaciones de Ejecución".
*   **RF-2 (Contexto Acumulado):** El resultado del Paso N debe estar disponible para el Paso N+1 (Mecánica de Pipeline heredada del Bridge).
*   **RF-3 (Gestión de Adapters):** Interfaz para configurar credenciales y parámetros de efectos laterales (Sujeto a `ServiceManager`).
*   **RF-4 (Manejo de Errores):** Definición de rutas de escape ("On Failure") para evitar bucles infinitos o fallos silenciosos.

---

## 3. ARQUITECTURA DE LA INTERFAZ (UI & LAYOUT)

Distribución asimétrica de 3 columnas (Siguiendo el estándar de Indra Macro-Engines):

### 3.1 Columna Izquierda: El Trigger & Context Explorer (300px)
*   **Sección TRRIGER:** Dropdown para seleccionar qué inicia el flujo.
    *   *Opción A:* `SCHEMA_SUBMIT` (Al enviar un formulario específico).
    *   *Opción B:* `TIMER` (Recurrencia horaria/diaria).
*   **Sección DATA_FLOW:** Árbol de variables disponibles que crecen a medida que añades pasos.

### 3.2 Columna Central: El Canvas de Secuencia (flex: 1)
No es un lienzo de fideo (nodos dispersos), es una **Pila Vertical de Estaciones**.
*   **Estación (Station Card):** Cada paso tiene un icono distintivo, un nombre editable y un botón de configuración.
*   **Botón [+ AÑADIR PASO]:** Abre una paleta de 3 categorías:
    1.  **PROCESS:** Ejecutar Bridge, Renderizar Documento.
    2.  **ADAPTER:** Enviar Gmail, Subir a Drive, Notificar Slack.
    3.  **LOGIC:** Condicional (IF), Esperar (DELAY).

### 3.3 Columna Derecha: Inspector de Estación (320px)
Cambia según el tipo de nodo seleccionado:
*   **Si es BRIDGE:** Selector del átomo `BRIDGE` y mapeo de entradas del contexto del workflow hacia las entradas del bridge.
*   **Si es ADAPTER (Gmail):** Campos para `To`, `Subject` y `Body`, permitiendo inyectar variables del contexto: `{{paso_1.cliente_email}}`.

---

## 4. LÓGICA DE BOTONES Y ACCIONES

1.  **Botón "DEBUG STEP" (En cada tarjeta):** Permite ejecutar solo ese paso con datos de prueba para verificar que el pipeline es sólido.
2.  **Botón "CABLEADO NEURAL" (Mapeador):** Un modal que abre el `SlotSelector` para conectar el output de una estación con el input de otra.
3.  **Botón "FORK ON ERROR":** Un toggle en la base de cada tarjeta que permite añadir una "estación de emergencia" si la principal falla.

---

## 5. RESTRICCIONES ABSOLUTAS (Vetoes)

*   ❌ **PROHIBIDO** escribir código JS o scripts dentro del Workflow. Todo debe ser configuración de átomos o llamadas a parámetros de adapters.
*   ❌ **PROHIBIDO** el disparo circular infinito. El `directive_executor` debe limitar la profundidad de ejecución a 10 niveles.
*   ❌ **PROHIBIDO** el almacenamiento persistente de datos intermedios dentro del Workflow. El estado es volátil y solo vive durante la ejecución.
