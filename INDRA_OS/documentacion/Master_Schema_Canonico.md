# 🗺️ Master Schema Canónico: INDRA OS v5.6.2 (Modelo Alpha)

Este esquema es la **Verdad Única** para la validación de forma literal post-refactorización. El cumplimiento de esta estructura garantiza la eliminación de la entropía arquitectónica.

---

## 📂 I. Topología del Workspace (File System)

```text
/INDRA_OS (Repositorio Maestro Unificado)
│
├── 📂 INDRA_CORE (L0/L1 - El Genotipo / Headless Logic - Google Apps Script)
│   ├── 📂 0_Laws            <-- Leyes Axiomáticas (STARK_CASE)
│   │   ├── 📄 System_Constitution.gs      <-- SSOT: Registro de Componentes
│   │   ├── 📄 System_Hierarchy.gs         <-- Jerarquía de Niveles
│   │   ├── 📄 Visual_Grammar.gs           <-- Mapeo Archetype → UI Intent
│   │   └── 📄 UI_Distribution.gs          <-- Distribución de Slots
│   │
│   ├── 📂 1_Core            <-- Motores y Orquestadores
│   │   ├── 📄 CoreAssembler.gs            <-- Inyección de Dependencias
│   │   ├── 📄 PublicAPI.gs                <-- Fachada de Ejecución
│   │   └── 📄 CoreOrchestrator.gs         <-- Motor de Renderizado
│   │
│   ├── 📂 2_Services        <-- Lógica Distilada y Proyección
│   │   ├── 📄 ProjectionKernel.gs         <-- Proyección hacia el Front
│   │   ├── 📄 FlowControlService.gs
│   │   └── 📄 RenderEngine.gs
│   │
│   ├── 📂 3_Adapters        <-- Puentes Industriales (Aislados)
│   │   ├── 📄 DriveAdapter.gs             <-- id: "DRIVE_ADAPTER"
│   │   ├── 📄 SheetAdapter.gs             <-- id: "SHEET_ADAPTER"
│   │   ├── 📄 LLMAdapter.gs               <-- id: "LLM_ADAPTER"
│   │   └── 📄 NotionAdapter.gs            <-- id: "NOTION_ADAPTER"
│   │
│   ├── 📂 4_Infra           <-- Seguridad, Configuración y Errores
│   ├── 📂 6_Tests           <-- Suite de Auditoría Axiomática
│   └── 📂 7_Diagnostics     <-- Forense de Contratos y Pureza
│       └── 📄 ContractGatekeeper.gs       <-- Validador de Soberanía
│
├── 📂 INDRA_SKIN (L2 - El Fenotipo / Stateless UI - React/GitHub Pages)
│   ├── 📂 src
│   │   ├── 📂 core
│   │   │   ├── 📄 SkinAssembler.js        <-- Reflexión de Interfaz
│   │   │   └── 📄 LawBridge.js            <-- Intérprete de Proyección Core
│   │   │
│   │   ├── 📂 organs                      <-- Componentes UI (Vault, ISK, Terminal)
│   │   │   ├── 📄 VaultManager.jsx
│   │   │   ├── 📄 ISKCanvas.jsx
│   │   │   └── 📄 FlowOrchestrator.jsx
│   │   │
│   │   └── 📂 hooks                       <-- Conexión reactiva al Core
│   │       └── 📄 useCoreProjection.js
│   │
│   └── 📄 vite.config.js                  <-- Despliegue GitHub Pages
│
└── 📂 _documentation (La Brújula Compartida)
    ├── 📂 00_Laws_Contracts               <-- SSOT Compartido
    ├── 📂 ADRs                            <-- Decisiones Arquitectónicas
    │   ├── 📄 ADR_001_Proyeccion_Jerarquia_Sistema.md
    │   └── 📄 ADR_002_Contencion_Entropia_Ontologica.md
    │
    └── 📄 Master_Schema_Canonico.md       <-- Este documento
```

---

## 🏗️ II. Capas del Sistema (Jerarquía Funcional)

| Capa | Nombre Canónico | Función | SSOT |
| :--- | :--- | :--- | :--- |
| **L0** | **GENOTIPO** | Axiomas, UIDB, Ontología STARK. | `System_Constitution.gs` |
| **L1** | **PROYECCIÓN** | Destilación de realidad para el exterior. | `ProjectionKernel.gs` |
| **L2** | **FENOTIPO** | Manifestación visual y experiencia de usuario. | `SkinAssembler.js` |

