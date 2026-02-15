# Matriz de Arquitectura INDRACore Codex v1

Este documento define la matriz estructural del sistema, detallando el propósito, axiomas y dependencias de los artefactos críticos, comenzando por las capas fundacionales (0 y 1).

## Capa 0: Entrypoints (Puntos de Entrada y Ensamblaje)

La capa de "Entrypoints" gestiona cómo el mundo exterior interactúa con el sistema (HTTP, Triggers, Time-based) y cómo el sistema se ensambla a sí mismo.

| Archivo | Rol | Objetivo (El "Por qué") | Axiomas (Reglas de Diseño) | Dependencias Clave | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SystemAssembler.gs** | 🏭 Factory | Centralizar la creación y ensamblaje de la pila de ejecución (Stack). Inyecta dependencias para evitar acoplamiento fuerte. | **Agnosticismo de Dependencias:** Ningún módulo instancia a otro directamente. **Inmutabilidad:** El Stack ensamblado es inmutable. | `System_Constitution`, `Configurator`, `ErrorHandler`, `Todos los Adapters/Services` | 🟢 Estable (V7.0) |
| **AsyncHandler.gs** | ⚡ Trigger | Manejar ejecuciones asíncronas (Jobs) y disparadores de tiempo (Heartbeat). Implementa el patrón "Boomerang" para escalabilidad. | **Resiliencia:** Debe capturar errores catastróficos sin detener el runtime de Apps Script. **Boomerang:** Callbacks rápidos (<30s). | `PublicAPI`, `JobQueueService`, `MetabolicService` | 🟢 Estable |
| **HttpEntrypoint.gs** | 🌐 Gateway | Punto de entrada para peticiones Web (doGet, doPost). Enruta peticiones externas hacia la `PublicAPI`. | **Seguridad de Frontera:** Validación de tokens antes de invocar nada. **Normalización:** Convierte payloads HTTP en objetos estándar. | `SystemAssembler`, `PublicAPI` | 🟡 Infrerido (Estándar) |
| **AsyncHandler.spec.js** | 🧪 Test | Validar la lógica de disparadores y manejo de reintentos. | **Cobertura:** Probar escenarios de éxito y fallo en triggers. | `AsyncHandler`, `Mocks` | ⚪ Test |
| **HttpEntrypoint.spec.js** | 🧪 Test | Validar el enrutamiento y códigos de respuesta HTTP. | **Independencia:** Mockear `doPost`/`doGet`. | `HttpEntrypoint`, `Mocks` | ⚪ Test |

## Capa 0: Laws (Leyes y Constitución)

La capa de "Laws" define la verdad inmutable del sistema. Configuración, constantes, contratos y esquemas que gobiernan el comportamiento de todas las otras capas. **Código Pasivo**.

