# 🛡️ PLAN DE CONTENCIÓN DE ENTROPÍA (MCEP v3.5)

Este plan establece las acciones inmediatas para sellar las fugas de orden detectadas en el ecosistema del satélite.

---

## 1. SELLADO DEL BRIDGE (Blindaje de Infraestructura)
*   **Estado Actual**: Riesgo de "parcheo" con funciones de negocio.
*   **Acción**: Inyectar una advertencia de **"Solo Tránsito"** en el encabezado de `IndraBridge.js`.
*   **Métrica de Éxito**: Ninguna función en el Bridge debe contener nombres de entidades de negocio (ej: `usuarios`, `ventas`).

## 2. ESTANDARIZACIÓN LUMÍNICA (Blindaje Visual)
*   **Estado Actual**: Riesgo de estilos inline y CSS fragmentado.
*   **Acción**: Crear un archivo `src/score/ui/theme.css` que centralice todos los tokens visuales (HUE, SAT, BRIGHT).
*   **Métrica de Éxito**: Los componentes solo pueden usar variables de CSS (`var(--color-primary)`), nunca valores hexadecimales fijos.

## 3. DESACOPLE PERISTÁLTICO (Blindaje de Proceso)
*   **Estado Actual**: Lógica de negocio mezclada con el renderizado de UI.
*   **Acción**: Migrar todas las funciones de "decisión" a archivos independientes dentro de `src/score/logic/`. La UI debe ser un **actuador pasivo**.
*   **Métrica de Éxito**: Poder cambiar el `main.js` completo sin romper la lógica de cálculo del negocio.

## 4. BÓVEDA DE SECRETOS (Blindaje de Seguridad)
*   **Estado Actual**: Riesgo de llaves hardcodeadas en scripts de inicio.
*   **Acción**: Implementar un interceptor en el Bridge que bloquee el envío de datos si detecta una cadena que parezca una `Key` en el código fuente.
*   **Métrica de Éxito**: El comando `npm run ignite` debe ser el único poseedor de la configuración de entorno (vía variables de Vite), nunca los archivos persistentes de Git.

---

### PRÓXIMO PASO OBLIGATORIO:
Limpiar el repositorio de cualquier `key` o `token` que haya quedado en el historial antes de hacer el próximo Push al repositorio maestro.
