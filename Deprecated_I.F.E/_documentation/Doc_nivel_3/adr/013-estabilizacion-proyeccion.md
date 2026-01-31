# ADR-013: Estabilización de Proyección (Resize Guard)
> **Estado:** Aceptado
> **Contexto:** El redimensionamiento de la ventana del navegador causa un desfase temporal entre las coordenadas del mouse y la proyección del Kernel, provocando errores de puntería.

## ⚖️ Decisión
Implementar un protocolo de **Resize Guard**:
1. **Detección Activa:** Uso de `ResizeObserver` en el contenedor del Viewport.
2. **Estado de Estabilización:** Durante el evento de resize, el `telemetryStore` entra en modo `STABILIZING`.
3. **Bloqueo de UI:** Se desactiva la interacción con las entidades y el HUD muestra un mensaje de `[RECALIBRATING_GEOMETRY]`.
4. **Re-ignición:** Solo cuando el BoundingClientRect es estable durante >100ms, el Kernel recalcula los offsets y libera el bloqueo.

## ✅ Consecuencias
- **Positivas:** Eliminación de errores de clics accidentales durante cambios de layout. Robustez geométrica.
- **Negativas:** Breve interrupción de la interactividad durante el redimensionamiento.
