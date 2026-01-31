# ADR-006: Protocolo de Inicialización Airlock
> **Estado:** Aceptado
> **Contexto:** El arranque simultáneo del Kernel (datos) y la UI (React) causaba condiciones de carrera y errores de hidratación.

## ⚖️ Decisión
Adoptar el patrón **Airlock** para un arranque secuencial y determinista del sistema:

1. **Estado Bloqueado:** La UI no se monta hasta que el Kernel emite la señal `AIRLOCK_READY`.
2. **Secuencia de Fases:**
   - **Boot:** Reservar memoria y arrancar el motor lógico.
   - **Bridge:** Establecer el canal de comunicación Neutrón.
   - **Hatch:** Una vez validado el canal, React monta el root component.

## ✅ Consecuencias
- **Positivas:** Estabilidad absoluta durante el arranque. Eliminación de errores de "variable undefined" en componentes que dependen del Kernel.
- **Negativas:** Introduce una pantalla de carga obligatoria (Splash Screen) mientras el Kernel se calienta.
