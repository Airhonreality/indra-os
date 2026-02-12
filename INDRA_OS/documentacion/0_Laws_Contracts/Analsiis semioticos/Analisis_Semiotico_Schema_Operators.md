# Análisis Semiótico: Terminal Schema (Operadores y Matemáticas)
### Arquetipo: DATAGRID / COMPUTE
### Dominio: LOGIC & STRUCTURE

Este documento define la fenomenología de los artefactos "Sheet" (Schema) y "Math" (Operators) bajo la nueva arquitectura Multi-Arquetipo v8.0, enfocándose en la ergonomía cognitiva del usuario desarrollador.

---

## 1. El Problema Cognitivo
El usuario (Dev/Architect) no quiere "ver una hoja de cálculo" (eso ya lo tiene en Google Sheets). Quiere **manipular la estructura lógica de los datos** y **ejecutar operaciones deterministas**.
*   **Sheet no es una tabla:** Es un oráculo de datos estructurados.
*   **Math no es una calculadora:** Es un motor de inferencia lógica.

---

## 2. Estado GRID (La Matriz de Datos)
**Aplicable a:** SheetAdapter (View: GRID)
**Semántica:** Estructura, Densidad, Patrón.

### Representación Visual (Ergonomía)
No es un simple `<table>` HTML. Es una **Consola de Datos**.
*   **Viewport:** Una rejilla infinita virtualizada (solo renderiza lo visible).
*   **Headers:** No son solo etiquetas; son **Selectores de Columna** activos. Al hacer clic, el Panel Lateral cambia a "Column Inspector" (Tipo de dato, Filtros, Orden).
*   **Celdas:**
    *   **Estado Lectura:** Texto monospaced truncado para mantener ritmo visual.
    *   **Estado Edición (Doble Click):** Input en línea que bloquea el resto de la fila ("Focus Mode").
*   **Feedback Visual:**
    *   Filas alternas sutiles para guiar el ojo (Zebra striping).
    *   Celda activa con borde `Accent` brillante.

### Panel Lateral: "Schema Architect"
En modo GRID, el inspector derecho no muestra "detalles del archivo", sino **Estructura del Esquema**.
*   **Actions:**
    *   `[ADD COLUMN]`: Inyectar nuevo campo semántico.
    *   `[QUERY]`: Abrir mini-terminal SQL-like para filtrar (`SELECT * WHERE Status = 'Active'`).
    *   `[SYNC_SCHEMA]`: Validar que la estructura en memoria coincide con la hoja real.

---

## 3. Estado COMPUTE (El Motor Lógico)
**Aplicable a:** MathService (View: REPL/COMPUTE), SheetAdapter (View: FORMULA)
**Semántica:** Input -> Proceso -> Output.

### Representación Visual (Ergonomía)
Es una **Caja Negra Transparente**.
*   **Layout:** Vertical Split (Input arriba, Output abajo, Historia a la derecha).
*   **Zona de Entrada (Formula Deck):**
    *   No es un input de texto simple. Es un **Editor de Expresiones**.
    *   Autocompletado de funciones (`SUM`, `VLOOKUP`, `PERCENTAGE_OF`).
    *   Syntax Highlighting para argumentos.
*   **Zona de Salida (Result Stream):**
    *   Muestra el resultado con **Alta Precisión**.
    *   Si es un error, lo muestra descriptivo, no críptico (`#DIV/0!` explicada: "Attempted division by zero logic").

### Interacción Semiótica
1.  **El usuario "inyecta" lógica:** Escribe `=SUM(A1:A10)`.
2.  **El sistema "procesa":** Animación de pulso en el nodo COMPUTE.
3.  **El sistema "emite":** El resultado aparece en el Stream y se loguea en la historia.

---

## 4. Estado DOC/ADAPTER (La Metadatos)
**Aplicable a:** Sheet y Math (View: ADAPTER)
**Semántica:** Identidad, Salud, Configuración.

*   Mantiene la visualización actual de "Vital Signs" y "Capabilities".
*   Es el "Cuarto de Máquinas" donde se ve si la API de Sheets responde o si el motor Math está calibrado.

---

## 5. Síntesis de la Experiencia Multi-Arquetipo

El usuario debe sentir que está cambiando de **Lente**, no de Aplicación.

| Pestaña | Lente Cognitiva | Acción Dominante |
| :--- | :--- | :--- |
| **ADAPTER** | Técnico de Mantenimiento | Verificar Salud, Ver Logs, Configurar Token. |
| **GRID** | Arquitecto de Datos | Estructurar, Filtrar, Editar masivamente. |
| **COMPUTE** | Matemático / Lógico | Calcular, Probar Fórmulas, Simular. |

**Axioma de Diseño:**
"La herramienta debe desaparecer. Solo deben quedar los Datos y la Lógica."

---
**Autoridad:** INDRA Semiotics Division.
