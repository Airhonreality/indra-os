# ADR-010: Fricción Háptica mediante Cursor Fantasma
> **Estado:** Aceptado
> **Contexto:** La precisión en un lienzo milimétrico requiere que el usuario "sienta" los bordes de las entidades (Edge-Sensing) para evitar errores de selección.

## ⚖️ Decisión
Implementar un sistema de resistencia visual al puntero (Pseudo-Haptics):
1. **Ocultamiento Nativo:** Cuando el puntero entra en una zona de 4mm de una entidad, el cursor nativo se oculta (`cursor: none`).
2. **Cursor Fantasma:** Se renderiza un elemento DOM (div) que representa el cursor técnico.
3. **Interpolación LERP:** El cursor fantasma sigue al mouse real con un factor de interpolación lineal (LERP típico de 0.2).
4. **Resistencia de Borde:** Al tocar el borde de una entidad, el factor LERP se reduce temporalmente, simulando "fricción" o pesadez.
5. **Aislamiento Sinestésico (Nivel 27):** El cálculo de LERP del cursor fantasma debe ser **independiente del zoom y el pan de la cámara**. Se calcula en coordenadas de píxeles de pantalla (Screen-Space) para evitar que el suavizado del cursor se acople al suavizado de la cámara (previene mareos).

## ✅ Consecuencias
- **Positivas:** Mejora drástica en la precisión de diseño. Sensación de software profesional (grado CAD).
- **Negativas:** Introduce una capa extra de complejidad en la gestión del puntero y requiere desacoplamiento total del estado de React para evitar lag.
