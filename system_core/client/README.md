# INDRA CLIENT — La Membrana de Visualización (Front-end)

Este directorio contiene el cliente de alta fidelidad de **Indra OS**. Es la interfaz de interacción entre el Agente (Usuario) y la Malla de Conocimiento. Su arquitectura es **Micelar**, lo que significa que es totalmente independiente del Core y podría ser desplegado en cualquier servidor de estáticos o incluso localmente.

---

## 1. Justificación del Diseño
Bajo la **TGS**, el Cliente actúa como la **Membrana Sensorial**. Su función no es procesar datos (eso lo hace el Core), sino proyectarlos de una forma que sea asimilable por la mente humana mediante **Resonancia Visual**.

---

## 2. Estructura Axiomática (Suh)

| Req. Funcional (FR) | Parámetro de Diseño (DP) |
| :--- | :--- |
| **FR1: Visualización Relacional** (Grafo, Listas de Alta Densidad). | **DP1: Agency Chassis / Fractal Hood** |
| **FR2: Orquestación de Mensajería** (Envío de UQOs al Core). | **DP2: Indra Satellite Protocol (ISP)** |
| **FR3: Estado Soberano** (Sincronización de UI con el Core). | **DP3: AppState Resonance Engine** |

---

## 3. Componentes Críticos

### 🛸 `indra-satellite-protocol` (ISP)
Este es un **Submódulo Git** soberano. Es el motor de comunicación universal que utiliza `IndraBridge.js` para hablar con el Core a través del protocolo MCEP.

### 🎭 Agency Chassis
Módulos de UI diseñados bajo el **ADR_016** (Composición Tríptica 28/44/28). Se encargan de la transición entre los estados de Potencia, Agencia y Manifestación.

---

## 4. Restricciones de Desarrollo

1.  **Aislamiento de Lógica:** El cliente nunca debe realizar lógica de negocio pesada. Si hay que calcular algo, se envía un `BRIDGE_EXECUTE` al Core.
2.  **Sinceridad Visual:** Si un átomo está en estado de carga en el Core (`pendingSyncs`), la UI debe reflejarlo mediante el pulso de resonancia (`data-resonance="active"`), prohibiéndose los estados de carga locales que no correspondan a la realidad del Ledger.
3.  **Zero Config:** El cliente debe ser capaz de autodescubrir el Core mediante el handshake de identidad inicial.

---

⚡ **Indra Client: Proyectando la luz del conocimiento.** ⚡
