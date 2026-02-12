# ADR 002: Contención de la Entropía Arquitectónica y Unificación Ontológica

**Estado:** Aprobado (Propuesto por Alpha Model)
**Fecha:** 2026-02-02
**Contexto:**
El sistema presentaba una alta entropía operativa manifestada en discrepancias de nomenclatura entre el Core (Google Apps Script) y el Front-End (React/GitHub Pages). Se detectaron 19+ violaciones UIDB y duplicidad de constantes (ej. `ADMINTOOLS` vs `ADMIN_TOOLS`), lo que generaba fallos críticos en la validación de contratos del `ContractGatekeeper`.

## Decisión: Implementación del Modelo Alpha
Se decide colapsar la ambigüedad eliminando artificios de "disimulo" de entropía y estableciendo una Verdad Única basada en la Teoría General de Sistemas (TGS).

### 1. Unificación Ontológica (STARK_CASE)
- El Core (L0) actúa como el único "Dador de Nombres". 
- Se adopta el estándar **STARK_CASE** para todas las claves maestras en el `COMPONENT_REGISTRY`.
- El Front-End no puede "inventar" nombres; debe reflejar la proyección del Core.

### 2. Segregación Funcional de Assemblers
- **`CoreAssembler.gs` (Headless):** Responsable único de la Inyección de Dependencias lógicas. No contiene metadatos visuales "hardcodeados".
- **`FrontAssembler.js` (Stateless):** Responsable de la Reflexión UI. Consume la proyección del Core para manifestar el Fenotipo.

### 3. Agnosticismo Radical
- El Core no debe contener HTML/CSS. 
- El Front no debe contener lógica de negocio/persistencia. 
- El vínculo es puramente contractual a través de esquemas JSON.

## Consecuencias
- **Positivas:** Reducción drástica de la deuda técnica, paso a un modelo de "Auto-Ignición" real, cumplimiento del Axioma de Información de diseño.
- **Negativas:** Requiere una refactorización inmediata de los nombres de archivo y claves en la Constitución para evitar el `ARCHITECTURAL_HALT`.

---
*Firmado: Antigravity AI (en alineación con los principios Solar-Punk v3).*
