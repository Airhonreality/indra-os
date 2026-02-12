 Blueprint Maestro OMD-05: Inspector de Contexto Unificado (UCI)

1. Identificación y Alcance (ID & Context)
- **ID Técnico**: `view_context_inspector`
- **Nombre Funcional**: Inspector de Contexto Unificado (The Inspector / UCI).
- **Naturaleza**: Servicio Global Polimórfico (Nivel 2 - Operacional).
- **Primitiva Vinculada**: `ContractRegistry` + `SchemaRegistry.gs` + `PublicAPI.gs`.
- **Axioma de Diseño**: "El inspector no muestra atributos; orquesta la identidad, el origen y la reacción del objeto."

2. Anatomía y Distribución de la Interfaz (UI Shell)
El UCI es un panel lateral camaleónico que se reconstruye dinámicamente según el objeto seleccionado (Nodo de Flow o Entidad del ISK). Su estructura es jerárquica y sigue el "Ciclo de Vida del Dato":

- **A. Cabecera de Identidad (The Identity Pivot)**
  - **Avatar de Arquetipo**: Icono y color dinámico según el Rol Canónico (VAULT, BRIDGE, TRANSFORM).
  - **Status de Salud**: Indicador de integridad (Materia Pura/Impura) reportado por la `PublicAPI`.
  - **ID & Alias**: Campo editable para renombrar la instancia en el sistema.

- **B. Sección de Soberanía (Who & Where)**
  - **Selector de Identidad (Identity Bridge)**: Consume directamente del **OMD-02 (Vault)**. Muestra un selector desplegable con las cuentas autorizadas (ej: "Cuenta Personal", "Cuenta Veta Designer"). Si no hay cuentas, incita a la creación en el Vault.
  - **Navegador de Recursos (Resource Hub)**: Inyecta el **OMD-05.2 (Resource Browser)**. Permite elegir la "Materia Prima" del nodo: carpetas de Drive, hojas de Sheets o colecciones de Notion.

- **C. Sección de Lógica y Reacción (What & How)**
  - **Constructor Reactivo**: Inyecta el **OMD-05.1 (Reactive Bridge)**. Permite mapear los datos de entrada hacia propiedades visuales (en el ISK) o variables de salida (en el Flujo).
  - **Schema Assistant**: Muestra el contrato técnico del nodo (Inputs/Outputs) en lenguaje humano, permitiendo previsualizar el tipo de dato que fluye.

- **D. Pie de Integridad (The Commit Bar)**
  - **Validación en Vivo**: El botón de "Aplicar" solo se activa si el esquema es coherente con el mapa reactivo.
  - **Sincronización Crítica**: Envía las mutaciones al `CoreOrchestrator` para persistir el cambio en la `Topology_Laws`.

3. Comportamiento Camaleónico (Modes)
- **Modo LOGIC_NODE**: Se enfoca en la **Sincronización de Identidad** y el mapeo de variables entre pasos del flujo.
- **Modo SPATIAL_ENTITY**: Prioriza el **Mapeo Reactivo** de parámetros visuales (radio, color, posición) vinculados a datos externos.
- **Modo SYSTEM_CONFIG**: Muestra parámetros globales de la arquitectura si se selecciona un punto de anclaje del sistema.

4. Ciclo de Uso y Protocolo de Handshake
1. **Detección**: El usuario selecciona un nodo en el `OMD-03 (Canvas)`.
2. **Ignición del UCI**: El Inspector se despliega y verifica el `semantic_intent` del nodo.
3. **Validación de Identidad**: Si el nodo es un `BRIDGE` (ej: Notion), el Inspector bloquea la configuración hasta que el usuario selecciona una cuenta válida del dropdown (vinculado al `OMD-02`).
4. **Mapeo de Recursos**: El usuario usa el Explorador de Recursos (`OMD-05.2`) para apuntar al archivo físico.
5. **Cierre de Ciclo**: Se definen las reacciones lógicas y se sincroniza con el Core.

5. JSON del Artefacto: view_context_inspector
```json
{
  "omd_05": {
    "id": "view_context_inspector",
    "clase_ui": "POLYMORPHIC_ORCHESTRATOR",
    "sync_mode": "REALITT_PULL",
    "host_capabilities": {
      "supports_submodules": true,
      "identity_injection_from": "OMD-02",
      "resource_discovery_via": "OMD-05.2",
      "reactive_mapping_via": "OMD-05.1"
    },
    "sections_layout": [
      { "id": "header", "type": "FIXED_METADATA" },
      { "id": "identity", "type": "DYNAMIC_DROPDOWN", "source": "VAULT_API" },
      { "id": "resources", "type": "INJECTED_MODULE", "id_ref": "view_resource_browser" },
      { "id": "reactivity", "type": "INJECTED_MODULE", "id_ref": "view_reactive_bridge" },
      { "id": "schema_viewer", "type": "TECHNICAL_IO_SPEC" }
    ]
  }
}
```

6. Análisis de Ergonomía Cognitiva (Auditoría de Valor)
- **Eliminación de la Falsa Elección**: El usuario no tiene que "recordar" qué cuenta usar; el sistema le presenta las opciones válidas del Vault en una sección dedicada dentro del flujo de configuración.
- **Transparencia de Datos**: Al integrar el Explorador de Recursos (`OMD-05.2`), el usuario ve gráficamente qué está conectando sin salir del contexto de configuración del nodo.
- **Seguridad en la Frontera**: El UCI actúa como el firewall de integridad. Si la configuración no cumple con el contrato del nodo, la mutación nunca llega al Core.

9. Vínculo de Integridad Axiomática (The Core Contract)
--------------------------------------------------
El inspector es el validador de contratos dinámicos del sistema.

| Dimensión | Artefacto de Referencia |
| :--- | :--- |
| **Artefacto Lógico (Logic)** | [SchemaRegistry.gs](file:///c:/Users/javir/Documents/DEVs/INDRA_FRONT_END/OrbitalCore_Codex_v1/1_Core/SchemaRegistry.gs) |
| **Fuentes de Ley (Laws)** | [Contract_Blueprints.gs](file:///c:/Users/javir/Documents/DEVs/INDRA_FRONT_END/OrbitalCore_Codex_v1/0_Laws/Contract_Blueprints.gs) |
| **Transmutador** | [MateriaTransmuter.jsx](file:///c:/Users/javir/Documents/DEVs/INDRA_FRONT_V2/src/core/ui/transmuters/MateriaTransmuter.jsx) |

### Métodos Expuestos (Public API)
- `getSchema(nodeId)`: Recupera la firma técnica (inputs/outputs) de un nodo.
- `validateNodeProps(props)`: Auditoría de integridad de datos antes de la persistencia.
- `listCapabilities()`: Listado de habilidades transmutadoras de un adaptador.

---
**Veredicto Final del Arquitecto**: El nuevo Inspector no es solo un formulario; es un **Auditor de Realidad** en tiempo real, garantizando que ninguna materia impura entre en el flujo de automatización. Con la integración directa del OMD-02 (Identity Vault), hemos logrado un flujo de configuración de "Gravedad Cero", eliminando la fricción y garantizando la coherencia estructural.