| Archivo | Rol | Objetivo (El "Por qué") | Axiomas (Reglas de Diseño) | Dependencias Clave | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **System_Constitution.gs** | 📜 Ley Suprema | Definir la topología física (Drive, Sheets), el registro de componentes (Identidad) y los límites operativos del sistema. | **Verdad Única:** No existen "números mágicos" fuera de este archivo. **Identidad Soberana:** Define roles y dominios. | *Ninguna* (Es la raíz de verdad) | 🟢 Estable (V5.5-AXIOM) |
| **Contracts_Registry.gs** | 📑 Contratos | Definir las interfaces (inputs/outputs) esperadas para cada capacidad del sistema. | **Contrato Explícito:** Todo método público debe tener firma. | *Ninguna* | 🟢 Estable |
| **Logic_Axioms.gs** | 🧠 Lógica | Definir reglas de negocio de alto nivel y constantes lógicas (ej. umbrales de afinidad, prioridades). | **Declarativo:** Reglas separadas de la implementación. | *Ninguna* | 🟢 Estable |
| **System_Hierarchy.gs** | 🌳 Topología | Definir la estructura jerárquica de subsistemas y relaciones de parentesco. | **Orden:** Define quién reporta a quién. | *Ninguna* | 🟢 Estable |
| **Spatial_Physics.gs** | 🌌 Física | Definir leyes de persistencia espacial y renderizado visual (coordenadas, dimensiones por defecto). | **Consistencia Visual:** Unidades estándar para UI. | *Ninguna* | 🟢 Estable |
| **Visual_Grammar.gs** | 🎨 Estilo | Definir tokens de diseño, colores y tipografía para el sistema de UI. | **Coherencia Estética:** Estilos centralizados. | *Ninguna* | 🟢 Estable |
| **State_Laws.gs** | 💾 Estado | Definir máquinas de estado y transiciones permitidas (ej. ciclo de vida de un Job). | **Determinismo:** Transiciones de estado finitas. | *Ninguna* | 🟢 Estable |
| **Action_Protocols.gs** | ⚡ Protocolos | Definir secuencias de acciones estandarizadas para operaciones comunes. | **Estandarización:** Reutilización de flujos lógicos. | *Ninguna* | 🟢 Estable |
| **Cognitive_Prompts.gs** | 🤖 Prompts | Centralizar las instrucciones base (system prompts) para los agentes de IA (Arquitecto, etc.). | **Soberanía Cognitiva:** Prompts versionados como código. | *Ninguna* | 🟢 Estable |
| **UI_Distribution.gs** | 🖥️ Layout | Definir la distribución de componentes en la interfaz de usuario (Slots, Perspectivas). | **Flexibilidad:** Layout definido por datos, no hardcodeado. | *Ninguna* | 🟢 Estable |
| **Contract_Blueprints.gs** | 📐 Planos | Plantillas base para la creación de nuevos contratos o artefactos. | **Consistencia:** Nuevos módulos siguen patrones predefinidos. | *Ninguna* | 🟢 Estable |

## Capa 1: Core (Núcleo Lógico y Orquestación)

La capa "Core" es el cerebro activo. Contiene la lógica de negocio pura, la orquestación de flujos y la API pública.

| Archivo | Rol | Objetivo (El "Por qué") | Axiomas (Reglas de Diseño) | Dependencias Clave | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CoreOrchestrator.gs** | 🎻 Orquestador | Ejecutar flujos de trabajo (Flows), coordinando nodos y gestionando el estado global. Implementa el patrón H7. | **Renderizado Centralizado (Axioma 1):** Todo payload pasa por `RenderEngine`. **Dual Path (Axioma 2):** Trato diferenciado para nodos especiales. **Inmutabilidad (Axioma 3):** Contexto nunca mutado. | `RenderEngine`, `FlowCompiler`, `ErrorHandler`, `NodesRegistry` | 🟢 Estable (H7) |
| **PublicAPI.gs** | 🚪 Fachada | Exponer las capacidades del sistema de forma segura y controlada al mundo exterior y a la UI. | **Whitelist (Seguridad):** Solo métodos permitidos pasan. **Abstracción:** Oculta la complejidad interna del stack. | `CoreOrchestrator`, `FlowRegistry`, `Gatekeeper`, `MCEPService` | 🟢 Estable (V7.0) |
| **IntelligenceOrchestrator.gs** | 🧠 IA | Gestionar la interacción con LLMs y la toma de decisiones cognitivas complejas. | **Soberanía Lógica:** La IA propone, el sistema dispone (via Gatekeeper). | `LLMAdapter`, `MCEPService`, `Gatekeeper` | 🟡 Evolución |
| **SchemaRegistry.gs** | 🛡️ Validación | Centralizar y validar esquemas JSON para inputs y outputs de todos los módulos. | **Integridad Estructural:** Nada entra al Core sin validación. | `System_Constitution` (Leyes) | 🟢 Estable |
| **FlowCompiler.gs** | ⚙️ Compilador | Transformar definiciones de flujo abstractas (JSON/Topología) en pasos ejecutables secuenciales. | **Determinismo Topológico:** Convierte grafos en secuencias lineales seguras. | `SchemaRegistry` | 🟢 Estable |
| **SystemInitializer.gs** | 🚀 Boot | Gestionar el primer arranque del sistema, creación de carpetas en Drive y configuración inicial. | **Idempotencia:** Ejecutar N veces no rompe nada, solo repara/asegura estado. | `DriveAdapter`, `Configurator`, `TokenManager` | 🟢 Estable |
| **TokenManager.gs** | 🔑 Seguridad | Gestionar secretos, claves API y tokens de acceso de manera segura (con encriptación opcional). | **Privacidad:** Secretos fuera del código. **Rotación:** Capacidad de actualizar tokens. | `CipherAdapter`, `DriveAdapter` (para persistencia segura) | 🟢 Estable |
| **MCEP_Core.gs** | 🧩 Inferencia | Motor de Inferencia de Capacidades (MCEP). Descubre qué herramientas están disponibles para la IA. | **Auto-descubrimiento:** No hardcoding de herramientas disponibles. | `NodesRegistry`, `Laws` | 🟢 Estable |

