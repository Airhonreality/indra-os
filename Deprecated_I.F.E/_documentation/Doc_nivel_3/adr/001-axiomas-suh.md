# ADR-001: Principios Axiomáticos SUH
> **Estado:** Aceptado
> **Capa:** Filosofía de Diseño / Arquitectura Core

## ⚖️ Decisión
El sistema INDRA OS debe regirse por tres axiomas inmutables (SUH) que actúan como el "Dharma" del desarrollo:

1. **Simplicidad (S):** El código debe ser atómico, legible y sin "magia". Se prefiere la claridad sobre la brevedad excesiva. Ninguna función debe intentar hacer más de una cosa.
2. **Universalidad (U):** Los componentes y la lógica del Kernel deben ser agnósticos al contenido. Todo dato es una "Partícula" (UniversalItem) y todo componente visual es un "Chasis" (Entity) capaz de contener cualquier dato.
3. **Armonía (H):** Desacoplamiento total entre las capas de Datos (Bóvedas), Lógica (Flujos) y Presentación (Satélites). La UI es un reflejo pasivo del estado orquestado por el Kernel.

## ✅ Consecuencias
- **Positivas:** Escalabilidad extrema. El sistema puede integrar nuevos adaptadores (Notion, Drive, etc.) sin modificar la UI.
- **Negativas:** Requiere un rigor técnico mayor y evita soluciones rápidas ("hacks") que violen el desacoplamiento.
