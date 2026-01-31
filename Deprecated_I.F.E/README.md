# 🛰️ INDRA OS: Sovereign Data Orchestrator

> **Version:** V10-S (Sovereign Edition)
> **Status:** Phase 4 - Operational Prototyping
> **Platform:** React (Satellite) + Google Apps Script (Orbital Core)

---

## 📜 Level 1: Foundational Canon (Documentación Base)
La arquitectura no se improvisa. Estos documentos definen la constitución de INDRA OS.

| Documento | Rol Industrial | Axioma Definitorio | Estado |
|-----------|----------------|--------------------|--------|
| **[Axiomatic Foundation](./_documentation/Doc_nivel_1/logica_fundacional.md)** | **Architectural Principles** | **¿Por qué?** Filosofía y restricciones inmutables. | 🟢 **Closed** |
| **[Technical Blueprint](./_documentation/Doc_nivel_1/blueprint.md)** | **System Spec** | **¿Cómo?** Protocolos, topología y estructuras. | 🟢 **Closed** |
| **[Technical Contracts](./_documentation/Doc_nivel_1/contratos_tecnicos.md)** | **Constraint Definitions** | **¿Límites?** Reglas de integridad y fronteras. | 🟢 **Sealed** |
| **[UX Interaction Spec](./_documentation/Doc_nivel_1/ux_interaction_spec.md)** | **HCI Spec (V5.3)** | **¿Invarianza?** Maniobra física y depuración. | 🟢 **Sealed** |
| **[System File Structure](./_documentation/Doc_nivel_1/system_structure.spec.md)** | **Identity Resolution** | **¿Identidad?** Mapeo UUID y Bóveda Plana. | 🟢 **Sealed** |
| **[Ignition Protocol](./_documentation/Doc_nivel_1/protocolo_conexion_ignicion.md)** | **Communication** | **¿Conexión?** Contrato de ignición y Neutrón. | 🟢 **Sealed** |
| **[Scaling Roadmap](./_documentation/Doc_nivel_1/roadmap_escalabilidad.md)** | **Expansion Plan** | **¿Mañana?** Evolución en 3 niveles. | 🟢 **Closed** |

---

## 🏛️ Level 2: Axiomatic Artifact Contracts (Fisiología del Satélite)
Contratos técnicos individuales para cada módulo del sistema. Cobertura 1:1 (Atomizada).

| Componente | Artefacto Fuente | Contrato Axiomático |
|------------|------------------|---------------------|
| **Bridge** | `Neutron.js` | **[Neutron](./_documentation/Doc_nivel_2/contrato_neutron.md)** |
| | `Resolver.js` | **[Resolver](./_documentation/Doc_nivel_2/contrato_resolver.md)** |
| | `Discovery.js` | **[Discovery](./_documentation/Doc_nivel_2/contrato_discovery.md)** |
| **Store** | `Amnesia.js` | **[Amnesia](./_documentation/Doc_nivel_2/contrato_amnesia.md)** |
| | `Recall.js` | **[Recall](./_documentation/Doc_nivel_2/contrato_recall.md)** |
| | `SessionStore.js`| **[Session](./_documentation/Doc_nivel_2/contrato_session.md)** |
| **Explorer** | `Navigator.jsx` | **[Navigator](./_documentation/Doc_nivel_2/contrato_navigator.md)** |
| | `Symbology.js` | **[Symbology](./_documentation/Doc_nivel_2/contrato_symbology.md)** |
| **Graph** | `Reality.jsx` | **[Reality](./_documentation/Doc_nivel_2/contrato_reality.md)** |
| | `NodeFactory.js` | **[NodeFactory](./_documentation/Doc_nivel_2/contrato_node_factory.md)** |
| | `Flux.js` | **[Flux](./_documentation/Doc_nivel_2/contrato_flux.md)** |
| **Preview** | `Eidos.jsx` | **[Eidos](./_documentation/Doc_nivel_2/contrato_eidos.md)** |
| | `AutoLayout.js` | **[AutoLayout](./_documentation/Doc_nivel_2/contrato_autolayout.md)** |
| | `StylePanel.jsx` | **[StylePanel](./_documentation/Doc_nivel_2/contrato_stylepanel.md)** |
| **Precision** | `AetherRibbon.jsx`| **[Aether Ribbon](./_documentation/Doc_nivel_2/contrato_aether_ribbon.md)** |
| **Bootstrap** | `App / main` | **[Genesis](./_documentation/Doc_nivel_2/contrato_genesis_ignition.md)** |
| **Logic** | `*.json` | **[Materia JSON](./_documentation/Doc_nivel_2/contrato_materia_json.md)** |
| **Network** | `Federation` | **[Federation](./_documentation/Doc_nivel_2/contrato_federacion.md)** |
| **Design** | `index.css` | **[Design Tokens](./_documentation/Doc_nivel_2/contrato_design_tokens.md)** |

---

## 🏗️ Architecture Stack

### **Satellite (Frontend)**
- **Tech:** React + Vite + Zustand.
- **Role:** Experience Calculation. Sums, filters, and renders visuals instantly (0ms latency).
- **Rule:** Never sees raw data or API tokens.

### **Orbital Core (Backend)**
- **Tech:** Google Apps Script (GAS).
- **Role:** Truth & Persistence. Handles heavy operations (PDF gen) and API integrations.
- **Rule:** The only place where Secrets live.

---

## 🚀 Getting Started

1. **Lee el [Blueprint](./_documentation/blueprint.md)**. No empieces sin entender la *Soberanía Reactiva*.
2. **Revisa los [Contratos](./_documentation/contratos_tecnicos.md)**. Entiende qué es la *Purga de Schema*.
3. **Run Dev:**
   ```bash
   npm run dev
   ```

---
*Prototipado bajo la supervisión del Auditor Soberano.*
