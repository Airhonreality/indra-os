# SDR-004: Interacción Cinética de Intencionalidad (Kinetic Intent)

**Estado:** ACEPTADO  
**Fecha:** 2026-02-10  
**Autor:** Antigravity (Alpha Agent)  
**Contexto:** UX/UI Soberana (Indra OS)

## 1. Contexto y Problema
Los diálogos de confirmación tradicionales ("¿Está seguro de querer borrar esto? [Sí/No]") son reliquias de interfaces pasivas. Representan una interrupción abrupta del "Flow State" (Estado de Flujo) del operador, forzando un cambio de contexto cognitivo innecesario.

En un entorno operativo de alta velocidad como Indra OS, la seguridad no debe provenir de la burocracia visual (clics adicionales), sino de la **intencionalidad física**.

## 2. Decisión
Adoptar el patrón **"Hold-to-Confirm" (Mantener para Confirmar)** como el estándar canónico para todas las acciones destructivas o irreversibles dentro del sistema.

Este patrón reemplaza la interrogación pasiva por un compromiso activo:
*   **Acción:** El usuario debe mantener presionado el activador durante un tiempo determinado (Umbral de Intención).
*   **Feedback:** El sistema debe proporcionar retroalimentación visual continua e inmediata del progreso de la acción (llenado de anillo, barra de carga, intensificación de color).
*   **Cancelación:** Soltar el activador antes de completar el ciclo cancela la acción instantáneamente y sin penalización.

## 3. Especificaciones Técnicas
*   **Umbral de Tiempo (Time-to-Kill):** 1.5 segundos (1500ms).
*   **Visualización:**
    *   Preferentemente un anillo de progreso (SVG `stroke-dashoffset`) alrededor del icono de acción.
    *   Alternativamente, un llenado de fondo del botón.
*   **Estados:**
    1.  `IDLE`: Estado de reposo. Opacidad reducida.
    2.  `CHARGING`: El usuario ha iniciado la presión. Animación de carga activa.
    3.  `CRITICAL`: Cerca del completado (>80%). Cambio de color (e.g., a rojo intenso).
    4.  `DISCHARGED`: Acción ejecutada. Feedback de éxito (explosión/desaparición).
*   **Disparadores:** MouseDown / TouchStart (Inicio), MouseUp / MouseLeave / TouchEnd (Cancelación).

## 4. Consecuencias
*   **Positivas:**
    *   Eliminación total de modales obstructivos ("Dialogs of the 90s").
    *   Sensación "física" de manipulación de materia digital.
    *   Reducción de clics accidentales.
    *   Mantenimiento del foco visual en el objeto manipulado, no en un modal externo.
*   **Negativas:**
    *   Requiere aprendizaje inicial (descubribilidad). Se mitiga con tooltips o micro-animaciones al hacer hover.
    *   Ligeramente más lento que un clic rápido + enter (pero más seguro).

## 5. Referencias
*   Inspirado en mecánicas de desmantelamiento en videojuegos y sistemas operativos táctiles modernos.
