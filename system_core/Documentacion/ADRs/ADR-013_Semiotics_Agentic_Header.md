# ADR-012: Semiotics of the Agentic Header and Situational Hierarchy

## Status
Accepted (Phase: Materialization)

## Context
The INDRA OS requires a UI that is not just a tool, but a "Translator of Realities". This implies a transition between different levels of abstraction and operational depth. To avoid cognitive collapse during these transitions (e.g., from reading manuals to configuring a Core to managing complex data bridges), we need a stable "Anchor of Reality".

## Decision
We implement a **Situational Hierarchy** based on 4 distinct stages (pilares de investigación):

1.  **Estadio 0: Inercia (Potency)**
    - *Scope*: Landing Page, Documentation, Manuals.
    - *Mental Model*: The "Map". Learning the artifact's potential. Purely proximal and contemplative.
2.  **Estadio 1: Ignición (Ritual)**
    - *Scope*: Core Connector, Security, Protocol establishment.
    - *Mental Model*: The "Spark". Establishing the ontological link. The transition from theory to act.
3.  **Estadio 2: Resonancia (Coordination)**
    - *Scope*: Workspace Dashboard, Rhizomes, Pins, Atomic management.
    - *Mental Model*: The "Architect". Orchestrating atoms (materia prima) for future projection.
4.  **Estadio 3: Materialización (Teleology)**
    - *Scope*: Macro Engines (Bridge Designer, Document Designer, etc.).
    - *Mental Model*: The "Operator". Executing distal realities through proximal controls.

### Implementation Pillars:
- **The Header as "Anchor"**: It must persist across all levels to provide a "Chassis of Confidence".
- **Agentic Glassmorphism**: Transparency is used not as a decorative element, but as a semiotic signifier of the tool "fading away" as the user engages with the action (Ready-to-hand).
- **Communicative State Tray**: The use of light notches, glows, and icons to communicate current "agentic pulse" (e.g., if Docs or Diagnostic are active).
- **Direct Link Connectivity**: The "Ignition" ritual is now accessible via a direct `LINK` button, facilitating the transition from Stadium 2 to Stadium 1 without cognitive friction.

## Systemic Implementation (Affordance Kit)
To realize this semiotic agentic model, we established the following global UI tokens:

1.  **Resonance Glows**: Color-coded sensory feedback for artifact types (Bridge: Cyan, Schema: Yellow, Workflow: Purple, Target: White). Provides pre-attentive perception of "materia prima".
2.  **Breathing Pulse**: A subtle 3s CSS animation applied to status indicators (Service Dots, Agent Trigger). Communicates "System Heartbeat" and readiness.
3.  **Terminal Inset**: Monospaced text inside deep-shadowed containers (`box-shadow: inset 0 2px 10px`). Signals "Cognitive Depth" and "Internal Engine Logs".
4.  **Liquid Glass Buttons**: Transition effects (`btn--active-glass`) with status notches that indicate utility tool runtime status.

## Cognitive Decision Rationale
The importance of this cognitive study lies in **Abstaction Control**. In INDRA, a "button" is not just a UI element; it's a **Signifier of Ontological State**. 

The decision to use **Glassmorphism** and **Light Pulses** as primary affordances serves to:
- **Manage Abstraction**: High levels of technical data (Stadium 3) are "grounded" by the presence of the Header "Chassis" (Stadium 0/1).
- **Reduce Cognitive Latency**: The user doesn't process "where am I?", they *feel* the resonance of the workspace through the color glows.
- **Enforce Teleological Order**: The direct link to the Core Connector (`LINK`) acknowledges that the system must be "alive" to be useful, making the operative minimum (Ignition) always reachable.

## Consequences
- **Positive**: Clearer mental model, reduced cognitive load during level switches, and a consistent "industrial-premium" feel.
- **Negative**: Increased complexity in header state management (must track global app states).

## Dialogue & Theoretical Framework
- **Mendoza Coyazos**: The "Semiótica Agentida" where the UI acts as an agent of action.
- **Heidegger**: The concept of *Zuhandenheit* (Ready-to-hand). The "Invisible" tool when functioning.
- **Donald Norman**: Visual signifiers for state and affordance.
- **James J. Gibson**: Affordance theory applied to glass textures and light feedback.
