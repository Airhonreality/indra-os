# ADR_016 — AGENTIC WORKSPACE MODEL: Composición Tríptica (20/50/30)

> **Versión:** 2.0 (Axiomática)  
> **Estado:** VIGENTE  
> **Constitución:** [UI_MANIFESTO_INDUSTRIAL.md](./UI_MANIFESTO_INDUSTRIAL.md)
> **Marco Teórico:** Mendoza-Collazos (Semiótica Agentiva) + Ergonomía Cognitiva de Alta Densidad.

---

## 1. CONTEXTO Y INTENCIONALIDAD

El Workspace (Nivel 2) es el entorno donde el **Agente** (usuario) recluta **Potencias** para convertirlas en **Acción** y obtener **Resultados**. El modelo previo de carriles fallaba al no diferenciar la naturaleza de estas tres realidades. 

Se establece la **Sinceridad de la Agenda**: el sistema debe organizar los átomos no por su código, sino por su rol en el flujo de creación.

---

## 2. COMPOSICIÓN DEL DASHBOARD TRÍPTICO

Se divide el espacio operativo en tres sectores con distribución asimétrica basada en variables de diseño.

### 2.1 Columna I: POTENCIA (Silo de Disponibilidad)
**Naturaleza:** Representa el "Pasado" o la reserva de conocimiento del sistema.
- **Distribución:** `flex: 0 0 20%`.
- **Contenido:** Materia prima (`DATA_SCHEMA`, `COLLECTIONS`, `FOLDERS`).
- **Composición de Módulos:**
    - `AtomGlif_List`: Lista de alta densidad que utiliza `var(--indra-ui-gap)`.
    - **Sub-módulos `AtomGlif`:**
        - `Signifier_Icon`: Icono de clase filtrado por `var(--color-text-secondary)`.
        - `Label_Alias`: Texto mono (`var(--font-mono)`) de tamaño `var(--text-2xs)`.
        - `Resonance_Dot`: Indicador de validez de la materia.
- **Botones Mandatorios:**
    - `Action_QuickView`: Ojo/Lupa para inspección rápida sin salir de N2.

### 2.2 Columna II: AGENCIA (Núcleo de Transformación)
**Naturaleza:** El "Presente" activo. Es el lugar donde ocurre la integración.
- **Distribución:** `flex: 1` (Centro de atención primaria).
- **Contenido:** Motores agenciales (`BRIDGE`, `WORKFLOW`, `RUNNER`).
- **Composición por Chasis (`AgencyChassis`):**
    - `Chassis_Header`: Identidad dual (Símbolo + Label editable).
    - `Connectivity_Mesh`: Sub-módulo que lista las potencias reclutadas (Chips de fuentes).
    - `Agencia_Registry`: Listado de sub-procesos o workflows internos que el chasis orquesta.
- **Botones Mandatorios:**
    - `btn_FOCUS_ENGINE`: Acceso a Nivel 3. Color `var(--color-accent)`.
    - `btn_ENGINE_STATUS`: Toggle de actividad para runners.

## 2. EL MODELO TRÍPTICO ÁUREO (28 / 44 / 28)

Basándonos en la Proporción Áurea (Φ), el Workspace se divide en tres canales de atención asimétrica pero armónica:

1.  **Potencia (28%)**: Reserva Sistémica. Materia prima y esquemas. Contiene gatillos de "Siembra" (Seed).
    - **Distribución:** `flex: 0 0 28%`.
    - **Contenido:** Materia prima (`DATA_SCHEMA`, `COLLECTIONS`, `FOLDERS`).
    - **Composición de Módulos:**
        - `AtomGlif_List`: Lista de alta densidad que utiliza `var(--indra-ui-gap)`.
        - **Sub-módulos `AtomGlif`:**
            - `Signifier_Icon`: Icono de clase filtrado por `var(--color-text-secondary)`.
            - `Label_Alias`: Texto mono (`var(--font-mono)`) de tamaño `var(--text-2xs)`.
            - `Resonance_Dot`: Indicador de validez de la materia.
    - **Botones Mandatorios:**
        - `Action_QuickView`: Ojo/Lupa para inspección rápida sin salir de N2.
2.  **Agencia (44%)**: Núcleo Operativo. Donde ocurre la transformación. Contiene gatillos de "Ignición" (Ignite).
    - **Distribución:** `flex: 1` (Centro de atención primaria, ahora 44%).
    - **Contenido:** Motores agenciales (`BRIDGE`, `WORKFLOW`, `RUNNER`).
    - **Composición por Chasis (`AgencyChassis`):**
        - `Chassis_Header`: Identidad dual (Símbolo + Label editable).
        - `Connectivity_Mesh`: Sub-módulo que lista las potencias reclutadas (Chips de fuentes).
        - `Agencia_Registry`: Listado de sub-procesos o workflows internos que el chasis orquesta.
    - **Botones Mandatorios:**
        - `btn_FOCUS_ENGINE`: Acceso a Nivel 3. Color `var(--color-accent)`.
        - `btn_ENGINE_STATUS`: Toggle de actividad para runners.
