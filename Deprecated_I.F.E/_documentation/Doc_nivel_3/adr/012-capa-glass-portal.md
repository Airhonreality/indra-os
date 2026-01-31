# ADR-012: Capa de Interacción "Glass Portal"
> **Estado:** Aceptado
> **Contexto:** En la arquitectura Borehole, los componentes React (menus, tooltips) pueden quedar atrapados bajo paneles de UI (Navigator/Inspector) o el HUD si no se gestionan los niveles Z-Index.

## ⚖️ Decisión
Implementar una capa de renderizado suprema llamada **Glass Portal**:
1. **Jerarquía:** Un contenedor `<div id="indra-glass-layer">` que vive al final del body, por encima de todo el chasis.
2. **Teletransporte:** Todos los elementos interactivos efímeros (dropdowns, tooltips, modales de entidad) se renderizan mediante `React.createPortal()` en esta capa.
3. **Posicionamiento:** La posición de estos elementos se calcula proyectivamente desde el Kernel pero se aplica en coordenadas globales de pantalla.

## ✅ Consecuencias
- **Positivas:** Eliminación de recortes visuales ("overflow clipping") en la interface. Coherencia visual total.
- **Negativas:** Desacopla la jerarquía del DOM de la jerarquía de componentes de React, dificultando el manejo de eventos si no se gestionan correctamente.
