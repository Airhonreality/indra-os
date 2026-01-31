# ADR-003: Canal Beta - Telemetría Transitoria (Bypass React)
> **Estado:** Aceptado
> **Contexto:** Las actualizaciones de alta frecuencia (movimiento del mouse, pan, zoom) causaban caídas de FPS al pasar por el ciclo de reconciliación de React.

## ⚖️ Decisión
Implementar una arquitectura de "Canal Dual" para la gestión del estado:

1. **Canal Alfa (Consistencia):** Gestionado por el `indraStore` (Zustand). Almacena el árbol del lienzo, identidades y configuraciones. Provoca re-renders controlados de React.
2. **Canal Beta (Telemetría):** Gestionado mediante suscripciones directas de Zustand (`.subscribe`). Este canal actualiza directamente las propiedades del DOM (vía `refs`) o del Canvas 2D, **omitiendo el ciclo de React**.

## ✅ Consecuencias
- **Positivas:** Interacción a 60 FPS constantes incluso con miles de entidades en pantalla. Fluidez de grado industrial (estilo Figma).
- **Negativas:** Desacopla la lógica de renderizado de la "vía fácil" de React, requiriendo el uso de Refs y acceso imperativo al DOM.
