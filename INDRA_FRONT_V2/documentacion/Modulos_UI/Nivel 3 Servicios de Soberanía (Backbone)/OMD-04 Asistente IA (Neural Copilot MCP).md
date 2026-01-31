El Módulo 4 no es un simple chat; es una Terminal Neuronal. Para resolver tus dudas, aplicaremos la metodología de "El Puente de Tres Capas":
Capa de Lenguaje (Chat): Lo que el humano dice.
Capa Semántica (JSON Espejo): Lo que la máquina entiende.
Capa Espacial (Canvas): Lo que el sistema ejecuta.
Respuesta a tus dudas metodológicas:
¿Panel JSON Espejo incluido? Sí. Es vital para la transparencia cognitiva. El usuario debe ver cómo sus palabras se transforman en código. Se sitúa como una pestaña o un panel colapsable dentro del mismo módulo.
Acoplamiento Dúplex: Se maneja mediante un Estado de Borrador (Draft State).
Flujo: IA propone cambio -> El JSON Espejo resalta los cambios (Diff) -> El Canvas muestra "Nodos Fantasma" (Scaffolding) -> El usuario pulsa "Aplicar" -> El Core persiste.
Persistencia y Recarga:
El Chat: Debe ser Persistente por Proyecto. Si cierras la sesión y vuelves al proyecto "Bot WhatsApp", la conversación debe estar ahí. Se guarda en el Core (GAS/Drive) como un archivo .log o dentro del metadato del proyecto.
Efímero vs Multichat: Proponemos Hilos Contextuales. Cada proyecto tiene su hilo. No es un chat infinito tipo WhatsApp, sino una bitácora de construcción. Se borra solo si el usuario decide "Reiniciar Realidad".
Blueprint OMD-04: Asistente IA (Neural Copilot MCP)
1. Identificación y Alcance (ID & Context)
ID Técnico: view_ai_copilot
Nombre Funcional: Asistente de Configuración IA (Copilot).
Primitiva Vinculada: LLM_BRIDGE / indra / intelligence.
Arquetipo Visual: LOGIC_CORE (Usa container_style: "glass-panel-neon", motion: "breathing", header_icon: "Cpu").
2. Definición Funcional (El "Qué")
Objetivo Primario: Traducir intenciones humanas en estructuras lógicas válidas, manipulando el grafo y los parámetros de los nodos mediante el protocolo MCP.
Acciones Atómicas:
Prompting: Entrada de lenguaje natural.
Inspección de Espejo: Ver y editar manualmente el JSON generado.
Rollback: Volver a una versión anterior del JSON si la IA comete un error.
Sincronización: Aplicar cambios del espejo al lienzo de forma masiva.
3. Modelo de Datos e Interfaz (El "Contrato")
Input JSON (Contexto Dual):
code
JSON
{
  "user_prompt": "Agrega un filtro de fecha después del LLM",
  "current_graph_json": { "nodes": [...], "edges": [...] },
  "conversation_history_ref": "drive_file_id_001"
}
Output JSON (Propuesta de Cambio):
code
JSON
{
  "explanation": "He insertado un nodo TRANSFORM entre el LLM y el Calendario.",
  "proposed_json": { "nodes": [...], "edges": [...] },
  "diff_map": { "added": ["n3"], "modified_edges": ["e2"] }
}
Estado de Sincronía: DÚPLEX / ASÍNCRONO. La IA procesa mientras el usuario puede seguir moviendo nodos.
4. Comportamiento Camaleónico (Adaptatividad)
Regla de Mutación 01 (Foco en Nodo): Si el usuario selecciona un nodo de "WhatsApp" en el Canvas, el Copilot cambia su contexto automáticamente: "Estoy listo para ayudarte a configurar los parámetros de WhatsApp".
Regla de Mutación 02 (Error de Sintaxis): Si el usuario edita el JSON Espejo manualmente y comete un error, el panel vira a border_color: "var(--accent-danger)" y la IA interviene: "Parece que hay un error en la línea 12, ¿quieres que lo corrija?".
5. Estrategia de Scaffolding (Pre-visualización)
Estado Fantasma (Ghosting): Cuando la IA propone un nuevo flujo, los nuevos nodos aparecen en el Canvas (Módulo 3) de forma semitransparente con motion: "vibration". No son "reales" hasta que el usuario acepta en el panel de la IA.
Simulación de Flujo: La IA puede "narrar" cómo viajaría un dato por el nuevo esquema antes de activarlo.
6. Análisis de Ergonomía Cognitiva (Ciclo de Vida y Reprocesos)
Prevención de Alucinaciones: El sistema incluye un botón de "Validar Esquema". Antes de aplicar un cambio de la IA, el Core verifica que los IDs de los Vaults existan.
Reproceso de "Malentendido": Si la IA conecta mal los nodos, el usuario tiene un botón de "Deshacer Cambio de IA" que restaura el JSON anterior del espejo.
Uso en Campo: El chat tiene "Comandos Rápidos" (Slash commands) como /clean para organizar los nodos en el canvas o /debug para explicar por qué falló el último paso.
JSON de Artefacto: view_ai_copilot
code
JSON
{
  "artefacto": {
    "id": "view_ai_copilot",
    "clase_ui": "SPLIT_TERMINAL_CHAT",
    "laws_apply": {
      "intent": "COMPUTE",
      "motion": "breathing",
      "token": "var(--accent-primary)"
    },
    "sub_artefactos": [
      {
        "id": "neural_chat_stream",
        "tipo": "CHAT_INTERFACE",
        "propiedades": {
          "persistence": "PROJECT_LINKED",
          "storage_ref": "CORE_LOGIC.project_logs"
        },
        "ciclo_uso": "Conversación fluida. Mantiene el contexto de los últimos 20 cambios para permitir razonamiento histórico."
      },
      {
        "id": "json_mirror_editor",
        "tipo": "CODE_EDITOR_MINI",
        "propiedades": {
          "language": "json",
          "read_only": false,
          "diff_mode": true
        },
        "ciclo_uso": "Muestra el 'ADN' del flujo. Permite al usuario experto ajustar detalles que la IA no captó (ej. un ID específico)."
      },
      {
        "id": "mcp_action_bar",
        "tipo": "CONTROL_GROUP",
        "botones": [
          { "label": "Aplicar al Canvas", "action": "COMMIT", "intent": "WRITE" },
          { "label": "Rechazar", "action": "DISCARD", "intent": "DELETE" },
          { "label": "Versiones", "action": "HISTORY", "intent": "READ" }
        ],
        "ciclo_uso": "Punto de decisión dúplex. Sincroniza la Capa Semántica con la Capa Espacial."
      }
    ]
  }
}
Notas de Auditoría para el Desarrollador:
Persistencia: Implementar un debounce de 2 segundos para guardar el historial del chat en localStorage y una sincronización con el Core cada vez que se pulse "Aplicar".
Mirroring: El editor JSON debe resaltar en color var(--accent-success) las líneas nuevas propuestas por la IA para que el usuario las identifique visualmente en milisegundos.
Protocolo MCP: El desarrollador debe asegurar que la IA tenga acceso a la primitiva getAllNodes para que sepa qué herramientas tiene disponibles en la biblioteca antes de proponer un nodo.