# ADR_017 — COGNITIVE BUSINESS PROCESSES: Integración de LLM en el Flujo Industrial

> **Versión:** 1.0  
> **Estado:** PROPUESTO  
> **Relacionado con:** [ADR_012 (MCEP)](./ADR_012_MCEP.md), [ADR_016 (Tríptico)](./ADR_016_AGENTIC_WORKSPACE_MODEL.md)

---

## 1. CONTEXTO Y NECESIDAD

Tras la implementación del protocolo MCEP para interacción hombre-máquina, se identifica la necesidad de escalar la capacidad cognitiva hacia la **automatización desatendida**. En un entorno de negocio, la IA no debe ser solo un interlocutor, sino un **nodo de procesamiento** dentro de un grafo de ejecución (Workflow).

El reto principal es la **No-Determinismo** de los LLMs frente a la **Sinceridad de Datos** requerida por el Core de INDRA (Ley de Aduana).

---

## 2. ARQUITECTURA TÉCNICA (BACKEND)

### 2.1 El Protocolo `TRANSFORM_COGNITIVE`
Se establece una nueva operación dentro de la capa de lógica (`provider_pipeline`):
- **Definición:** Transformación de una colección de átomos mediante inferencia semántica dirigida por contrato.
- **Mecanismo:** El `workflow_executor` segmenta la carga en ráfagas (Bursts) y delega al `SovereignIntelligenceProvider` la tarea de procesar cada átomo bajo un `CognitiveProjector` (Prompt + JSON Schema).

### 2.2 Blindaje de la Ley de Aduana (Safe Output)
Para garantizar que el no-determinismo de la IA no comprometa la **Sinceridad de Datos**:
1. **Schema Enforcing:** Cada nodo cognitivo **debe** declarar un contrato de salida (`projection_schema`).
2. **Validation Layer:** El Core recibe el texto crudo, lo parsea como JSON y **poda** cualquier campo que no esté en el contrato original.
3. **Mapeo Sincero:** Los valores extraídos se inyectan estrictamente en `payload.fields`, preservando la identidad del átomo original pero enriquecida con metadatos de "Origen Cognitivo".

---

## 3. BLUEPRINT DE UI (FRONTEND - AGENCIA)

El módulo cognitivo se manifiesta como una **CognitiveStationCard** (StationCard) dentro de la Columna II (Agencia), siguiendo la estética de "Hardware de Software".

### 3.1 Estructura Visual del Chassis (No SVGs)
Basado íntegramente en `IndraIcons.jsx` y CSS puro:
- **Header:**
    - `DragHandle`: Patrón de puntos mono para reordenar en el DAG.
    - `Signifier_Icon`: `IndraIcon name="COGNITIVE"` con pulso de resonancia violeta (`var(--color-accent)`).
    - `EditableLabel`: Nombre del nodo (Ej: "Análisis de Sentimiento").
    - `Badge`: Muestra el modelo activo (Flash / Analyst / DeepSeek).
- **Body Contextual:**
    - `Input_Port`: Un `SlotSelector` que indica de dónde vienen los datos (Ej: `Step_1.document_text`).
    - **Prompt_DNA (Textarea Terminal):** Editor con fuente mono y sintaxis resaltada para las instrucciones del sistema. Soporta placeholders dinámicos `{{campo}}`.
    - **Contract_View (Projection):** Lista de badges que representan los campos que la IA "prometió" extraer.
- **Footer Operativo:**
    - `Model_Tier_Selector`: Toggle elegante para cambiar entre "Respuesta Veloz" (Tier-2) y "Análisis Profundo" (Tier-1).
    - `Temperature_Dial`: Slider minimalista para controlar la creatividad.
    - `IndraActionTrigger`: Botón "PULSE" (Hold to test) para ejecutar una inferencia de prueba.

### 3.2 Estados de Resonancia Cognitiva
- **IDLE:** Borde gris 1px, opacidad 0.7. Materia inerte.
- **SENSING:** Borde animado (violeta), icono rotando suavemente. El sistema está enviando el prompt al oráculo.
- **SETTLED:** Brillo verde tenue en el icono. El contrato ha sido cumplido y los campos están disponibles para el siguiente Step.

---

## 4. FLUJO DE USABILIDAD (EL "MÉTODO INDRA")

1. **Reclutamiento:** El usuario arrastra un Átomo de la Columna I (Potencia) al nodo Cognitivo.
2. **Programación del Deseo:** El usuario define el prompt en el `Prompt_DNA`.
3. **Definición del Contrato:** Se añaden los campos esperados (Ej: "monto", "fecha", "cliente"). Estos campos se vuelven **Variables de Salida** disponibles para el resto del Workflow.
4. **Ignición:** Se activa el `PULSE`. El motor de workflows valida que el LLM esté entregando datos sinceros según la Ley de Aduana.
5. **Cosecha:** Los resultados fluyen a la Columna III (Manifestación) o a un silo externo.


---

## 4. GESTIÓN DE RECURSOS (TIERING & BURST)

1. **Model Tiering Dinámico:** 
   - Procesos de clasificación simple → **Gemini Flash / Llama 8B**.
   - Procesos de síntesis estratégica → **Llama 70B / GPT-4**.
2. **Backpressure Control:** El motor de workflows monitoreará el consumo de tokens para evitar bloqueos de API en procesos batch de gran volumen.

---

## 5. REGLAS DE ORO PARA NEGOCIO

- **Nada entra al Core sin contrato:** Ninguna salida de IA se guarda si no cumple con la estructura de `Atomo`.
- **Auditoría de Razonamiento:** Cada átomo procesado por IA debe guardar una traza de su "procedencia cognitiva" en metadatos para futura fiscalización humana.
