Blueprint OMD-02: Gestor de Cuentas (Vault Manager)
1. Identificación y Alcance (ID & Context)
ID Técnico: view_vault_manager
Nombre Funcional: Gestor de Cuentas (Bóveda de Identidad).
Primitiva Vinculada: VAULT_SERVICE / tokenManager.
Arquetipo Visual: STATE_NODE (Usa container_style: "glass-panel-dim" y motion: "pulse-slow").
2. Definición Funcional (El "Qué")
Objetivo Primario: Centralizar, validar y proteger las credenciales multi-api, permitiendo la inyección de identidad en los flujos sin exponer secretos.
Acciones Atómicas:
Vincular: Iniciar flujo OAuth o captura de API Key.
Sondear (Sense): Verificar en tiempo real si el token sigue siendo válido.
Persistir (Write): Guardar cambios en el almacenamiento cifrado del Core.
Revocar (Delete): Eliminar la conexión y limpiar residuos de sesión.
Etiquetar: Asignar alias humanos a cuentas (ej: "Notion Trabajo" vs "Notion Personal").
3. Modelo de Datos e Interfaz (El "Contrato")
Input JSON (Desde el Core):
code
JSON
{
  "vault_status": "READY",
  "accounts": [
    { "id": "acc_001", "provider": "google_drive", "alias": "Drive Principal", "status": "ACTIVE" },
    { "id": "acc_002", "provider": "notion", "alias": "Notion Personal", "status": "EXPIRED" }
  ]
}
Output JSON (Hacia el Core):
code
JSON
{
  "intent": "PERSIST",
  "action": "UPDATE_ALIAS",
  "payload": { "account_id": "acc_001", "new_alias": "Drive Corporativo" }
}
Estado de Sincronía: ASÍNCRONO. El usuario puede operar otros paneles mientras una cuenta se está "Sondeando" o "Vinculando".
4. Comportamiento Camaleónico (Adaptatividad)
Regla de Mutación 01 (Estado de Alerta): Si una cuenta devuelve status: "EXPIRED", la tarjeta de cuenta cambia su border_color a var(--accent-danger) y activa el signifier: "hazard-dash".
Regla de Mutación 02 (Proceso de Vinculación): Mientras se espera el callback de OAuth, el panel adopta el intent: "SENSE" con una animación radar-sweep para indicar que el sistema está "percibiendo" la respuesta externa.
5. Estrategia de Scaffolding (Pre-visualización)
Estado Fantasma (Skeleton): Al abrir el panel, se muestran 3 tarjetas vacías con motion: "pulse-slow" para indicar que la Bóveda está "respirando" mientras recupera los datos del Core.
Simulación de Éxito: Al introducir una API Key, el sistema muestra un "Check" fantasmal en el puerto de salida antes de confirmar, simulando la conexión exitosa.
6. Análisis de Ergonomía Cognitiva (Escenarios de Campo)
Escenario A: El Reproceso por Expiración. El usuario está en el Editor de Flujos y un nodo falla. El sistema debe permitir abrir el view_vault_manager en un panel lateral (Drawer) sin cerrar el flujo, re-autenticar y que el flujo se repare automáticamente.
Escenario B: Multi-cuenta Confuso. Si el usuario tiene 3 cuentas de Google, la UI debe forzar el uso de identity/id con mono-bold para diferenciar los IDs técnicos de los alias humanos, evitando que el usuario inyecte la cuenta equivocada en un flujo crítico.
Escenario C: Error de Red. Si el Core no responde, el panel activa el rol diagnostic/error con mono-italic, explicando que el problema es de conectividad y no de la credencial.
JSON de Artefacto: view_vault_manager
code
JSON
{
  "artefacto": {
    "id": "view_vault_manager",
    "clase_ui": "SIDE_PANEL_GRID",
    "laws_apply": {
      "container": "glass-panel-dim",
      "header_icon": "Database",
      "interaction": "haptic-snap"
    },
    "sub_artefactos": [
      {
        "id": "vault_header",
        "tipo": "HEADER_SECTION",
        "roles": { "title": "identity/id", "instruction": "metadata/instruction" },
        "contenido": { "title": "Bóveda de Identidades", "instruction": "Gestiona tus accesos seguros a servicios externos." }
      },
      {
        "id": "account_card_template",
        "tipo": "INTERACTIVE_CARD",
        "intent_mapping": {
          "ACTIVE": "READ",
          "CONNECTING": "SENSE",
          "ERROR": "DELETE"
        },
        "visual_elements": {
          "port_shape": "circle",
          "port_interaction": "pull",
          "haptic": "sharp-tick"
        },
        "ciclo_uso": "El usuario visualiza el estado. Si el estado es 'EXPIRED', la affordance cambia a 'active-injection' (WRITE) para forzar la actualización."
      },
      {
        "id": "add_account_trigger",
        "tipo": "FAB_BUTTON",
        "intent": "EXECUTE",
        "visual": {
          "signifier": "lightning-flow",
          "icon": "Plus",
          "token": "var(--accent-primary)"
        },
        "ciclo_uso": "Inicia el proceso de expansión de la bóveda. Abre un modal de selección de proveedor (ADAPTER)."
      },
      {
        "id": "connection_tester",
        "tipo": "PROBE_TOOL",
        "intent": "SENSE",
        "visual": {
          "signifier": "radar-sweep",
          "animation": "scan 3s infinite"
        },
        "ciclo_uso": "Botón de 'Test' manual. Envía un ping al servicio externo para asegurar que el puente (BRIDGE) está operativo antes de usarlo en un flujo."
      }
    ]
  }
}
Notas de Auditoría para el Desarrollador:
Física de Cables: Aunque este panel es una lista, si el usuario arrastra una cuenta directamente al Canvas (Panel 3), el cable generado debe seguir la tension_formula: "distance * 0.5" y usar el stroke de var(--accent-success) (READ) porque solo estamos "leyendo" la identidad.
Haptic Feedback: Es vital implementar el heavy-click en la acción de borrar cuenta para evitar eliminaciones accidentales (Prevención de Errores).
Layout: Respetar estrictamente el node_width: 220 para las tarjetas de cuenta, asegurando que la interfaz sea consistente con el resto de los módulos.