---

## 🧬 III. Nomenclatura Canónica de Componentes (STARK_CASE)

### Adaptadores (ADAPTERS)
| ID Canónico | Label UI | Domain | Archivo |
| :--- | :--- | :--- | :--- |
| `DRIVE_ADAPTER` | Storage Engine | SYSTEM_INFRA | `DriveAdapter.gs` |
| `SHEET_ADAPTER` | Data Ledger | SYSTEM_INFRA | `SheetAdapter.gs` |
| `EMAIL_ADAPTER` | Messaging Bridge | SYSTEM_INFRA | `EmailAdapter.gs` |
| `NOTION_ADAPTER` | Notion Connector | SENSING | `NotionAdapter.gs` |
| `LLM_ADAPTER` | Cognitive Engine | INTELLIGENCE | `LLMAdapter.gs` |
| `MAPS_ADAPTER` | Spatial Intelligence | SENSING | `MapsAdapter.gs` |
| `ORACLE_ADAPTER` | Deep Research Engine | SENSING | `OracleAdapter.gs` |
| `CALENDAR_ADAPTER` | Temporal Engine | SCHEDULING | `CalendarAdapter.gs` |
| `SPATIAL_ADAPTER` | Spatial Projection Manager | SYSTEM_INFRA | `ISK_ProjectionAdapter.gs` |

### Servicios (SERVICES)
| ID Canónico | Label UI | Domain | Archivo |
| :--- | :--- | :--- | :--- |
| `TOKEN_MANAGER` | Security Vault | SYSTEM_CORE | `TokenManager.gs` |
| `FLOW_SERVICE` | Workflow Orchestrator | CORE_LOGIC | `FlowControlService.gs` |
| `RENDER_ENGINE` | Visual Matrix | CORE_LOGIC | `RenderEngine.gs` |
| `JOB_QUEUE` | Task Scheduler | SYSTEM_CORE | `JobQueueService.gs` |
| `ADMIN_TOOLS` | System Control | GOVERNANCE | `AdminTools.gs` |

---

## ⚖️ IV. Reglas de Validación Literal (Checklist de Cumplimiento)

1.  **Regla de Naming STARK**: Todas las claves en `COMPONENT_REGISTRY` (L0) deben ser `UPPER_CASE` con guiones bajos (ej: `DRIVE_ADAPTER`).
2.  **Regla de No-Duplicidad**: Prohibido el uso de alias para corregir tipado (ej. no más `ADMINTOOLS` si ya existe `ADMIN_TOOLS`).
3.  **Regla de Pureza de Despliegue**: 
    - **INDRA_CORE** sube vía `clasp push` ignorando activos web (`.claspignore` filtra `/INDRA_SKIN`).
    - **INDRA_SKIN** despliega en GitHub Pages ignorando lógica `.gs`.
4.  **Regla de Inferencia de UI**: Un adaptador en el Skin **no sabe** para qué sirve; el `SkinAssembler` le dice qué icono y color usar basándose en la `Visual_Grammar.gs` del Core.
5.  **Regla de Assemblers Canónicos**:
    - **INDRA_CORE**: `CoreAssembler.gs` (Inyección de Dependencias lógicas).
    - **INDRA_SKIN**: `SkinAssembler.js` (Reflexión de Interfaz visual).

---

## 🔗 V. Vínculo Core ↔ Skin (The Handshake)

El único punto de comunicación es la **Proyección JSON** generada por `ProjectionKernel.gs`:

```javascript
// Ejemplo de proyección
{
  "version": "5.6.2",
  "genotypeHash": "a3f9c2...",
  "components": {
    "DRIVE_ADAPTER": {
      "id": "DRIVE_ADAPTER",
      "label": "Storage Engine",
      "archetype": "ADAPTER",
      "domain": "SYSTEM_INFRA",
      "semantic_intent": "BRIDGE",
      "methods": ["store", "retrieve", "find"],
      "schemas": { /* ... */ }
    }
  }
}
```

El **SkinAssembler.js** consume esta proyección y genera la UI sin hardcoding.

---

*Este esquema es el ancla del sistema. Cualquier desviación de este mapa se considera Entropía de Arquitectura.*