3.  **Manifestación (28%)**: Prisma de Resultados. Logros y exportaciones. Contiene gatillos de "Cosecha" (Harvest).
    - **Distribución:** `flex: 0 0 28%`.
    - **Contenido:** Artefactos resultantes (`VIDEO_PROJECT`, `DOCUMENT`, `CALENDAR_EVENT`).
    - **Composición de Módulos:**
        - `Result_Gallery`: Rejilla fluida con gutter de `var(--space-2)`.
        - **Sub-módulos `ResultCard`:**
            - `Cognitive_Thumbnail`: Previsualización en `ratio-16-9`.
            - `Stamp_Procedencia`: Label mono que cita al motor creador.
            - `Status_Badge`: Etiqueta de madurez del producto.
    - **Botones Mandatorios:**
        - `Action_Export`: Flecha de salida/envío.
        - `Action_LiveToggle`: Publicación.

### 2.1 Fractalización del Hood
Se elimina el Hood global para creación de artefactos. Cada columna asume la soberanía de sus propias invocaciones a través de un **Header Action Hub**:
- **Col I Header**: Botón `+` específico para `DATA_SCHEMA`.
- **Col II Header**: Botón `+` específico para `BRIDGE` y `WORKFLOW`.

---

## 3. RESONANCIA Y HIGHLIGHT (SISTEMA DE 3 VÍAS)

Para mitigar la inflación de ruido cognitivo, el sistema de iluminación se vuelve jerárquico:

1.  **Selective (Cian - 1.0 opac)**: El artefacto bajo el foco directo del usuario.
2.  **Relational (Violeta - 0.7 opac)**: Artefactos vinculados semánticamente (Fuentes/Orígenes).
3.  **Dimmed (Gris - 0.3 opac)**: Materia inerte que no pertenece al flujo actual.

---

## 4. EL CHASIS ECOSISTÉMICO (AGENCIA PURA)

El componente central de la Columna II evoluciona a un **Socket Operacional**:
- **Dual Triggers**: Separación entre `FOCUS` (navegación macro) y `PULSE` (ejecución atómica en segundo plano).
- **Step Visualizer**: Un rastro de puntos reactivos que indica el progreso interno sin cambiar de pantalla.

---

## 5. INTEGRACIÓN INDUSTRIAL Y RESONANCIA AXIOMÁTICA

Para evitar la "artesanía de UI" y garantizar que el Dashboard sea un Hardware de Software robusto, se establecen las siguientes restricciones técnicas obligatorias:

### 5.1 Inyección de Resonancia Sistémica
*   **Axioma**: Ningún componente de tarjeta (Glif, Chassis, Card) debe gestionar su propio estado de carga.
*   **Implementación**: El orquestador (`ArtifactGrid`) es el único responsable de inyectar el atributo `data-resonance="active"` basándose en el estado global `pendingSyncs`. 
*   **Efecto**: Cualquier componente dentro de estas columnas hereda automáticamente el bloqueo de interacción y el pulso visual vía CSS global (`main.css`).

### 5.2 Soberanía del Manifiesto CSS
*   **Prohibición**: Queda terminantemente prohibido el uso de estilos inline (`style={{ opacity: ... }}`) para estados de navegación o carga.
*   **Protocolo**: Se debe usar el atributo `data-highlighted="true|false"`. 
*   **Jerarquía de Realidades**: En el CSS, la regla de Resonancia tiene una opacidad de 0.5 (Estado de Materia), mientras que el Highlight tiene una opacidad de 0.7 (Estado de Navegación). La Materia es siempre superior a la Navegación.

### 5.3 Sinceridad de Datos (Mapeo de Fuentes)
*   **Contrato**: La relación entre columnas se calcula consultando el campo `sources` (fuentes reales del átomo tipo Bridge/Workflow) y la propiedad `_origin`.
*   **Determinismo**: El `DataProjector` es la única fuente de verdad para la proyección. Si el proyector falla, el componente debe exponer el error visualmente en lugar de fallar silenciosamente.

### 5.4 Scroll Silent (Simetría Tríptica)
*   **Estética**: Las columnas deben usar la clase `.no-scrollbar` para mantener la limpieza visual del modelo 20/50/30 sin sacrificar la capacidad de contener grandes volúmenes de datos.
