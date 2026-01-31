

. Diseño de "Componentes Camaleón" (Front-end Dinámico)
Tu front debe traducir la capa semántica a módulos.
Metodología: Diseño de Sistemas Generativos.
Aplicación:Aduitar la  librería de "UI Primitives" que el JSON pueda invocar (librerias laws del core).
Si el Core detecta una "Query", el Front activa automáticamente un módulo de "Data Table" con filtros.
Si el Core detecta un "Proceso Lógico", el Front activa un "Progress Stepper".
El objetivo ergonómico: Que el usuario sienta que la interfaz "se construye sola" a medida que define la lógica de negocio.

---
Abstracción de Layouts Anidados: Para las anidaciones HTML en el JSON, utiliza un sistema de "Slots". El usuario no escribe HTML, arrastra "Contenedores de Datos" hacia "Slots de Visualización".
--
Validación de Contratos IO: Implementa un "Linter Visual". Si el usuario compone un JSON que el Core no podrá interpretar (ej. falta una key requerida por Notion), la UI debe resaltar el error en el flujo antes de la ejecución. Esto se llama "Prevención de Errores por Diseño" (Donald Norman).

En la mayoría de las apps, el usuario se loguea y gestiona sus APIs dentro de cada flujo. En Orbital Core, esto se eleva a una capa de infraestructura superior para reducir la carga mental de mantenimiento.
El Concepto: Imagina a "Orbital" como una embajada. Tú no llevas tus credenciales de Google, Notion y Slack a cada habitación (cada flujo); las dejas en la Caja Fuerte (Vault) de la entrada.
Funcionamiento Ergonómico:
Separación de Concerns: La "Cuenta" es una entidad abstracta que contiene el Token y el Refresh Log.
Inyección de Identidad: Cuando diseñas un flujo (ej. "Enviar reporte de Sheets a Notion"), no configuras el login de Google. Simplemente seleccionas el objeto Account("Google_Personal").

 El "Scaffolding" (Andamiaje Semántico)
El Scaffolding es la técnica para resolver el problema de la "pantalla en blanco" y la incertidumbre en el diseño de flujos complejos. Es la visualización de la estructura del contrato antes de que los datos reales existan.
El Problema: El usuario está componiendo un JSON en el Front, pero no sabe si ese JSON "encajará" en el Core o cómo se verá en el Dashboard.
La Solución (Scaffolding):
Al recibir el JSON Semántico (el contrato), el Front en React genera una interfaz "fantasma" o de baja fidelidad.
Blueprint View: Si el JSON define un bloque de type: "table", el Front no espera a recibir los datos de Drive. Renderiza un esqueleto (skeleton screen) que muestra las columnas, el tipo de dato esperado y los botones de acción.
Valor para el Usuario: Permite la depuración visual dinámica. El usuario puede ver la "arquitectura" de su flujo de información sin necesidad de ejecutarlo. Es como ver los planos de una casa (Scaffolding) antes de poner los ladrillos (Datos).

---
Interfaz "Camaleónica" (Módulos Front Dinámicos)
Este es el nivel más alto de abstracción en tu proyecto. Significa que el Front-end no tiene páginas fijas, sino que se auto-ensambla basándose en la "naturaleza" del dato que el Core interpreta.
Cómo funciona: El Core no solo envía datos, envía Metadatos de Intención.
El Motor Camaleón:
Interpretación de Realidad: El Core analiza el flujo. Detecta que los datos provienen de un CRM (Notion) y van hacia un cálculo de comisiones (Sheets).
Etiquetado Semántico: El Core marca el JSON resultante con una "Naturaleza": nature: "analytical_transactional".
Mutación del Front (React): Al recibir el tag, el Front selecciona automáticamente los componentes:
Si es nature: "monitoring", el front prioriza gráficos y alertas.
Si es nature: "data_entry", el front prioriza formularios e inputs inteligentes.
Si es nature: "orchestration", el front muestra un diagrama de flujo interactivo.
Ejemplo Práctico:
Si conectas una API de Social Media (Twitter), el componente camaleón se convierte en un "Feed de Post".
Si conectas una API de Finanzas (Sheets), el mismo componente se transmuta en una "Hoja de Cálculo" o "Libro Contable".
¿Por qué es esto Ergonomía Cognitiva de Vanguardia?
Porque estamos aplicando el concepto de Affordances Percibidas. El usuario no tiene que aprender a usar 10 herramientas diferentes. Solo aprende a usar Orbital, y Orbital "se disfraza" de la herramienta que el usuario necesita en cada momento del flujo.



