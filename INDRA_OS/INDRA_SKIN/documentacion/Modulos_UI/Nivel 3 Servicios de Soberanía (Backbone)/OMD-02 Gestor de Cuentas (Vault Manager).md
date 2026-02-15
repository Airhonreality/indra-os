 Blueprint Maestro OMD-02: Gestor de Identidad (The Sovereignty Vault)

1. Identificación y Alcance (ID & Context)
- **ID Técnico**: `view_identity_vault`
- **Nombre Funcional**: Gestor de Cuentas (The Vault).
- **Naturaleza**: Servicio de Soberanía de Nivel 3 (Backbone).
- **Primitiva Vinculada**: `VAULT_SERVICE` + `TokenManager.gs`.
- **Axioma de Diseño**: "La identidad no es un paso del flujo; es la llave maestra que lo valida."

2. Filosofía de "Zero-Friction" (Arquitectura de Consumo)
A diferencia de versiones anteriores, el **OMD-02 ya no permite el arrastre de cuentas al lienzo de automatización**. 
- **Razón**: Evitar la entropía visual (ruido) en el grafo lógico.
- **Mecánica de Vínculo**: El **OMD-05 (Inspector)** actúa como el único cliente oficial. Cuando un usuario añade un nodo (ej: Notion), el Inspector detecta la necesidad de una credencial y consume la lista del Vault para presentar un selector desplegable.

3. Anatomía y Distribución de la Interfaz (UI Shell)
El Vault se organiza como un **Dashboard de Salud de Conexiones**, optimizado para la trazabilidad y la seguridad.
- **A. Panel de Trazabilidad (The Registry)**: Lista de alta densidad que muestra las cuentas vinculadas, su alias humano y su estado técnico (ACTIVE, EXPIRED, REVOKED).
- **B. Centro de Ignición de Identidad (Auth Hub)**: Botón central para invocar flujos OAuth o captura de API Keys mediante modales seguros.
- **C. Monitor de Salud (The Sense Probe)**: Indicador visual de latencia y validez del puente entre INDRA y el servicio externo (ej: Google Auth).

4. Definición Funcional (El "Qué")
- **Gestión del Ciclo de Vida**: Login, Refresh y Revocación de tokens.
- **Sondeo de Integridad (SENSE)**: El sistema realiza pings periódicos a las APIs externas. Si una conexión muere, el Vault marca la cuenta en rojo y notifica al usuario.
- **Abstracción de Seguridad**: El Front-end nunca manipula tokens reales; solo gestiona `account_id` y `provider_id`, garantizando que el secreto permanezca en el Core.

5. Comportamiento Camaleónico (Adaptatividad)
- **Regla de Mutación 01 (Estado de Alerta)**: Si una cuenta vinculada a un flujo activo expira, el Vault brilla con un pulso naranja (`intent: WARNING`) y ofrece el botón de "Refrescar" de forma prioritaria.
- **Regla de Mutación 02 (Detección de Colisión)**: Si el usuario intenta añadir una cuenta con un ID que ya existe, el Vault entra en modo `INHIBIT` y sugiere renombrar el alias.

6. Estrategia de Scaffolding (Andamiaje)
- **Carga de Red (Ghosting)**: Mientras el CoreOrchestrator recupera las conexiones, se muestran tarjetas con efecto "shimmer" siguiendo la `Visual_Grammar`.
- **Feedback de Conexión**: Al completar un OAuth, el Vault muestra una micro-animación de "Confeti de Datos" (partículas verdes) para celebrar la soberanía establecida.

7. JSON del Artefacto: view_identity_vault
```json
{
  "OMD-02": {
    "id": "view_identity_vault",
    "clase_ui": "IDENTITY_DASHBOARD",
    "layer": "NIVEL_3",
    "integration": {
      "primary_client": "view_node_inspector",
      "data_source": "TokenManager"
    },
    "visual_config": {
      "layout": "HIGH_DENSITY_GRID",
      "motion": "breathing-subtle",
      "tokens": {
        "active": "var(--accent-success)",
        "expired": "var(--accent-danger)",
        "pending": "var(--accent-warning)"
      }
    },
    "actions": [
      { "id": "SENSE", "label": "Verificar Conexión" },
      { "id": "REVOKE", "label": "Eliminar Acceso" },
      { "id": "REFRESH", "label": "Renovar Token" },
      { "id": "CREATE", "label": "Nueva Identidad" }
    ]
  }
}
```

8. Análisis de Ergonomía Cognitiva (Auditoría de Valor)
- **Eliminación de la Carga Mental**: El usuario no tiene que buscar cables para conectar cuentas. El sistema "sabe" que un nodo necesita una cuenta y se la ofrece en el momento justo (Context-Aware).
- **Prevención de Errores de Producción**: El Monitor de Salud (SENSE) evita que el usuario ejecute un flujo que va a fallar por falta de permisos, ahorrando ciclos de cómputo y frustración.
- **Separación de Preocupaciones**: Los flujos son para la lógica (`OMD-03`); el Vault es para la seguridad (`OMD-02`). Mezclarlos era Entropía; separarlos es Orden Soberano.

9. Vínculo de Integridad Axiomática (The Core Contract)
--------------------------------------------------
Para garantizar la soberanía de los datos, este módulo debe estar vinculado estrictamente al motor lógico del Core.

| Dimensión | Artefacto de Referencia |
| :--- | :--- |
| **Artefacto Lógico (Logic)** | [TokenManager.gs](file:///c:/Users/javir/Documents/DEVs/INDRA_FRONT_END/INDRACore_Codex_v1/1_Core/TokenManager.gs) |
| **Fuentes de Ley (Laws)** | [System_Constitution.gs](file:///c:/Users/javir/Documents/DEVs/INDRA_FRONT_END/INDRACore_Codex_v1/0_Laws/System_Constitution.gs) |
| **Contrato Visual** | [Visual_Grammar.gs](file:///c:/Users/javir/Documents/DEVs/INDRA_FRONT_END/INDRACore_Codex_v1/0_Laws/Visual_Grammar.gs) |

### Métodos Expuestos (Public API)
El Front-end debe consumir exclusivamente estos métodos para evitar fugas de integridad:
- `listTokenProviders()`: Recupera la lista dinámica de proveedores (Descubrimiento Autónomo).
- `listTokenAccounts(provider)`: Lista las identidades vinculadas a un servicio.
- `getToken(provider, accountId)`: Recupera la credencial (uso interno del Core, el Front solo recibe el status).
- `setToken(provider, accountId, data)`: Persistencia atómica de nuevas llaves.
- `deleteToken(provider, accountId)`: Revocación de soberanía.

### Dependencias de Ley (Axiomas)
- **Axioma de Encriptación**: Los datos viajan cifrados bajo la `MASTER_ENCRYPTION_KEY` definida en la Constitución.
- **Axioma de Símbolo**: El icono y color del encabezado deben mutar según el `archetype: VAULT` definido en `VisualLaws.js`.

---
**Veredicto Final del Arquitecto**: Este rediseño canoniza al OMD-02 como un componente de infraestructura invisible pero omnipresente, eliminando la "poesía" visual innecesaria en favor de una robustez industrial.




