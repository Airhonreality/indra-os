# Protocolo de Arquitectura Axiomática (Indra Front-end)

Axioma Central: *"El código no es una intención; es la transmutación de una Ley en Materia mediante un motor de soberanía visual."*

Este documento detalla la integración técnica entre las tres capas fundamentales que permiten la manifestación determinista de la interfaz de INDRA.

---

## Capa 1: El Substrato (Stark Theme CSS)
**Responsabilidad:** Definir las leyes físicas de la materia (Estética, Tokens, Átomos base).

*   **Ubicación:** `src/styles/stark_theme.css`
*   **Función:** No contiene lógica ni conocimiento de los módulos. Es un diccionario de clases canónicas (`.stark-atom-*`) y variables de diseño.
*   **Elementos Clave:**
    *   **Tokens:** Variables CSS para colores (`--accent-primary`), tipografía y espaciado.
    *   **Átomos Base:** Definición visual de inputs, botones de ignición y tickets de datos.
    *   **Normalización:** Reglas críticas para forzar legibilidad en componentes nativos del navegador (ej: dropdowns).

---

## Capa 2: El Transmutador (Axiomatic Interpreter)
**Responsabilidad:** Traducir el DNA (Law) en componentes vivos (React) mediante especialistas funcionales.

*   **Ubicación:** `src/core/ui/AxiomaticTransmuter.jsx` y su directorio `/transmuters/`.
*   **El Orquestador:** Recibe un átomo de ley y decide a qué "Gremio de Especialistas" delegar su manifestación.
*   **Especialistas (Los Gremios):**
    1.  **ActionTransmuter:** Especialista en "Voluntad" (Botones, Triggers).
    2.  **MateriaTransmuter:** Especialista en "Captura" (Inputs, Forms, Selects).
    3.  **SenseTransmuter:** Especialista en "Telemetría" (Status, Progress, Salud).
*   **Función Crítica:** Garantizar el **Bajo Acoplamiento**. Ningún módulo sabe "cómo" se dibuja un botón; solo piden un átomo de tipo `ACTION_IGNITION`.

---

## Capa 3: La Manifestación (Sovereign Modules)
**Responsabilidad:** Declarar la estructura jerárquica basada en la Ley y supervisar su salud.

*   **Ubicación:** `src/modules/Nivel_X_.../` (ej: `IdentityVault.jsx`).
*   **Anatomía de un Módulo:**
    1.  **Llamada al DNA:** Recupera su ley estructural desde el `LawCompiler`.
    2.  **Maquetación de Grupos:** Utiliza un componente de segundo nivel (ej: `AxiomaticGroup`) para iterar sub-módulos.
    3.  **Supervisión SENSE:** Implementa herramientas de diagnóstico (Integrity Matrix) para verificar que los "cables" de la ley estén correctamente conectados al Transmutador.

---

## Flujo de Transmutación (Data Path)
1.  **LEY (JSON):** Define que el módulo tiene un átomo `{ "id": "btn", "type": "ACTION_IGNITION" }`.
2.  **MÓDULO (React):** Recibe la ley e invoca al `AxiomaticTransmuter` pasándole dicho átomo.
3.  **TRANSMUTADOR (Interpreter):** Identifica el tipo, delega al `ActionTransmuter` y este le asigna la clase `.stark-atom-btn-primary`.
4.  **TEMA (CSS):** Aplica los estilos finales (colores, sombras, animaciones).

---

## Auditoría de Fallos (Debugging)
*   **Violación de Estilo:** El cambio debe hacerse en la **Capa 1** (CSS).
*   **Atomo no renderiza:** La falla está en la **Capa 2** (Falta el cable en el Transmutador).
*   **Información errónea:** La falla está en el **DNA** (JSON de la Ley estructural).

*Documento revisado bajo el protocolo de Integridad Axiomática v1.0*
