# ADR-016: Gatekeeper de Hidratación (Sincronía Alfa-Beta)
> **Estado:** Aceptado
> **Contexto:** El arranque simultáneo de los canales Alfa (Consistencia) y Beta (Telemetría) genera una condición de carrera donde la cámara puede renderizarse en (0,0) antes de recuperar la posición real del disco.

## ⚖️ Decisión
Implementar un semáforo de inicio de ciclo:
1. **Estado Parked:** El `telemetryStore` inicia con el flag `is_parked: true`.
2. **Bloqueo de rAF:** El loop de `requestAnimationFrame` comprueba este flag; si es true, no actualiza ni inyecta variables CSS.
3. **Liberación Alfa:** Solo cuando `indraStore` emite el evento `ALPHA_HYDRATED` (tras cargar el manifiesto), se muta `is_parked` a `false`.
4. **Fundido de Entrada:** El chasis utiliza una transición de opacidad vinculada a este cambio para que la interface aparezca solo cuando la geometría es estable.

## ✅ Consecuencias
- **Positivas:** Eliminación de "Flashes del Vacío". Experiencia de arranque premium y estable.
- **Negativas:** Introduce una dependencia explícita entre el Store de telemetría y el de persistencia durante el boot.
