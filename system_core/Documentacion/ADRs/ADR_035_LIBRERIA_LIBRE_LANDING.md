# ADR 035 - TOOLS DOCK (Librería Libre)

## Status
Proposed (2026-03-30)

## Context
Indra OS is evolving from a monolithic core towards a more modular, "free-tool" approach. The user wants to expose individual macro-engines (like Video Engine, Schema Designer, etc.) as standalone modules accessible from the landing page. This section, poetically named "Librería Libre" (Free Library) for humans and "ToolsDockTab" for the system, lists engines as cards with UI previews, descriptions, and two primary actions: "Open Tool Engine" (agnostic mode) and "More Information" (technical documentation).

## Decision
1. **Technical Nomenclature**: Rename the component to `ToolsDockTab.jsx` to maintain technical consistency while keeping the poetic name for the UI.
2. **Card-Based UI**: Implement a grid of premium cards featuring:
    - High-quality UI mockups (styled visuals).
    - Modular descriptions.
    - Tokenized CSS following the system's "Solar Punk / Axiomatic" aesthetic.
3. **Canonical Documentation Layout**: Create a dedicated, aesthetically pleasing view for module documentation, including axioms, design principles, code snippets, and activation details.

## Consequences
- **Positive**: Standardizes the "Free Tool" architecture across the landing page.
- **Positive**: Enhances discovery of Indra's capabilities for new users without requiring immediate installation.
- **Negative**: Adds more content maintenance for each engine's documentation.

## Implementation Details
- **Location**: `Landing/ToolsDockTab.jsx`
- **Data Model**: Static list of tools integrated with `useAppState.openToolEngine`.
- **Style**: Axiomatic patterns, glassmorphism, and Syncopate/Outfit typography.