Como tesis doctoral en Ergonomía Cognitiva, mi objetivo es reducir la "distancia de evaluación" (el esfuerzo que hace el usuario para entender el estado del sistema).
Aquí presento la narrativa detallada del Scaffolding y la estructura técnica de la UI en formato JSON Semántico.
1. Narrativa de Scaffolding: El "Vuelo Fantasma" del Dato
Caso: Bot WhatsApp → LLM → Google Calendar
El Scaffolding no es una pantalla de carga; es una pre-visualización estructural que elimina la incertidumbre del usuario mientras diseña.
Paso 1: El Anclaje de Identidad (Vault Check):
El usuario arrastra el nodo "WhatsApp" al canvas. Al instante, el nodo emite un pulso visual rojo. El sistema detecta que no hay una API Key activa. El Scaffolding muestra un recuadro punteado (un "fantasma") en el panel lateral que dice: "Espacio reservado para Credenciales de Meta". El usuario hace clic, se loguea, y el fantasma se materializa en un check verde.
Paso 2: La Sombra del Dato (Schema Blueprint):
Sin que haya llegado ningún mensaje real, el nodo de WhatsApp proyecta una lista de variables "fantasma": {{sender_name}}, {{message_body}}, {{timestamp}}. Estas no tienen datos reales, pero el usuario ya puede arrastrarlas.
Paso 3: El Espejo de Intenciones (LLM Prompting):
El usuario conecta WhatsApp a un nodo LLM. El Scaffolding genera una ventana de "Prompt Dinámico". A medida que el usuario escribe: "Extrae la fecha de {{message_body}}", el sistema muestra en gris una simulación de lo que el LLM interpretaría: (Ej: "20 de Octubre" -> 2024-10-20). El usuario ve el resultado antes de que el bot esté vivo.
Paso 4: El Evento Fantasma (Output Render):
Al conectar el LLM al nodo de "Google Calendar", aparece en el panel de la derecha un calendario semitransparente. No es el calendario real del usuario, sino un Scaffolding UI. Si el usuario mueve un cable lógico, ve cómo un bloque de "Evento de Prueba" se posiciona en el martes a las 10:00 AM.
Paso 5: Validación del Contrato:
Si el usuario olvida mapear la "Duración del evento", el nodo de Calendar muestra un Scaffolding de advertencia: un campo vacío parpadeante que dice "Falta definición de tiempo". El usuario lo corrige y el "Vuelo Fantasma" se completa: ahora sabe que, cuando llegue un mensaje real, el flujo funcionará.



2. Narrativa Técnica del Scaffolding (Caso: Bot Agendamiento)
Desde la ergonomía cognitiva, el Scaffolding es una "pista de aterrizaje" para el dato. Así funciona paso a paso en tu app:
Inicialización de Estructura (Estado de Reposo):
El usuario arrastra al view_flow_editor un nodo de tipo "Entrada: WhatsApp" y otro de "Acción: Google Calendar". El sistema, mediante la primitiva SCHEMA_METADATA, detecta que Calendar requiere obligatoriamente start_time y summary.
Generación del Andamio (Scaffolding Visual):
Inmediatamente, en el nodo de Calendar, aparecen dos campos vacíos resaltados en amarillo. No hay datos, pero la interfaz ya "sabe" qué forma deben tener. Esto es el andamio: la interfaz se prepara para la llegada del dato.
Simulación de Mapeo (Andamio de Datos):
El usuario abre el view_ai_copilot y dice: "Extrae los datos de la cita del mensaje". El Asistente IA genera un JSON de prueba internamente. En el editor de flujos, aparecen líneas punteadas que conectan el nodo de WhatsApp con el de Calendar. Es una conexión fantasma.
Validación en Tiempo Real (Pre-vuelo):
En el panel view_ui_preview, aparece un mensaje de WhatsApp simulado a la izquierda y un cuadro de calendario a la derecha. El usuario ve cómo el texto "Cita mañana a las 5" se "mueve" visualmente por el andamio y rellena el hueco del calendario.
Consolidación (Materialización):
Una vez que el usuario ve que el andamio soporta el peso del dato simulado sin errores, pulsa "Publicar". El andamio desaparece y se convierte en una infraestructura de ejecución activa en el Core (GAS).