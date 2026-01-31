# 🏛️ Certificación de Andamiaje Soberano (Front-end v2)

Este documento certifica que el Front-end de Indra OS ha sido ensamblado bajo los principios de la **Capa 0 (Laws)**, asegurando un desacoplamiento total entre la lógica de negocio y la manifestación visual.

## 1. Puntos de Desacoplamiento (The Decoupling Matrix)

El sistema opera bajo tres interfaces ciegas:

| Capa | Responsabilidad | Punto de Conexión |
| :--- | :--- | :--- |
| **0_Laws (Visual)** | Definir tokens, temas y arquetipos. | CSS Variables & `VisualLaws.js` |
| **Logic (Kernel)** | Traducir Blueprints (OMD) a estructuras DOM. | `TranslationKernel.js` |
| **Intuitiva (UI)** | Manifestar datos en "Cajas Vacías" (Scaffolding). | `Shell Slots` (index.html) |

---

## 2. Contratos de Renderizado por Módulo (Atomic Scaffolding)

Se ha verificado que cada bloque del blueprint integral (OMD-01 al OMD-08) tiene un slot reservado y un contrato de hidratación:

### `m01-auth-gate` (Nivel: Acceso)
- **Contrato:** Debe validar la `SYSTEM_CONSTITUTION` antes de permitir la hidratación del resto.
- **Visual:** Clase `auth-gate`, Arquetipo `SCHEMA`.

### `m07-archivist` (Nivel: Estructura)
- **Contrato:** Renderiza el árbol de Cosmos/Proyectos (`Topology_Laws`).
- **Conexión:** Consume directamente del `SensingAdapter` del Core.

### `m03-canvas` (Nivel: Orquestación)
- **Contrato:** Proyecta la `Spatial_Physics`. Soporta drag, zoom y tensión de cables.
- **Agnosticismo:** No sabe qué hay dentro de los nodos, solo sabe cómo moverlos y conectarlos.

---

## 3. Protocolos Anti-Caos (No Hard-Coding)

Para evitar el "Spaghetti UI" y el "Hard Coding", se establecen las siguientes reglas:

1.  **Estilos Prohibidos:** Ningún archivo `.js` debe inyectar estilos `element.style.color`. Todo debe pasar por nombres de clase canónicos definidos en `stark_theme.css`.
2.  **Aislamiento de Cajas:** Los módulos no se conocen entre sí. La comunicación es **Mediada por el Kernel** o por eventos globales del sistema.
3.  **Hidratación Post-Ignición:** Los componentes se renderizan primero como "Cajas Vacías" (`:empty`). El contenido solo aparece cuando el Core inyecta el `MCEPManifest`.

---

## 4. Veredicto de Certificación

El andamiaje es **Puro y Atómico**. Las superficies de la UI están alineadas milimétricamente con los arquetipos de la Capa 1 del Core.

**Certificado por:** Antigravity Architect
**Protocolo:** STARK v7.0 (Front-end Deployment)