## Capa 2: Services (Lógica de Negocio y Utilidades)

Esta capa contiene servicios especializados que implementan lógica de negocio reutilizable, orquestación de datos y utilidades puras. No interactúan directamente con el mundo exterior (eso es para Adapters) ni definen leyes (eso es para Laws).

| Archivo | Rol | Objetivo (El "Por qué") | Axiomas (Reglas de Diseño) | Dependencias Clave | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FlowRegistry.gs** | 📚 Librería | Gestionar el ciclo de vida de los flujos (Flows) JSON: lectura, escritura, cacheo y listado. | **Lazy Loading:** No conecta con Drive hasta que es estrictamente necesario. **Soberanía de Cache:** Usa `CacheService` para minimizar I/O lento. | `DriveAdapter`, `Configurator`, `CacheService` | 🟢 Estable (V5.5) |
| **JobQueueService.gs** | ⏳ Cola | Gestionar la ejecución asíncrona robusta. Encolamiento, reclamo atómico y reintento de tareas. | **Resiliencia (Boomerang):** Garantizar que ningún trabajo se pierda. **Atomicidad:** Uso de `LockService` para evitar condiciones de carrera. **No-Database:** Usa Sheets como persistencia transitoria. | `SheetAdapter`, `MonitoringService`, `LockService` | 🟢 Estable (Boomerang) |
| **ProjectionKernel.gs** | 📽️ Proyector | Destilar la complejidad del sistema para el Frontend (Satélite). Genera el "mapa" de qué puede hacer el sistema. | **Seguridad por Diseño:** Enmascara secretos automáticamente. **Proyección Explícita:** Solo expone lo que tiene contrato y no es interno. | `Configurator`, `Laws` | 🟢 Estable (AXIOM L2048) |
| **RenderEngine.gs** | 🎨 Render | Motor de sustitución de variables (Placeholders `{{...}}`) en textos y objetos. | **Pureza Funcional:** Sin efectos secundarios, solo input -> output. **Recursividad:** Resuelve anidamientos profundos. | *Ninguna* (Pura Lógica) | 🟢 Estable |
| **MonitoringService.gs** | 👁️ Vigía | Centralizar logs, alertas y métricas de salud del sistema. | **Fail-Fast:** Si no puede loguear, no detiene el sistema principal (salvo errores críticos). | `SheetAdapter`, `EmailAdapter` | 🟢 Estable |
| **MetabolicService.gs** | 🧹 Janitor | Mantenimiento automático: limpieza de jobs zombie, compactación de logs. | **Silencio:** Opera en segundo plano sin interrumpir flujos. | `JobQueueService`, `SheetAdapter` | 🟢 Estable |
| **FlowControlService.gs** | 🔀 Lógica | Proveer primitivas de control de flujo (If, Loop, Switch) para el orquestador. | **Agnosticismo:** No conoce el contenido de los datos, solo evalúa condiciones. | *Ninguna* | 🟢 Estable |
| **CollectionService.gs** | 🧩 Utils | Manipulación avanzada de Arrays y Objetos (filtrado, mapeo, reducción). | **Eficiencia:** Algoritmos optimizados para GAS. | *Ninguna* | 🟢 Estable |
| **TextService.gs** | 📝 Utils | Manipulación de cadenas, sanitización y formatos. | **Pureza:** Funciones sin estado. | *Ninguna* | 🟢 Estable |
| **MathService.gs** | 🧮 Utils | Cálculos matemáticos y estadísticos seguros. | **Precisión:** Manejo consistente de números. | *Ninguna* | 🟢 Estable |
| **DateService.gs** | 📅 Utils | Manejo y formateo de fechas consistente (ISO 8601). | **Estandarización:** Todo el sistema usa el mismo reloj lógico. | *Ninguna* | 🟢 Estable |

