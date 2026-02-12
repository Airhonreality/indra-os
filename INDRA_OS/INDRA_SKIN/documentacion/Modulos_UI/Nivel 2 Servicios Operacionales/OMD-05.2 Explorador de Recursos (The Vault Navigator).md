Blueprint OMD-05.2: Explorador de Recursos (The Vault Navigator)
1. Identificación y Alcance (ID & Context)
ID Técnico: module_resource_browser
Nombre Funcional: Explorador de Recursos (The Vault Navigator).
Naturaleza: Sub-módulo de Navegación (Hospedado en la sección "Where" del OMD-05).
Primitiva Vinculada: googleDriveRest / notionAPI / fileSystem.
Axioma de Diseño: "Navegar es descubrir; fijar es colonizar."
2. Anatomía y Distribución de la Interfaz (Micro-UX)
El 05.2 debe sentirse como un explorador de archivos nativo, pero comprimido en el ancho del Inspector.
A. Barra de Migas de Pan (Breadcrumbs)
Ruta Dinámica: Permite retroceder niveles rápidamente (ej: Drive > Proyectos > INDRA > Bóvedas).
Selector de Raíz: Icono para cambiar entre orígenes (Drive, Notion, Shared with me).
B. El Área de Navegación (The List View)
Lista de Items: Filas de alta densidad con iconos específicos (Carpeta, Tabla, Documento, JSON).
Buscador Interno: Filtro rápido para encontrar un archivo dentro de la carpeta actual.
Estado de Carga: Skeleton screens o "Ghost items" mientras el Core (GAS) responde con la lista de archivos.
C. El Botón de Anclaje (The Fix Action)
Acción: "Fijar como Bóveda".
Efecto: Al hacer clic, el ID del recurso seleccionado se inyecta en el selected_vault_id del nodo. El explorador se colapsa y da paso al siguiente paso (Schema Assistant).
3. Comportamiento Camaleónico (Contextual Browsing)
El 05.2 cambia su "lente" según el tipo de nodo que lo invoca:
Si el nodo es Google Drive: Muestra carpetas y archivos .csv o .json.
Si el nodo es Notion: Muestra el árbol de Páginas y Bases de Datos.
Si el nodo es un "Asset Manager" (ISK): Muestra la biblioteca de texturas, modelos 3D y SVGs.
4. Ciclo de Uso y Reprocesos (User Journey)
Paso 1: Apertura de Bóveda
El usuario llega al Paso 2 del Inspector (OMD-05). El sistema le pregunta: "¿Dónde están los datos?". El 05.2 se despliega mostrando la raíz de su cuenta vinculada.
Paso 2: Exploración
El usuario navega por las carpetas. El 05.2 hace llamadas asíncronas al Core: google.script.run.getFolderContent(id). La lista se actualiza sin refrescar el panel.
Paso 3: Selección y Validación
El usuario selecciona una carpeta llamada "Ventas_2024". El 05.2 verifica si el usuario tiene permisos de escritura/lectura. Si todo es correcto, el botón "Fijar Bóveda" se ilumina en verde.
Paso 4: Cierre de Contexto
Al fijar la bóveda, el 05.2 envía el ID al Core. El Core responde con el Esquema (Schema) de esa carpeta. El 05.2 se oculta y el Inspector abre automáticamente el siguiente módulo para mapear los campos.
5. JSON del Artefacto: module_resource_browser
code
JSON
{
  "omd_05_2": {
    "id": "module_resource_browser",
    "parent": "view_context_inspector",
    "capabilities": {
      "multi_source": ["DRIVE", "NOTION", "LOCAL", "API"],
      "search_mode": "SERVER_SIDE",
      "selection_type": "SINGLE_RESOURCE"
    },
    "ui_states": {
      "browsing": "LIST_VIEW",
      "loading": "SKELETON_PULSE",
      "error": "RETRY_BANNER"
    },
    "events": {
      "onSelect": "UPDATE_VAULT_ID",
      "onFix": "TRIGGER_SCHEMA_DISCOVERY"
    }
  }
}
6. Análisis de Ergonomía Cognitiva (Auditoría de Valor)
Reducción de la Incertidumbre: Al permitir navegar visualmente por Drive o Notion dentro de Indra, el usuario no tiene que copiar y pegar IDs largos y complejos.
Prevención de Errores de Ruta: El sistema solo permite "Fijar" recursos que son compatibles con el nodo actual. Si el nodo espera una tabla, el 05.2 deshabilita la selección de archivos de imagen.
Continuidad de Flujo: El paso de "Navegar" a "Fijar" y luego a "Mapear" es una línea recta. El usuario siente que está "conectando tuberías" de forma física.