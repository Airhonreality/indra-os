# ADR-007: Indexación Espacial mediante R-Tree
> **Estado:** Aceptado
> **Contexto:** Con miles de entidades en el lienzo, la detección de clics (Hit Detection) mediante búsqueda lineal degradaba el rendimiento del hilo principal.

## ⚖️ Decisión
Delegar la gestión del espacio bidimensional a una estructura de datos de **R-Tree** dentro del Kernel:

1. **Eficiencia:** Cambiar la complejidad de búsqueda de $O(N)$ a **$O(\log N)$**.
2. **Mantenimiento:** El R-Tree se actualiza automáticamente cada vez que una entidad cambia su masa milimétrica (Geometry).
3. **Puntualidad:** El motor de eventos captura el `PointerEvent` y consulta al R-Tree para obtener instantáneamente la entidad afectada.

## ✅ Consecuencias
- **Positivas:** Capacidad de manejar >10.000 entidades interactivas con latencia de respuesta inferior a 16ms.
- **Negativas:** Incremento en el consumo de memoria para mantener el árbol de rectángulos balanceado.
