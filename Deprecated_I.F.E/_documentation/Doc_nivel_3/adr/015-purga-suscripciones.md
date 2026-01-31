# ADR-015: Prevención de Memory Leaks mediante Registro de Suscripciones
> **Estado:** Aceptado
> **Contexto:** En la arquitectura Borehole, los componentes React (Entidades) se montan y desmontan con alta frecuencia. Las suscripciones al `telemetryStore` (Nervio Beta) pueden acumularse si no se limpian correctamente, degradando el rendimiento de 60 FPS.

## ⚖️ Decisión
Implementar un protocolo de **Registro de Vida** para suscripciones:
1. **Suscripción Atómica:** Cada componente debe suscribirse a una porción mínima del estado en el `onMount`.
2. **Registry del Store:** El `telemetryStore` mantendrá un contador interno o un Set de IDs activos.
3. **Auto-Purga:** Si el número de suscriptores excede en un 20% el número de entidades registradas en el `indraStore`, el Kernel emitirá una alerta de `AUDIT_LEAK` y forzará una resincronización de limpieza.
4. **Mandato de Cleanup:** Queda estrictamente prohibido omitir el retorno de limpieza en `useEffect` o en la función de suscripción de Zustand.

## ✅ Consecuencias
- **Positivas:** Estabilidad de rendimiento a largo plazo (sesiones de >4 horas).
- **Negativas:** Introduce una pequeña carga administrativa en el Store para el seguimiento de IDs.
