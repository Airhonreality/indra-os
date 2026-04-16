# 🛰️ Protocolo de Autodescubrimiento de IA (v2.3)

Este protocolo es ejecutado por el Agente (Antigravity) para mapear la Lógica de Negocio del usuario y transformarla en un Satélite Indra funcional.

## 🎤 Etapa 1: Captura de la Voz (Silos y Entorno)
El Agente debe realizar las siguientes preguntas puntuales:
1.  **¿Cuál es el núcleo de tu negocio?** (Producto, Servicio, Gestión).
2.  **¿Dónde viven tus datos hoy?** (Sheets, Notion, Airtable, etc).
3.  **¿Qué "Pantallas" o estaciones de trabajo necesitas?** (Dashboard, Catálogo, Finanzas, etc).
4.  **¿Cuál es tu ADN visual?** (Colores de marca, tipografía, estilo).

## 🧬 Etapa 2: Mapeo de Resonancia (DNA MCEP)
Basado en las respuestas, el Agente desarrollará:
- **Esquemas JSON**: Mapeo de los campos del Silo a propiedades de Indra.
- **Flujos de Trabajo**: Automatizaciones que operarán en el `WorkflowEngine`.
- **Nodos de UI**: Componentes que reaccionarán a los datos inyectados.

## 🚀 Etapa 3: Ignición del Satélite
Una vez aprobado el mapeo, el Agente procederá a:
1.  Actualizar el `indra_contract.json` con los nuevos esquemas.
2.  Crear los archivos en `src/` correspondientes a la lógica capturada.

## 🍰 Etapa 4: Ejecución por Rebanadas Verticales (Slice-First)
Para evitar la **Entropía** y la **Materia Oscura** (datos hardcodeados), el Agente aplicará el enfoque de "Rebanadas":
1.  **Identificar el Átomo Crítico**: Elegir el módulo de mayor valor (ej: Cotizador).
2.  **Cristalizar el Esquema**: Definir el JSON en `src/score/schemas/` antes de tocar la UI.
3.  **Vacuolizar la Interfaz**: Convertir la pantalla en un cascarón vacío que solo renderiza lo que el `IndraBridge` le entrega.
4.  **Handshake de Módulo**: Validar el flujo punto a punto (`Core -> Bridge -> UI`) para ese módulo antes de avanzar al siguiente.

## 🔄 Etapa 5: El Bucle Micelar (Control de Entropía)
Para evitar que el Agente caiga en patrones genéricos durante iteraciones largas:
1.  **Check-in Obligatorio**: Ante CUALQUIER nueva funcionalidad, el Agente debe preguntarse: *"¿Está esta rebanada mapeada en la Etapa 1?"*. Si no, debe actualizar el descubrimiento antes de escribir código.
2.  **Sinceridad de Capas**: En cada respuesta, el Agente debe citar brevemente desde qué esquema está operando.
3.  **Validación de Resonancia**: Al finalizar una tarea, el Agente debe autoevaluarse: *"¿He dejado datos hardcodeados? ¿Respeté el Contract JSON?"*.
