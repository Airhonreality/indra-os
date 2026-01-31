# 🏛️ CONTRATOS TÉCNICOS INMUTABLES (FASE 3 - SELLADO V2)

> **Versión:** 3.5 (Sello de Diamante - Blindaje Total UX V5.3)
> **Dharma:** Blindaje de Ejecución y Fidelidad Terminal.
> **Estatus:** Documento Legal del Sistema.

---

## 🏛️ 1. MECÁNICA DE SUPERVIVENCIA (EDGE FIDELITY)
Para resolver la paradoja de renderizado de PDF sin corromper el Axioma 1 (Soberanía), se establecen dos modos de operación.

### 1.1 Modos de Renderizado

| Modo | Ejecutor | Restricción Técnica | Caso de Uso |
|------|----------|---------------------|-------------|
| **Low-Fi (Automated)** | `GAS_PDF_Adapter` (Backend) | **CSS Subset Estricto** (Sin Flex/Grid). Solo tablas fijas. | Generación masiva en segundo plano, reportes simples. |
| **Hi-Fi (User-Driven)** | Navegador Nativo (Frontend) | **Print CSS Standard**. Soporte completo (Flex/Grid/Auto-layout). | Impresión manual "Ctrl+P", documentos ricos visualmente. |

### 1.2 Regla Axiomática
Esta "inteligencia" del Front se considera **Pura Visualización**.
*   **Declaratividad Estricta:** El modo Hi-Fi debe ser 100% declarativo. El Satélite recibe estilos ya resueltos por el Core.
*   **Prohibición de Decisión:** El Front tiene prohibido ejecutar lógica condicional sobre el dato para alterar la estética (ej: cambiar color basado en un valor > X). La estética es un reflejo de la resolución previa del Core.
*   La lógica de negocio permanece en el Core.

---

## 🏛️ 2. PROTOCOLO DE REFRESCO DE ASSETS (NOTION/DRIVE)
Dado que los adaptadores (ej. Notion) imponen límites de expiración de URLs firmadas (1 hora):

1.  **Responsabilidad del Satélite:** Al detectar una falla de carga (`403 Forbidden` / `401 Unauthorized`) en un asset con `t: 'img'`:
    *   DISPARAR comando `op: REFRESH_ASSET` al Core con el ID del asset.
2.  **Responsabilidad del Core:** El adaptador correspondiente debe generar una nueva firma temporal.
3.  **Throttling de Refresco:** Se prohíben más de **3 intentos** de refresco por asset en un periodo de 60 segundos. Al fallar el tercer intento, el asset se marca como `BROKEN_LINK` y se detiene la propagación de energía.
4.  **Garantía:** Esto asegura que la interfaz se mantenga viva sin que el Satélite tenga que "saber" por qué expiró el token (Agnosticismo) y previene ataques de denegación de servicio (DoS) internos.

---

## 🏛️ 3. MANIFIESTO DE ESTILOS Y SEGURIDAD DOM
Para proteger los motores de renderizado (tanto Low-Fi como Hi-Fi) de colapsos de memoria.

### 3.1 Límites Físicos y Paginación (Renderer Canvas Engine)
*   **Planimetría del Renderer:** El canvas del Renderer Node debe ser No-Recursivo por definición. Los componentes deben ser planos o usar slots pre-definidos.
*   **Límite de Guardrail:** Máximo **12 niveles** de anidación [Elevado V5.1]. Superar este límite deshabilita el renderizado automáticamente.
*   **Tablas:** Prohibido el uso de `table-layout: auto`. Se exige `fixed` para garantizar que el cálculo de ancho sea O(1).
*   **Paginación (Keep-together):** Se prohíbe la fragmentación de Smart Frames entre páginas. Todo bloque contenedor de datos debe saltar íntegramente a la siguiente página si el espacio disponible es insuficiente (Invarianza de Bloque).
*   **Metadata de Autodocumentación:** Todo componente interactivo expuesto en el Renderer **DEBE** portar un atributo de metadata `.hoverDoc`. La omisión de este tag se considera una violación de contrato y desactiva el renderizado del componente en modo producción.
*   **Límites de Desbordamiento (Text Overflow):** La estrategia `expand` solo se permite si el contenedor padre tiene un `Collision_Safety: true`. En su defecto, el sistema forzará `wrap` o `ellipsis` tras superar los **255 caracteres** para evitar colapsos de geometría.

**Aclaración Crítica:** Estos límites aplican al **canvas interno del Renderer Node** donde se diseñan formularios y PDFs. Eidos (Live Preview) solo ejecuta formularios ya diseñados sin restricciones adicionales.

---

## 🏛️ 4. GOBERNANZA DE RELACIONES Y COOLDOWN
Para evitar la saturación del Core por consultas masivas (Joins > 2000 registros).

### 4.1 Protocolo de Penalización
*   **Trigger:** Tras un `ERROR_422` (Exceso de registros).
*   **Acción del Core:** Activa un flag de **Cooldown de 10 segundos** para ese `Identity Key`.

### 4.2 Prevención en Satélite
*   El Front debe capturar el error 422.
*   Mostrar estado **"Saturación de Canal"**.
*   Bloquear el botón de ejecución durante el tiempo de cooldown.

### 4.3 Límites de Memoria Volátil (Recall & Ghost)
*   **Undo Buffer (The Recall):** El Satélite mantendrá un buffer de reversión de máximo **20 acciones**. Superar este límite purgará la acción más antigua para proteger la RAM. 
*   **Densidad de Fantasmas:** Un mismo Smart Frame no puede renderizar más de **50 Ítems Vetados (Ghost State)** simultáneamente. Superar este límite forzará un "Wipe de Rectificación" donde el usuario debe purgar la lista antes de continuar.

---

## 🏛️ 5. INVARIANZA DE LÓGICA (.LOGIC)
Reglas para garantizar la predictibilidad y evitar bucles infinitos en el motor lógico.

1.  **Recursión:** Un archivo `.logic` puede invocar a otro solo hasta **3 niveles** de profundidad.
2.  **Pureza:** Se prohíbe el uso de `Date.now()` o `Math.random()` dentro de un `.logic`.
    *   **Ceguera Temporal:** El archivo `.logic` no tiene permiso de lectura sobre el reloj del sistema.
    *   **Inyección de Verdad:** El Core debe inyectar un `execution_context` en cada llamada que contenga las "Semillas de Verdad" (timestamps o random seeds) necesarias para la invarianza.

---
*Veredicto del Auditor: Con el sellado de la "Planimetría del Eidos" y la "Ceguera Temporal", el sistema alcanza el Cierre de Diamante. Los Contratos Técnicos son ahora la ley inquebrantable de INDRA OS.*
