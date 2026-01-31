💎 Blueprint OMD-05: Inspector de Contexto Unificado (UCI)
1. Identificación y Alcance (ID & Context)
ID Técnico: view_context_inspector
Nombre Funcional: Inspector de Contexto Unificado (UCI).
Naturaleza: Servicio Global Polimórfico (Camaleónico).
Primitiva Vinculada: ContractRegistry + SchemaManager + USSP_Bridge.
Axioma de Diseño: "El inspector no muestra atributos; proyecta el puente entre la lógica y la manifestación."
2. Anatomía y Distribución de la Interfaz (UI Shell)
El UCI se organiza en una estructura vertical jerárquica que guía al usuario a través del "Ciclo de Realidad" del objeto seleccionado.
A. Cabecera de Identidad (The Entity Header)
Avatar de Arquetipo: Icono dinámico según el rol (VAULT, RECT, BRIDGE, etc.).
ID & Alias: Nombre técnico y nombre amigable del objeto.
Selector de Arquetipo: Dropdown para mutar la naturaleza del objeto (ej: transformar un RECT en un REPEATER).
B. Cuerpo Dinámico (The Camaleonic Body)
Esta sección no es fija; se construye inyectando módulos según el contexto:
Sección de Identidad (Who): Llama al OMD-01/02 para gestionar credenciales y permisos.
Sección de Bóveda (Where): Inyecta el OMD-12 (Resource Browser) para elegir carpetas de Drive, tablas de Notion o canales de datos.
Sección de Estructura (What): Muestra el esquema detectado. Permite definir qué campos son visibles o editables.
Sección de Manifestación (How): Inyecta el OMD-11 (Reactive Mapper) para conectar los campos del esquema con atributos visuales o lógicos.
C. Pie de Integridad (The Commit Bar)
Status de Sincronización: Indica si los cambios están en Local, Pending o Synced (Core).
Botón de Acción Primaria: "Aplicar Cambios" o "Sincronizar Bóveda".
Historial Local: Acceso rápido a Undo/Redo específicos de este objeto.
3. Comportamiento Polimórfico (The Camaleon Logic)
El UCI detecta el target_type y reconfigura su anatomía en microsegundos:
Caso A: Nodo de Automatización (Indra Canvas): Prioriza la configuración de Bóvedas, Credenciales y Mapeo de Datos entre nodos.
Caso B: Entidad Gráfica (ISK): Prioriza el Inspector Visual (Color, Tamaño, FX) y el Mapeador Reactivo para animaciones.
Caso C: Agente IA (Neural Copilot): Prioriza la configuración de "Personalidad", "Contexto de Datos" y "Límites de Ejecución".
4. Ciclo de Uso y Reprocesos (User Journey)
Paso 1: Enfoque (Focus)
El usuario selecciona un objeto (clic en el ISK o en el Canvas de Indra). El UCI se despliega y realiza un "Handshake" con el objeto para leer su Contract.
Paso 2: Configuración de Origen (Sourcing)
Si el objeto requiere datos, el usuario abre la sección de Bóveda. El UCI llama al OMD-12, el usuario elige una tabla de Notion. El UCI confirma la lectura del esquema.
Paso 3: Definición de Reacción (Mapping)
El usuario quiere que el objeto reaccione al dato. Abre la sección de Manifestación. El UCI llama al OMD-11. El usuario vincula Ventas a u_radius.
Paso 4: Validación y Persistencia
El UCI valida que la fórmula sea correcta. Si hay un error (ej: intentas mapear un texto a un radio), el UCI bloquea el botón de "Aplicar" y resalta el error en rojo. Al confirmar, envía el paquete USSP al Core.
5. JSON del Artefacto: view_context_inspector
code
JSON
{
  "omd_05": {
    "id": "view_context_inspector",
    "clase_ui": "CONTEXT_ORCHESTRATOR",
    "polymorphic_modes": ["SPATIAL_ENTITY", "LOGIC_NODE", "AI_AGENT", "SYSTEM_CONFIG"],
    "host_capabilities": {
      "can_inject_modules": true,
      "supports_ussp_protocol": true,
      "real_time_validation": true
    },
    "layout_structure": {
      "header": "entity_identity_manager",
      "sections": [
        { "id": "identity", "module": "OMD_01_02_BRIDGE" },
        { "id": "vault", "module": "OMD_12_RESOURCE_BROWSER" },
        { "id": "schema", "module": "SCHEMA_ASSISTANT" },
        { "id": "manifest", "module": "OMD_11_REACTIVE_MAPPER" }
      ],
      "footer": "integrity_commit_bar"
    }
  }
}
6. Análisis de Ergonomía Cognitiva (Auditoría de Valor)
Unificación de la Curva de Aprendizaje: El usuario solo tiene que aprender a usar un panel para controlar todo el sistema. La ubicación de los controles es predecible.
Reducción del Ruido Visual: Al ser polimórfico, el UCI solo muestra lo que es relevante para el objeto seleccionado. No hay 50 sliders inútiles si estás configurando una base de datos.
Seguridad Operativa: Al centralizar la validación en el UCI, evitamos que datos corruptos viajen al Core o al ISK. El UCI es el "Aduanero" del sistema.