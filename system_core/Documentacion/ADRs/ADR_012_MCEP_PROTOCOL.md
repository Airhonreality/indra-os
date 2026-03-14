# [ADR-012] Arquitectura de Agentes Operativos vía Protocolo MCEP

**Estado:** Propuesto  
**Fecha:** 2026-03-13  
**Autor:** Antigravity (Indra AI Architect)

---

## 1. Contexto y Problema

Indra ha evolucionado de un sistema de gestión de datos a un ecosistema de diseño y ejecución. La interacción actual con la IA es predominantemente conversacional ("Chat-based"), lo que limita la capacidad de la inteligencia para operar los motores internos (Drive, Notion, Schema Engine) sin una intervención humana constante y técnica.

El problema radica en el **Cognitive Bloat** (Saturación Cognitiva): enviar todo el contexto del sistema a la IA es costoso, lento y propenso a errores. Necesitábamos un protocolo que permitiera a la IA tener "Ojos" (Sensing) y "Manos" (Execution) de forma ligera, agnóstica y soberana.

## 2. Decisión Arquitectónica: Protocolo MCEP

Hemos decidido implementar el **Model Cognitive Execution Protocol (MCEP)**. Este protocolo no es un simple conjunto de funciones, sino un lenguaje de interacción entre la intención de la IA y la realidad operativa de Indra.

### 2.1. Anatomía del Sistema MCEP

El sistema se divide en cuatro módulos desacoplados siguiendo el **Axioma de Independencia de Suh**:

1.  **Sensing Layer (Los Ojos)**:
    - **Discovery Tree**: Un mapa jerárquico de capacidades. La IA no conoce todas las funciones al inicio; las descubre navegando por categorías (ej. `SYSTEM.DRIVE`, `LOGIC.BRIDGE`).
    - **Resource Provider**: Endpoints especializados que permiten a la IA "leer" materia (ej. archivos MD, tablas de Notion) solo cuando el razonamiento lo requiere.

2.  **Sovereign Intelligence (El Cerebro)**:
    - **Agnostic LLM Provider**: Un adaptador en el cliente que permite intercambiar el modelo (Gemini Pro para razonamiento, Groq/Llama para ejecución rápida) sin cambiar el código de Indra.
    - **Prompt Maestro**: Instrucciones de sistema que definen el "Modo Agente", prohibiendo la alucinación de comandos y obligando al uso de herramientas.

3.  **MCEP Bridge (El Sistema Nervioso)**:
    - Interceptor de bloques de intención (`call: action`).
    - Traductor de intenciones semánticas a directivas técnicas (UQO).
    - Validador de esquemas: Asegura que los parámetros enviados por la IA cumplan con el contrato del motor destino.

4.  **Execution Layer (Las Manos)**:
    - **Directive Executor**: El canal universal ya existente en Indra, ahora activado por la IA.
    - **Feedback Loop**: El sistema siempre devuelve una "Ley de Retorno" a la IA (ej. "Success: ID_123"), permitiendo que la IA encadene ciclos de operación.

---

## 3. Axiomas de Diseño (Filosofía SUH)

El diseño de MCEP se rige por los dos axiomas fundamentales de la Ingeniería Axiomática:

*   **Axioma 1: Independencia Funcional**: Los requisitos de inteligencia (el "qué" quiere hacer la IA) se mantienen independientes de la implementación técnica (el "cómo" el Core GAS ejecuta la acción). Cambiar el motor de Drive no rompe la capacidad de la IA de pedir una lectura.
*   **Axioma 2: Mínima Información**: Reducimos el contenido de información del prompt. No enviamos el código de la función, enviamos su **Firma Semántica**. La IA solo recibe la información que necesita para el siguiente paso lógico.

---

## 4. Estrategias de Mitigación de Latencia

La latencia agnóstica (inherente al uso de LLMs) se combate mediante:

1.  **Hydration Proactiva**: El frontend "pre-carga" las capacidades más probables del usuario en el contexto inicial del agente.
2.  **Speculative Discovery**: Si el usuario menciona "Notion", el sistema inyecta automáticamente las herramientas de Bridge sin esperar a que la IA las pida.
3.  **Parallel Execution (Streaming)**: El sistema empieza a procesar una directiva en cuanto detecta el bloque de llamada en el flujo de texto, sin esperar a que la IA termine de "hablar".

---

## 5. Mejores Prácticas y Restricciones

### Mejores Prácticas
*   **Sinceridad Semántica**: Las herramientas deben nombrarse por su intención de negocio (`search_customer_specs`) no por su nombre técnico (`drive_file_search_v2`).
*   **Atomicidad**: Cada llamada de la IA debe realizar una única acción clara y reversible.
*   **Verificación de Identidad**: Toda acción agéntica debe portar el `handle` del agente (ns: `ai_ops`, alias: `mcep_agent`).

### Restricciones
*   **No Code Execution**: La IA tiene prohibido generar código JS ejecutable. Solo puede invocar funciones pre-existentes en el Core.
*   **Sovereign Approval**: Para acciones críticas (borrado de datos, envío de correos masivos), el sistema debe insertar un ciclo de aprobación humana en el chat.

---

## 6. Aprendizajes Clave

1.  **La IA es mejor buscando que recordando**: Es más eficiente darle un buscador de herramientas que un prompt de 30,000 palabras.
2.  **El Agnosticismo es Libertad**: Poder cambiar a modelos locales (Ollama/Llama) para tareas simples y usar modelos potentes (Gemini) para arquitectura ahorra costos y mejora la resiliencia.
3.  **Feedback Sincero**: Si una herramienta falla, el error debe ser legible para la IA (ej. "Error: Falta el campo 'cliente'"), permitiendo que ella misma se corrija en el siguiente ciclo.

---

> **Anotación de Indra**: Este protocolo convierte a Indra en un Sistema Operativo Vivo donde el usuario diseña la intención y la IA orquesta la realidad.
