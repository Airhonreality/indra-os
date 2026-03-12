# MDO — Workflow Designer (El Sistema Nervioso de Indra)

> **Estado:** Maestro de Operatividad (v1.2 - Agnosticismo Refinado)
> **Responsabilidad:** Orquestar secuencias de UQOs y controlar el flujo de datos entre proveedores.

---

## 1. AXIOMAS DE DISEÑO (CORE)

### A1 — Orquestación Pura (UQO-Driven)
El Workflow no ejecuta lógica interna; emite instrucciones (UQOs) al `ProtocolRouter`. Si se requiere cálculo, se invoca un átomo de tipo `BRIDGE`.

### A2 — Poda de Contexto (Context Pruning)
Para evitar el "Contexto Obeso", cada estación debe definir explícitamente qué datos de su output se inyectan en el `flowContext`. **No se arrastra basura histórica por defecto.**

### A3 — Bifurcación Lógica (Routing Station)
El flujo no es solo lineal. Se introducen **Nodos de Decisión (ROUTERS)** que evalúan el contexto y desvían el flujo hacia diferentes ramas (Success/Failure/Condition).

---

## 2. ARQUITECTURA TÉCNICA (MODULARIZACIÓN)

Ubicación: `system_core/client/src/components/macro_engines/WorkflowDesigner/`

### 2.1 Estructura del Átomo
*   **Init:** Registro en `EngineRegistry`.
*   **Context:** `WorkflowContext.jsx` maneja el AST del flujo.
*   **Stations:** 
    *   `ProtocolStation.jsx`: Para invocar proveedores.
    *   `RouterStation.jsx`: Lógica condicional (IF/ELSE).
    *   `MapStation.jsx`: Limpieza y poda de datos (Context Management).

---

## 3. DISEÑO DE INTERFAZ (UI)

### 3.1 El Lienzo de Secuencia (Center)
*   **Pipeline Vertical Dinámico:** Los pasos se conectan mediante líneas de flujo que pueden dividirse en caso de un `RouterStation`.
*   **Station Card:** Estética axiomática, borde sutil. El color del borde indica el tipo de operación (Integración, Lógica, Poda).

### 3.2 Inspector de Estación (Right)
*   **SlotSelector (El Cableador):** Menú *glassmorphism* para elegir variables de pasos anteriores.
*   **Output Filter:** Interfaz para seleccionar qué campos específicos se guardan en el contexto para el siguiente paso (Axioma A2).

---

## 4. RESTRICCIONES REFINADAS

*   ❌ **PROHIBIDO** el hardcoding de nombres de proveedores (Gmail, Notion). Se usa `provider_id`.
*   ❌ **PROHIBIDO** los bucles infinitos. Máximo 10 niveles de profundidad.
*   ❌ **PROHIBIDO** el acceso a datos no podados. Solo lo que se mapea explícitamente está disponible en el siguiente paso.
