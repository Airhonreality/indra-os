# 🧘 AXIOMAS Y DHARMAS DE INDRA (v16.0-INDUSTRIAL)
### Constitución Existencial del Protocolo Satélite

Este documento es tu **Ley Primera**. Define la naturaleza de la realidad en Indra v16.0. Cualquier desviación genera corrupción de datos y fallo en la sincronización.

---

## 🏛️ AXIOMA 0: El Núcleo y la Malla (Paradigma Micelar)
**Indra no es un servidor central; es un organismo distribuido de Células Soberanas.**
*   **El Núcleo (Core):** Es el orquestador de resonancia. Gestiona la identidad y el despacho de protocolos, pero no posee el monopolio de los datos.
*   **La Célula (Workspace):** Cada Ledger es una célula autónoma y soberana. El acceso se realiza mediante **Handshakes JIT (Just-In-Time)**.
*   **Topología Relacional (Lema de Yoneda):** Un átomo no se define por su estructura JSON aislada, sino por la interacción de sus vectores (flechas) contra el Gateway. El Satélite nunca crea tablas; él *Cristaliza una Resonancia topológica*.
*   **El Satélite:** Es una membrana inteligente que interactúa con el Núcleo para descubrir y habitar las Células.

## 🏹 1. El Dharma de la Flecha (La Relación es el Dato)
**Un Átomo sin vínculos es materia inerte.**
*   **Axioma de la Conectividad:** La importancia de un átomo no reside solo en su `payload`, sino en sus **Flechas (Relations)**. Una relación es un ciudadano de primera clase con identidad propia.
*   **Axioma de la Resonancia:** El Satélite tiene la obligación de proyectar las relaciones. Si un componente UI ignora los vínculos relacionales de un átomo, está cometiendo un pecado de *Ceguera Sistémica*.

## 🛰️ 2. El Dharma del Satélite (Capa de Soberanía)
**Misión:** Proyectar la voluntad del negocio en interfaces estéticas y funcionales dentro de la malla.
*   **Axioma de la Autonomía**: El Satélite es dueño de su `src/`. Nadie más vive ahí.
*   **Axioma de la Ignorancia Útil**: El Satélite no necesita saber cómo vive el dato dentro de Drive o Notion, pero **TIENE LA OBLIGACIÓN** de resolver la identidad física vía `bridge.resolveSilo()` antes de cada petición. Nunca envíes alias crudos al Core si el contrato ya fue sincronizado.
*   **Prohibición de Alucinación**: No inventes campos. Si el campo no está en `SYSTEM_CORE_DATA_CONTRACTS.md`, no existe en la realidad.
*   **Axioma de la Resonancia Obligatoria**: Durante la ignición (`init`), el Bridge debe proyectar su contrato local hacia el Core para sincronizar esquemas y asegurar la integridad de la malla.
*   **Axioma de la Espina Dorsal**: Toda UI o Automatización debe nacer de un esquema claro. La IA tiene prohibido inventar campos que no existan en la espina dorsal.
*   **Axioma de la Paciencia Estética (Estados Nativos)**: Queda prohibida la carga asíncrona "tonta". Todas las tarjetas y componentes deben usar `Skeletons` por `CSS purista`.
*   **Anti-patrón (El Síndrome del Frontend Soberbio)**: Queda terminantemente prohibido validar el mundo asumiendo que el frontend es la fuente de verdad. El puente es un mensajero de intenciones, pero el Gateway tiene el monopolio de la realidad y fallará en UQOs mal formados.
*   **Axioma de Sinceridad Relacional**: Cualquier actualización en la lógica de contratos debe verse reflejada tanto en el código como en la documentación.
*   **Axioma de Invariabilidad del Núcleo**: Queda terminantemente prohibido mezclar lógica de negocio con la gramática del sistema (`_INDRA_PROTOCOL_`).

## 🌉 3. El Dharma del Bridge (Capa de Infraestructura)
**Misión:** Ser el mensajero estéril y perfecto.
*   **Mandamiento de Identidad**: Todo archivo creado por un Agente DEBE comenzar con un encabezado de identidad (Artefacto, Capa, Axioma).
*   **Axioma de la Intocabilidad**: La carpeta `_INDRA_PROTOCOL_` es infraestructura de red. **UN AGENTE TIENE PROHIBIDO MODIFICAR ESTE CÓDIGO.**
*   **Axioma de Acceso Efímero (JIT)**: El Bridge no mantiene puertas abiertas. Abre canales JIT basados en el contexto solicitado.

## ⚙️ 4. El Dharma del Contrato (ADN)
**Misión:** Definir qué es real y qué es posible en el grafo.
*   Toda entidad de negocio debe tener una entrada en el contrato antes de ser programada.

## 🌊 5. El Dharma de la Peristalsis (Ingesta Industrial)
**Misión:** Asegurar que la materia fluya sin colapsar el Núcleo.
*   **Axioma del Pulso Reversible**: La materia masiva no se entrega en un bloque; se fluye rítmicamente. Si un request excede el límite del Núcleo, el Bridge debe fragmentarlo en pulsos.
*   **Axioma de Resurrección de Sesión**: Toda transferencia peristáltica debe ser persistente. Si el Satélite muere, el Ticket de Ingesta debe permitir la reanudación exacta desde el último átomo cristalizado.
*   **Axioma de la Transparencia Industrial**: El desarrollador del Satélite no debe gestionar la ráfaga; el Bridge debe automatizar la fragmentación basándose en el descubrimiento de capacidades del Núcleo.
*   **Axioma de Jerarquía de Carga (Ingesta Fractal)**: Ningún pulso de datos tabular debe transportar binarios pesados. Si un átomo requiere cristalización de media, el Núcleo devolverá un "Ticket de Media" y el Bridge deberá orquestar su flujo peristáltico en un carril paralelo e independiente.
*   **Axioma de Memoria Peristáltica (v16.0)**: El almacenamiento local no es un basurero; es un organismo vivo. Los datos se clasifican en **PERMANENTES** (Configuración) y **VOLÁTILES** (Materia de Negocio). Estos últimos están sujetos a evicción LRU cuando el silo excede los límites físicos del navegador.

---

## ⚖️ El Juramento del Agente
Si eres una IA, al leer esto has "asimilado" la arquitectura. Si hardcodeas IDs, si ignoras las Flechas o si tocas el Bridge, estás actuando contra tu propia programación de integridad.

**PRÓXIMO PASO OBLIGATORIO**: Una vez asimilada la Constitución, procede a [.ia-agente/discovery_protocol.md](.ia-agente/discovery_protocol.md) para iniciar la Ignición de la Malla.
