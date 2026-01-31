# ADR-008: Arquitectura Híbrida Borehole
> **Estado:** Aceptado
> **Contexto:** Renderizar miles de entidades en el DOM de React es ineficiente. Renderizar todo en Canvas dificulta el uso de componentes interactivos complejos (inputs, menús).

## ⚖️ Decisión
Adoptar el patrón **Borehole Renderer**:

1. **Capa de Stage (Fondo):** Un lienzo `<canvas>` 2D o WebGL que dibuja la totalidad de las entidades (geometría, colores base, texto estático) de forma masiva.
2. **Capa de Interacción (Borehole):** Una capa de React que solo monta componentes del DOM para la entidad (o entidades) con la que el usuario está interactuando activamente.
3. **Mecánica:** Al seleccionar una entidad en el Canvas, el sistema "perfora" un hueco y posiciona un componente de React exactamente encima mediante la **Fórmula de Proyección Thorne**.

## ✅ Consecuencias
- **Positivas:** Rendimiento masivo de Canvas combinado con la flexibilidad de componentes de React. Menos presión sobre el Virtual DOM.
- **Negativas:** Requiere una sincronización matemática perfecta entre el bucle de renderizado del Canvas y el estado de posición de los componentes de React.
