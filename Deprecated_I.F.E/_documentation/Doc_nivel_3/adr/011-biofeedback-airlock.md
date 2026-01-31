# ADR-011: Biofeedback en Protocolo Airlock
> **Estado:** Aceptado
> **Contexto:** Las pantallas de carga estáticas generan ansiedad en el operador. INDRA requiere un feedback honesto sobre la salud del sistema.

## ⚖️ Decisión
El componente `Airlock` debe manifestar la "Respiración del Sistema":
1. **Onda de Respiración:** Una oscilación senoidal de escala (`scaleZ`) y brillo que representa la actividad del Kernel.
2. **Jitter de Latencia:** La función `Math.sin()` se modula con el `RTT` (Round Trip Time) del Neutrón. 
   - Estabilidad = Respiración profunda y lenta.
   - Inestabilidad = Micro-parpadeos y frecuencia errática.
3. **Escudo de Pánico:** Si el `init()` falla, la respiración se detiene abruptamente antes de mostrar el error, indicando la "muerte" del proceso.

## ✅ Consecuencias
- **Positivas:** Reducción de la ansiedad del operador. Comunicación subconsciente del estado de red.
- **Negativas:** Requiere cálculos matemáticos constantes durante el arranque.
