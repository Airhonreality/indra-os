Blueprint OMD-08: Biblioteca de Capacidades (The Catalog)
1. Identificación y Alcance (ID & Context)
ID Técnico: view_adapter_catalog
Nombre Funcional: Biblioteca de Capacidades (The Catalog).
Naturaleza: Servicio Operacional de Nivel 2 (Transversal).
Primitiva Vinculada: PublicAPI.gs + MCEP_Distiller + ContractRegistry.
Axioma de Diseño: "La potencia precede al acto; el catálogo es el inventario de lo posible."
2. Anatomía y Distribución de la Interfaz (UI Shell)
El OMD-08 se organiza como una librería de alta densidad, optimizada para la localización rápida de herramientas.
A. Barra de Búsqueda Semántica (The Intent Search)
Input: Buscador con soporte para "Intenciones" (ej: escribes "enviar" y muestra WhatsApp, Gmail y Webhooks).
Filtros de Rol: 10 iconos que representan los Roles Canónicos (VAULT, BRIDGE, STREAM, etc.). Al activar uno, la lista se poda instantáneamente.
B. El Cuerpo de la Librería (The Asset Grid)
Tarjetas de Capacidad (Adapter Cards):
Icono: Identidad visual del servicio (Notion, AI, Math).
Label: Nombre legible (ej: "Notion Sync").
Role Tag: Etiqueta de color según el rol (ej: Azul para BRIDGE, Rojo para INHIBIT).
Status: Indicador de disponibilidad (Online/Offline/Auth Required).
C. El Tooltip de Contrato (The IO Preview)
Mecánica: Al hacer Hover prolongado (>400ms), se despliega un panel flotante.
Contenido: Muestra los Inputs y Outputs técnicos del contrato. Permite al usuario saber si el nodo es compatible con su flujo antes de instanciarlo.
3. Taxonomía de Instanciación (The Handover)
El OMD-08 es polimórfico; su salida depende del destino del "Drag & Drop":
Destino: OMD-03 (Lienzo Lógico):
Reificación: Crea un LOGIC_NODE.
Visual: Caja con puertos de entrada/salida para cables.
Destino: OMD-09 (ISK - Escenario):
Reificación: Crea un SPATIAL_ENTITY.
Visual: Un Smart Widget reactivo (Círculo, Tabla o HUD) basado en el arquetipo del adaptador.
4. Ciclo de Uso y Reprocesos (User Journey)
Paso 1: Invocación de Potencia
El usuario abre el catálogo (Panel lateral o Shift+A). El sistema realiza un getMCEPManifest() para asegurar que el inventario está actualizado con el Core.
Paso 2: Localización Semántica
El usuario busca "Bóveda". El sistema filtra y muestra los adaptadores con rol VAULT. El usuario hace hover sobre "Google Drive" para ver si tiene salida de STREAM.
Paso 3: Proyección Fantasma (Ghost Drag)
El usuario inicia el arrastre.
En el ISK: Se proyecta un wireframe del objeto en el escenario siguiendo el cursor.
En el Lienzo: Se proyecta una sombra del nodo con sus puertos.
Paso 4: Acto de Instanciación
Al soltar (Drop), el OMD-08 emite el evento INSTANTIATE_NODE.
Reproceso: Si el nodo requiere autenticación, el sistema invoca automáticamente al OMD-05 (Inspector) en la sección de Identity (OMD-01/02).
5. JSON del Artefacto: view_adapter_catalog
code
JSON
{
  "omd_08": {
    "id": "view_adapter_catalog",
    "clase_ui": "SEARCHABLE_ASSET_LIBRARY",
    "sync_protocol": "MCEP_PULL",
    "render_config": {
      "virtualization": true,
      "fps_target": 60,
      "columns": "dynamic"
    },
    "instantiation_rules": {
      "logic_canvas": { "wrapper": "NODE_BOX", "interaction": "CABLES" },
      "spatial_canvas": { "wrapper": "SMART_WIDGET", "interaction": "SPATIAL" }
    },
    "categories": [
      { "role": "VAULT", "label": "Seguridad", "color": "#FFD700" },
      { "role": "BRIDGE", "label": "Conectores", "color": "#1E90FF" },
      { "role": "STREAM", "label": "Flujos", "color": "#32CD32" }
    ]
  }
}
6. Análisis de Ergonomía Cognitiva (Auditoría de Valor)
Reconocimiento sobre Recuerdo: El usuario no necesita saber nombres técnicos; busca por "lo que quiere lograr" (Intents).
Reducción de la Carga de Error: Al previsualizar el contrato (IO Preview), el usuario evita instanciar nodos que no encajan en su lógica.
Fluidez de Contexto: El paso del Catálogo (Elegir) al Inspector (Configurar) es automático. El sistema "guía la mano" del usuario desde la intención hasta la ejecución.





