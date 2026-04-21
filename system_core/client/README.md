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
Este es un **Submódulo Git** soberano. Es el motor de comunicación universal. 
**IMPORTANTE:** La comunicación con el Core debe realizarse EXCLUSIVAMENTE a través del objeto `bridge` (instancia de `DesignerBridge`). 
- Consulta el [ADR_042: Agnostic Bridge Protocol](../Documentacion/3_System_Protocols_and_Auth/ADR_042_AGNOSTIC_ISP_BRIDGE.md) para la especificación completa.

### 🎭 Agency Chassis
Módulos de UI diseñados bajo el **ADR_016** (Composición Tríptica 28/44/28). Se encargan de la transición entre los estados de Potencia, Agencia y Manifestación.

---

## 4. Desarrollo Soberano (Quickstart)

### ¿Cómo hablar con el Core?
```javascript
// NO USAR: executeDirective(...) ❌
// USAR: bridge.execute(uqo, options) ✅

const res = await bridge.execute({
    provider: 'drive',
    protocol: 'ATOM_READ',
    context_id: 'my_id'
});
```

---

## 5. Restricciones de Seguridad
1.  **Aislamiento de Lógica:** El cliente nunca debe realizar lógica de negocio pesada.
2.  **Sinceridad Visual:** El pulso de resonancia (`data-resonance="active"`) es obligatorio durante la sincronización.
3.  **Encapsulación de Secretos:** Jamás pases el `sessionSecret` como prop. El Bridge se encarga de la identidad.

---

⚡ **Indra Client: Proyectando la luz del conocimiento.** ⚡