## Capa 3: Adapters (Conectores con el Mundo Exterior)

Los adaptadores aíslan al núcleo de los detalles de implementación de las APIs externas. Siguen el patrón de diseño "H7" o "Standard Adapter", traduciendo contratos internos a llamadas externas.

| Archivo | Rol | Objetivo (El "Por qué") | Axiomas (Reglas de Diseño) | Dependencias Clave | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **NotionAdapter.gs** | 🔌 Notion | Interfaz completa con la API de Notion. Maneja Bases de Datos, Páginas y Bloques. | **Barrera de Aislamiento:** Aplana estructuras complejas de Notion en lectura, las enriquece en escritura. **Unificación:** `_notionRequest` centralizado. | `TokenManager`, `UrlFetchApp` | 🟢 Estable (H7) |
| **LLMAdapter.gs** | 🧠 IA | Interfaz agnóstica para modelos de lenguaje (Gemini, Groq, OpenAI). | **Enrutamiento Inteligente:** Elige el modelo/proveedor óptimo dinámicamente. **Soberanía Cognitiva:** No depende de un solo vendor. | `TokenManager`, `UrlFetchApp` | 🟢 Estable |
| **DriveAdapter.gs** | 💾 Drive | Abstracción del sistema de archivos de Google Drive. | **Idempotencia:** Crear carpeta si no existe. **Resolución de Rutas:** Maneja paths tipo UNIX (`/folder/subfolder`). | `DriveApp` | 🟢 Estable |
| **SheetAdapter.gs** | 📊 Sheets | Abstracción de bases de datos sobre Google Sheets. Lectura/Escritura optimizada. | **Batch Operations:** Minimiza llamadas a la API de Sheets (lectura/escritura por bloques). | `SpreadsheetApp` | 🟢 Estable |
| **EmailAdapter.gs** | 📧 Correo | Envío de correos electrónicos transaccionales y alertas. | **Simplicidad:** Interfaz simplificada sobre `GmailApp`. | `GmailApp` | 🟢 Estable |
| **CalendarAdapter.gs** | 📅 Calendar | Gestión de eventos y recordatorios en Google Calendar. | **Sincronización:** Manejo de estado de eventos. | `CalendarApp` | 🟢 Estable |
| **GoogleDocsAdapter.gs** | 📄 Docs | Manipulación programática de documentos Google Docs. | **Renderizado:** Inyección de contenido en plantillas. | `DocumentApp` | 🟢 Estable |
| **GoogleSlidesAdapter.gs** | 🖼️ Slides | Creación y manipulación de presentaciones. | **Integración Visual:** Manipulación de layouts y textos. | `SlidesApp` | 🟢 Estable |
| **GoogleFormsAdapter.gs** | 📝 Forms | Gestión de formularios y respuestas. | **Captura:** Lectura de respuestas estructuradas. | `FormApp` | 🟢 Estable |
| **GoogleDriveRestAdapter.gs** | ⚡ Drive API | Acceso de bajo nivel a Drive API (v3) para funciones no soportadas por `DriveApp` (ej. queries complejos). | **Potencia:** Bypass de limitaciones de GAS estándar. | `UrlFetchApp`, `TokenManager` | 🟢 Estable |
| **MapsAdapter.gs** | 🗺️ Geo | Servicios de geolocalización, rutas y distancias. | **Precisión:** Cálculos de logística y viajes. | `Maps` (GAS Service) | 🟢 Estable |
| **MessengerAdapter.gs** | 💬 Omni | Despachador unificado para mensajería (WhatsApp, Telegram, etc.). | **Polimorfismo:** Misma interfaz para distintos canales. | `WhatsAppAdapter`, `InstagramAdapter`, etc. | 🟢 Estable |
| **WhatsAppAdapter.gs** | 📱 Chat | Conector específico para API de WhatsApp Business. | **Tiempo Real:** Webhooks y envío de templates. | `UrlFetchApp` | 🟢 Estable |
| **InstagramAdapter.gs** | 📸 Social | Conector para Instagram Graph API. | **Engagement:** Publicación y respuesta de comentarios. | `UrlFetchApp` | 🟢 Estable |
| **TikTokAdapter.gs** | 🎵 Social | Conector para TikTok API. | **Tendencias:** Publicación de video. | `UrlFetchApp` | 🟢 Estable |
| **YouTubeAdapter.gs** |  ▶️ Video | Gestión de canales y videos de YouTube. | **Multimedia:** Upload y gestión de metadata. | `YouTube` (Advanced Service) | 🟢 Estable |
| **AudioAdapter.gs** | 🎤 Audio | Servicios de Speech-to-Text (STT) y Text-to-Speech (TTS). | **Accesibilidad:** Conversión bidireccional voz/texto. | `UrlFetchApp` (OpenAI/Google Cloud) | 🟢 Estable |
| **OracleAdapter.gs** | 🔮 Search | Motores de búsqueda y research web (Perplexity, Google Search). | **Veracidad:** Búsqueda de información externa actualizada. | `UrlFetchApp` | 🟢 Estable |
| **CognitiveSensingAdapter.gs** | 📡 Sensor | Adaptador experimental para "sentir" el entorno digital (cambios, notificaciones). | **Proactividad:** Disparadores basados en eventos. | *Varios* | 🟡 Experimental |
| **ISK_ProjectionAdapter.gs** | 🌌 3D | Adaptador para proyección espacial de información (Interfaz 3D/Canvas). | **Persistencia Espacial:** Guarda coordenadas y estado visual. | `DriveAdapter` (JSON storage) | 🟢 Estable |
| **LowFi_PdfAdapter.gs** | 📄 PDF | Generación simple de PDFs desde HTML o texto. | **Exportabilidad:** Reportes rápidos. | `DriveApp`, `Utilities` | 🟢 Estable |
| **MonitoringAdapter.gs** | 📈 Metrics | (Deprecado/Fusionado) Adaptador para sistemas de monitoreo externos. | **Observabilidad:** Integración con dashboards externos. | *Varios* | 🟡 Legacy |

## Capa 4: Infra (Infraestructura Transversal)

Componentes de bajo nivel que soportan la seguridad, configuración, manejo de errores y primitivas del sistema. Son agnósticos al negocio.

| Archivo | Rol | Objetivo (El "Por qué") | Axiomas (Reglas de Diseño) | Dependencias Clave | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Configurator.gs** | ⚙️ Config | Gestión centralizada de configuración (Key-Value). Maneja migraciones de claves legacy y secrets. | **Atomicidad:** Usa `LockService` para escrituras seguras. **Namespace:** Prefijos obligatorios (`INDRA_`) para evitar colisiones. | `PropertiesService`, `LockService` | 🟢 Estable |
| **ErrorHandler.gs** | 🛡️ Error | Fábrica universal de errores. Clasifica por severidad (`CRITICAL`, `WARNING`) y recuperabilidad. | **Circularidad Segura:** Sanitiza objetos circulares en los detalles del error. **Estandarización:** Todos los errores del sistema nacen aquí. | *Ninguna* | 🟢 Estable |
| **CipherAdapter.gs** | 🔐 Crypto | Proveer encriptación simétrica AES-256-CBC compatible con estándares web. | **Independencia:** Implementación pura de JS (con polyfill AES) para no depender de librerías externas inestables. | `Utilities`, `AES` (Polyfill) | 🟢 Estable |
| **KeyGenerator.gs** | 🆔 ID | Generación de identificadores únicos (UUID v4) y tokens aleatorios. | **Entropía:** Usa `Utilities.getUuid()` o generadores criptográficos. | `Utilities` | 🟢 Estable |
| **ConnectionTester.gs** | 🔌 Diag | Utilidad para verificar la salud de las conexiones a APIs externas y credenciales. | **Fail-Safe:** No lanza excepciones, retorna estados de salud (`ACTIVE`, `BROKEN`). | *Adapters* (Dinámico) | 🟢 Estable |
| **SimpleDialog.gs** | 💬 UI | Interfaz mínima para mostrar alertas y prompts en host Apps (Sheets/Docs/Slides). | **Contexto:** Detecta automáticamente el host activo (`SpreadsheetApp`, `DocumentApp`, etc.). | `UiApp` (Abstracted) | 🟢 Estable |
| **AES.gs** | 🧮 Algo | Polyfill de algoritmo AES en JavaScript puro. | **Compatibilidad:** Asegura criptografía robusta incluso si GAS `Utilities` tiene limitaciones de modo. | *Ninguna* | 🟢 Estable |

## Capa 5: Flows (Lógica de Negocio Declarativa)

Esta capa no contiene código ejecutable (.gs), sino **Definiciones de Flujo** (.flow.json) que residen en Google Drive. Representan la "programación visual" del sistema.

| Artefacto | Extensión | Rol | Objetivo | Estructura Clave | Gestionado Por |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Flow Definition** | `.flow.json` | 📜 Guion | Definir la secuencia de pasos, lógica de ramificación (if/switch) y mapeo de datos de un proceso de negocio. | `nodes` (pasos), `edges` (conexiones), `inputs` (contrato de entrada). | `FlowRegistry` (L2) |
| **Flow Schema** | `.schema.json` | 📐 Regla | Validar la integridad estructural de un archivo `.flow.json` antes de su ejecución. | JSON Schema Draft 7 (validado por `SchemaRegistry`). | `SchemaRegistry` (L1) |

## Capa 6: Tests (Aseguramiento de Calidad)

Suites de pruebas automatizadas que conforman la red de seguridad del proyecto.

| Archivo | Tipo | Objetivo |
| :--- | :--- | :--- |
| **RunAllTests.gs** | 🏃 Runner | Orquestador principal de pruebas. |
| **SystemIntegrity.spec.js** | 🔗 Integración | Verifica que el sistema bootea y los componentes se ven entre sí. |
| **Sovereignty_Tests.gs** | 🏰 Soberanía | Verifica que no existan dependencias ocultas o fugas de datos. |
| **MasterLaw_Alignment.spec.gs** | ⚖️ Legal | Verifica que el código cumpla con `System_Constitution.gs`. |
| **Integration_CoreSpatial.spec.js** | 🌌 Espacial | Valida la persistencia de nodos en el espacio virtual (ISK). |
| **Architect_StressTest...** | 🏋️ Stress | Pruebas de carga y manejo de situaciones tipo "Zero Speculation". |
| *[Component].spec.js* | 🧪 Unitario | Pruebas específicas para cada componente (ej. `CoreOrchestrator.spec.js`). |
| **_TestHelpers.gs** | 🛠️ Utils | Utilidades para mocks y aserciones en tests. |

## Capa 7: Diagnostics (Herramientas de Mantenimiento)

Herramientas operativas para debugging, reparación y auditoría en caliente.

| Archivo | Rol | Objetivo |
| :--- | :--- | :--- |
| **AdminTools.gs** | 🔧 Admin | Scripts de "God Mode" para resetear memoria, forzar migraciones o limpiar cerraduras. |
| **BootstrapLogger.gs** | 📝 BootLog | Logger inicial para el arranque del sistema antes de que el MonitoringService esté activo. |
| **ContractGatekeeper.gs** | 🛡️ Audit | Validador estático que asegura que los módulos cumplen sus contratos JSON definidos. |
| **debug_purity_forensics.gs** | 🕵️ Forense | Analiza efectos secundarios y violaciones de pureza funcional. |
| **MasterLaw_Alignment.gs** | ⚖️ Auditor | Script de ejecución para el chequeo de alineación legal. |
| **test_contract_discovery.gs** | 📡 Probe | Herramienta para visualizar qué contratos está exponiendo el sistema públicamente. |
| **ContractBuilder.gs** | 🏗️ Scaffold | Generador de código para crear nuevos servicios/adaptadores cumpliendo la norma. |

## Archivos Raíz y Configuración

| Archivo | Rol | Objetivo |
| :--- | :--- | :--- |
| **_Preload.gs** | ⚡ Boot | Carga inicial de polifills o configuraciones globales críticas. |
| **debug_gravity.js** | 🧪 Debug | Script de utilidad para debugging gravitacional (metafórico del sistema). |





